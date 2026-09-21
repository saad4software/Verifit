import { createHash, randomUUID } from "node:crypto";
import { getJdClient } from "@/sanity/lib/jd-client";
import { getJd } from "@/modules/jds/service";
import { listUserCvs, getCvById } from "@/modules/cvs/service";
import type { CVDocument } from "@/modules/cvs/types";
import { JdError, type Jd } from "@/modules/jds/schema";
import { assessMatch, matchingSchemaId } from "./agent";
import { cvEvidence } from "./scoring";
import {
  SCORING_VERSION,
  type MatchList,
  type MatchRecord,
  type MatchRow,
} from "./schema";

const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const matchId = (jdId: string, cvId: string, userId: string) =>
  "match." + hash([userId, jdId, cvId]);
const jobId = (jdId: string, userId: string) =>
  "matchJob." + hash([userId, jdId]);
const ready = (jd: Jd) =>
  jd.readiness === "ready" && !!jd.content && !jd.processing && !jd.error;
export function fingerprint(jd: Jd, cv: CVDocument) {
  // The month refreshes ongoing duration calculations without rescoring on every view.
  return hash([
    SCORING_VERSION,
    matchingSchemaId(),
    jd.content,
    jd.source.text,
    cvEvidence(cv),
    cv.sections?.some(
      (s) =>
        s._type === "workExperienceSection" && s.items.some((i) => i.isCurrent),
    )
      ? new Date().toISOString().slice(0, 7)
      : null,
  ]);
}
type Job = {
  _id: string;
  _rev: string;
  userId: string;
  jdId: string;
  token: string | null;
  leaseUntil: string | null;
};
function active(job: Job | null) {
  return !!job?.token && Date.parse(job.leaseUntil || "") > Date.now();
}
export async function matchSnapshot(
  jdId: string,
  userId: string,
): Promise<MatchList> {
  const jd = await getJd(jdId, userId);
  const client = getJdClient();
  const [cvs, saved, job] = await Promise.all([
    listUserCvs(userId),
    client.fetch<MatchRecord[]>(
      '*[_type == "cvMatch" && userId == $userId && jd._ref == $jdId]',
      { userId, jdId },
    ),
    client.fetch<Job | null>(
      '*[_type == "matchJob" && _id == $id && userId == $userId][0]',
      { id: jobId(jdId, userId), userId },
    ),
  ]);
  const byCv = new Map(saved.map((m) => [m.cv._ref, m]));
  const rows: MatchRow[] = cvs.map((cv) => {
    const match = byCv.get(cv._id);
    const usable = ready(jd) && cv.ingestionStatus === "ready";
    const current = usable && match?.fingerprint === fingerprint(jd, cv);
    return {
      cvId: cv._id,
      title: cv.title,
      status: !usable ? "unavailable" : current ? match.status : "pending",
      result: current ? match.result : null,
      error: current ? match.error : null,
      completedAt: current ? match.completedAt : null,
    };
  });
  rows.sort(
    (a, b) =>
      (b.result?.score ?? -1) - (a.result?.score ?? -1) ||
      a.title.localeCompare(b.title),
  );
  return {
    rows,
    ready: ready(jd),
    running: active(job),
    configured: !!matchingSchemaId(),
  };
}

/** Cross-process lease: overlapping polls and tabs cannot start duplicate workers. */
export async function claimMatching(
  jdId: string,
  userId: string,
  retryFailed = false,
): Promise<Job | null> {
  const snapshot = await matchSnapshot(jdId, userId);
  if (!snapshot.ready)
    throw new JdError("Confirm the job description before matching.", 409);
  if (!snapshot.configured)
    throw new JdError(
      "Matching setup is incomplete. Configure the Sanity matching schema.",
      503,
    );
  if (
    !snapshot.rows.some(
      (r) => r.status === "pending" || (retryFailed && r.status === "failed"),
    )
  )
    return null;
  const client = getJdClient();
  const id = jobId(jdId, userId);
  await client.createIfNotExists({
    _id: id,
    _type: "matchJob",
    userId,
    jdId,
    token: null,
    leaseUntil: null,
  });
  const job = await client.fetch<Job>(
    '*[_type == "matchJob" && _id == $id && userId == $userId][0]',
    { id, userId },
  );
  if (active(job)) return null;
  try {
    return await client
      .patch(id)
      .ifRevisionId(job._rev)
      .set({
        token: randomUUID(),
        leaseUntil: new Date(Date.now() + 300_000).toISOString(),
      })
      .commit<Job>();
  } catch (error) {
    if (isConflict(error)) return null;
    throw error;
  }
}
function isConflict(error: unknown) {
  return (
    !!error &&
    typeof error === "object" &&
    "statusCode" in error &&
    error.statusCode === 409
  );
}

export async function releaseMatching(job: Job) {
  try {
    await getJdClient()
      .patch(job._id)
      .ifRevisionId(job._rev)
      .set({ token: null, leaseUntil: null })
      .commit();
  } catch (error) {
    if (!isConflict(error)) throw error;
  }
}

/** Bounded background work. Pending pairs persist implicitly and resume on the next visit/poll. */
export async function runMatching(
  job: Job,
  retryFailed = false,
  deadline = Date.now() + 180_000,
) {
  const attempted = new Set<string>();
  try {
    while (Date.now() < deadline) {
      const lease = await getJdClient().fetch<Job | null>(
        '*[_type == "matchJob" && _id == $id && userId == $userId][0]',
        { id: job._id, userId: job.userId },
      );
      if (!active(lease) || lease?.token !== job.token) return;
      const jd = await getJd(job.jdId, job.userId);
      if (!ready(jd)) return;
      const snapshot = await matchSnapshot(job.jdId, job.userId);
      const batch = snapshot.rows
        .filter(
          (r) =>
            !attempted.has(r.cvId) &&
            (r.status === "pending" || (retryFailed && r.status === "failed")),
        )
        .slice(0, 2);
      if (!batch.length) return;
      await Promise.all(
        batch.map(async (row) => {
          attempted.add(row.cvId);
          await processPair(job, jd, row.cvId);
        }),
      );
    }
  } finally {
    await releaseMatching(job);
  }
}

async function processPair(job: Job, jd: Jd, cvId: string) {
  const client = getJdClient();
  const cv = await getCvById(cvId, job.userId).catch(() => null);
  if (!cv || cv.ingestionStatus !== "ready") return;
  const inputFingerprint = fingerprint(jd, cv);
  const id = matchId(jd._id, cvId, job.userId);
  const previous = await client.fetch<MatchRecord | null>(
    '*[_type == "cvMatch" && _id == $id && userId == $userId][0]',
    { id, userId: job.userId },
  );
  let result: MatchRecord["result"] = null;
  let error: string | null = null;
  try {
    result = await assessMatch(jd.content!, cvEvidence(cv));
  } catch {
    error =
      "Assessment could not be verified or the AI service was unavailable. Retry this assessment.";
  }
  // Read fresh sources before writing. Never publish results after edits or deletion.
  const [currentJd, currentCv, lease] = await Promise.all([
    getJd(jd._id, job.userId).catch(() => null),
    getCvById(cvId, job.userId).catch(() => null),
    client.fetch<Job | null>(
      '*[_type == "matchJob" && _id == $id && userId == $userId][0]',
      { id: job._id, userId: job.userId },
    ),
  ]);
  if (
    !currentJd ||
    !currentCv ||
    !ready(currentJd) ||
    currentCv.ingestionStatus !== "ready" ||
    fingerprint(currentJd, currentCv) !== inputFingerprint ||
    lease?.token !== job.token ||
    !active(lease)
  )
    return;
  const fields = {
    userId: job.userId,
    jd: { _type: "reference" as const, _ref: jd._id },
    cv: { _type: "reference" as const, _ref: cvId },
    fingerprint: inputFingerprint,
    scoringVersion: SCORING_VERSION,
    status: result ? ("complete" as const) : ("failed" as const),
    result: result ? keyedResult(result) : null,
    error,
    completedAt: new Date().toISOString(),
  };
  try {
    if (previous)
      await client.patch(id).ifRevisionId(previous._rev).set(fields).commit();
    else
      await client.createIfNotExists({ _id: id, _type: "cvMatch", ...fields });
  } catch (error) {
    if (!isConflict(error)) throw error;
  }
}
function keyedResult(result: NonNullable<MatchRecord["result"]>) {
  return {
    ...result,
    units: result.units.map((u, i) => ({ ...u, _key: "u" + i })),
    assessments: result.assessments.map((a, i) => ({
      ...a,
      _key: "a" + i,
      evidence: a.evidence.map((e, j) => ({ ...e, _key: "e" + j })),
    })),
  };
}

export async function evaluateAndSaveMatch(
  jd: Jd,
  cv: CVDocument,
  userId: string,
): Promise<MatchRecord> {
  const client = getJdClient();
  const inputFingerprint = fingerprint(jd, cv);
  const id = matchId(jd._id, cv._id, userId);
  const previous = await client.fetch<MatchRecord | null>(
    '*[_type == "cvMatch" && _id == $id && userId == $userId][0]',
    { id, userId },
  );
  if (
    previous &&
    previous.fingerprint === inputFingerprint &&
    previous.status === "complete"
  ) {
    return previous;
  }
  let result: MatchRecord["result"] = null;
  let error: string | null = null;
  try {
    if (jd.content?.requirements?.length) {
      result = await assessMatch(jd.content, cvEvidence(cv));
    } else {
      result = null;
    }
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "Assessment could not be verified or the AI service was unavailable.";
  }
  const fields = {
    userId,
    jd: { _type: "reference" as const, _ref: jd._id },
    cv: { _type: "reference" as const, _ref: cv._id },
    fingerprint: inputFingerprint,
    scoringVersion: SCORING_VERSION,
    status: result ? ("complete" as const) : ("failed" as const),
    result: result ? keyedResult(result) : null,
    error,
    completedAt: new Date().toISOString(),
  };
  try {
    if (previous) {
      await client.patch(id).set(fields).commit();
    } else {
      await client.createIfNotExists({ _id: id, _type: "cvMatch", ...fields });
    }
  } catch (err) {
    if (!isConflict(err)) throw err;
  }
  const saved = await client.fetch<MatchRecord | null>(
    '*[_type == "cvMatch" && _id == $id && userId == $userId][0]',
    { id, userId },
  );
  return (
    saved || {
      _id: id,
      _rev: "",
      _type: "cvMatch",
      ...fields,
    }
  );
}

