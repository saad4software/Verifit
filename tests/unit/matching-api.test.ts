// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { GET, POST } from "@/app/api/jds/[id]/matches/route";
import {
  claimMatching,
  runMatching,
  matchSnapshot,
} from "@/modules/matching/service";
import { JdError, type Jd } from "@/modules/jds/schema";
import type { CVDocument } from "@/modules/cvs/types";

const state = vi.hoisted(() => ({
  user: "u" as string | null,
  docs: new Map<string, Record<string, unknown>>(),
  jd: null as Jd | null,
  cvs: [] as CVDocument[],
  revision: 0,
  jobs: [] as (() => Promise<void>)[],
  generate: vi.fn(),
  afterError: false,
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/modules/auth/server", () => ({
  auth: {
    api: {
      getSession: async () =>
        state.user ? { user: { id: state.user } } : null,
    },
  },
}));
vi.mock("next/server", () => ({
  after: (job: () => Promise<void>) => {
    if (state.afterError) throw new Error("No lifecycle");
    state.jobs.push(job);
  },
}));
vi.mock("@/modules/jds/service", () => ({
  getJd: async (id: string, userId: string) => {
    if (state.jd?._id !== id || state.jd.userId !== userId)
      throw new JdError("JD not found.", 404);
    return structuredClone(state.jd);
  },
}));
vi.mock("@/modules/cvs/service", () => ({
  listUserCvs: async (userId: string) =>
    structuredClone(state.cvs.filter((cv) => cv.userId === userId)),
  getCvById: async (id: string, userId: string) => {
    const cv = state.cvs.find((cv) => cv._id === id && cv.userId === userId);
    if (!cv) throw new Error("CV not found");
    return structuredClone(cv);
  },
}));
vi.mock("@/sanity/lib/agent-client", () => ({
  getSanityAgentClient: () => ({
    withConfig: () => ({ agent: { action: { generate: state.generate } } }),
  }),
}));
vi.mock("@/sanity/lib/jd-client", () => ({
  getJdClient: () => ({
    fetch: async (query: string, params: Record<string, string>) => {
      const type = query.includes('_type == "cvMatch"')
        ? "cvMatch"
        : "matchJob";
      const docs = [...state.docs.values()].filter(
        (d) =>
          d._type === type &&
          d.userId === params.userId &&
          (!params.id || d._id === params.id) &&
          (!params.jdId || (d.jd as { _ref: string })._ref === params.jdId),
      );
      return structuredClone(query.includes("[0]") ? (docs[0] ?? null) : docs);
    },
    createIfNotExists: async (doc: Record<string, unknown>) => {
      const id = String(doc._id);
      if (!state.docs.has(id))
        state.docs.set(id, {
          ...structuredClone(doc),
          _rev: String(++state.revision),
        });
      return structuredClone(state.docs.get(id));
    },
    patch: (id: string) => {
      let revision: string;
      let fields: Record<string, unknown>;
      const patch = {
        ifRevisionId: (r: string) => {
          revision = r;
          return patch;
        },
        set: (f: Record<string, unknown>) => {
          fields = f;
          return patch;
        },
        commit: async () => {
          const doc = state.docs.get(id);
          if (!doc || doc._rev !== revision)
            throw Object.assign(new Error("Conflict"), { statusCode: 409 });
          const saved = {
            ...doc,
            ...structuredClone(fields),
            _rev: String(++state.revision),
          };
          state.docs.set(id, saved);
          return structuredClone(saved);
        },
      };
      return patch;
    },
  }),
}));
const context = { params: Promise.resolve({ id: "jd" }) };
const req = (body = {}) =>
  new Request("http://localhost/api/jds/jd/matches", {
    method: "POST",
    body: JSON.stringify(body),
  });
const cv = (id: string, userId = "u"): CVDocument => ({
  _id: id,
  _type: "cv",
  userId,
  title: id,
  isPrimary: false,
  ingestionStatus: "ready",
  summary: "Built React apps",
});
beforeEach(() => {
  state.user = "u";
  state.docs.clear();
  state.jobs = [];
  state.revision = 0;
  state.afterError = false;
  state.jd = {
    _id: "jd",
    _rev: "r1",
    _type: "jd",
    userId: "u",
    readiness: "ready",
    source: { id: "s", origin: "pasted", text: "React required" },
    content: {
      fields: [],
      groups: [],
      requirements: [
        {
          _key: "react",
          category: "skills",
          classification: "required",
          text: "React",
          evidence: ["React required"],
        },
      ],
    },
    processing: null,
    replacement: null,
    error: null,
    attempts: 1,
    findings: [],
    warnings: [],
  };
  state.cvs = [cv("one"), cv("two"), cv("foreign", "other")];
  state.generate
    .mockReset()
    .mockResolvedValue({
      assessments: [
        {
          requirementId: "react",
          status: "met",
          explanation: "Used React.",
          evidence: [{ path: "summary", quote: "Built React apps" }],
        },
      ],
    });
  vi.stubEnv("SANITY_MATCH_AGENT_SCHEMA_ID", "schema-match");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});
async function drain() {
  for (const job of state.jobs.splice(0)) await job();
}

it("isolates private reads and writes and rejects untrusted POST fields", async () => {
  state.user = null;
  expect((await GET(req(), context)).status).toBe(401);
  expect((await POST(req(), context)).status).toBe(401);
  state.user = "other";
  expect((await GET(req(), context)).status).toBe(404);
  expect((await POST(req(), context)).status).toBe(404);
  state.user = "u";
  expect((await POST(req({ userId: "other" }), context)).status).toBe(400);
  expect((await GET(req(), context)).headers.get("Cache-Control")).toContain(
    "no-store",
  );
});

it("lists every owned CV, saves verifiable assessments and serves cached results without AI calls", async () => {
  const before = await matchSnapshot("jd", "u");
  expect(before.rows.map((r) => r.cvId)).toEqual(["one", "two"]);
  expect(before.rows.every((r) => r.status === "pending")).toBe(true);
  expect((await POST(req(), context)).status).toBe(202);
  await drain();
  const after = await matchSnapshot("jd", "u");
  expect(after.rows.every((r) => r.result?.score === 100)).toBe(true);
  expect(after.running).toBe(false);
  await POST(req(), context);
  await drain();
  expect(state.generate).toHaveBeenCalledTimes(2);
  expect(state.generate.mock.calls[0][0]).toMatchObject({
    noWrite: true,
    targetDocument: { _type: "matchAssessment" },
  });
  expect(JSON.stringify(state.generate.mock.calls)).not.toContain("foreign");
});

it("claims one worker across overlapping requests and recovers an expired lease", async () => {
  vi.useFakeTimers();
  const jobs = await Promise.all([
    claimMatching("jd", "u"),
    claimMatching("jd", "u"),
  ]);
  expect(jobs.filter(Boolean)).toHaveLength(1);
  expect(await claimMatching("jd", "u")).toBeNull();
  vi.advanceTimersByTime(301_000);
  expect(await claimMatching("jd", "u")).not.toBeNull();
});

it("processes at most two AI calls concurrently and covers the whole CV library", async () => {
  state.cvs = Array.from({ length: 5 }, (_, i) => cv(String(i)));
  let inflight = 0;
  let peak = 0;
  state.generate.mockImplementation(async () => {
    inflight++;
    peak = Math.max(peak, inflight);
    await Promise.resolve();
    inflight--;
    return {
      assessments: [
        {
          requirementId: "react",
          status: "not_evidenced",
          explanation: "No evidence.",
          evidence: [],
        },
      ],
    };
  });
  await runMatching((await claimMatching("jd", "u"))!);
  expect(peak).toBe(2);
  expect(state.generate).toHaveBeenCalledTimes(5);
});

it("hides stale scores after CV edits and recomputes only changed pairs", async () => {
  await runMatching((await claimMatching("jd", "u"))!);
  state.cvs[0].summary += " and APIs";
  const snapshot = await matchSnapshot("jd", "u");
  expect(snapshot.rows.find((r) => r.cvId === "one")).toMatchObject({
    status: "pending",
    result: null,
  });
  await runMatching((await claimMatching("jd", "u"))!);
  expect(state.generate).toHaveBeenCalledTimes(3);
});

it("discards in-flight results after edits, deletion or loss of JD readiness", async () => {
  state.cvs = [cv("one")];
  state.generate.mockImplementationOnce(async () => {
    state.cvs[0].summary = "Changed CV";
    return {
      assessments: [
        {
          requirementId: "react",
          status: "met",
          explanation: "Used React.",
          evidence: [{ path: "summary", quote: "Built React apps" }],
        },
      ],
    };
  });
  await runMatching((await claimMatching("jd", "u"))!);
  expect((await matchSnapshot("jd", "u")).rows[0]).toMatchObject({
    status: "pending",
    result: null,
  });
  state.generate.mockImplementationOnce(async () => {
    state.cvs = [];
    return { assessments: [] };
  });
  await runMatching((await claimMatching("jd", "u"))!);
  expect(
    [...state.docs.values()].filter((d) => d._type === "cvMatch"),
  ).toHaveLength(0);
  state.cvs = [cv("one")];
  state.generate.mockImplementationOnce(async () => {
    state.jd!.readiness = "needs_review";
    return { assessments: [] };
  });
  await runMatching((await claimMatching("jd", "u"))!);
  expect((await matchSnapshot("jd", "u")).rows[0].status).toBe("unavailable");
});

it("fails fabricated evidence, does not retry automatically, and allows explicit retry", async () => {
  state.cvs = [cv("one")];
  state.generate.mockResolvedValueOnce({
    assessments: [
      {
        requirementId: "react",
        status: "met",
        explanation: "Made up.",
        evidence: [{ path: "summary", quote: "Invented React job" }],
      },
    ],
  });
  await runMatching((await claimMatching("jd", "u"))!);
  expect((await matchSnapshot("jd", "u")).rows[0]).toMatchObject({
    status: "failed",
    result: null,
  });
  expect(await claimMatching("jd", "u")).toBeNull();
  await runMatching((await claimMatching("jd", "u", true))!, true);
  expect((await matchSnapshot("jd", "u")).rows[0].result?.score).toBe(100);
});

it("does not let an expired worker overwrite a newer assessment or release its lease", async () => {
  vi.useFakeTimers();
  state.cvs = [cv("one")];
  const old = (await claimMatching("jd", "u"))!;
  vi.advanceTimersByTime(301_000);
  const newer = (await claimMatching("jd", "u"))!;
  await runMatching(old);
  expect((await matchSnapshot("jd", "u")).running).toBe(true);
  expect((await matchSnapshot("jd", "u")).rows[0].status).toBe("pending");
  await runMatching(newer);
  expect((await matchSnapshot("jd", "u")).rows[0].status).toBe("complete");
});

it("releases a lease if background scheduling fails and explains missing configuration", async () => {
  state.afterError = true;
  expect((await POST(req(), context)).status).toBe(500);
  expect((await matchSnapshot("jd", "u")).running).toBe(false);
  vi.stubEnv("SANITY_MATCH_AGENT_SCHEMA_ID", "");
  expect((await POST(req(), context)).status).toBe(503);
  expect((await matchSnapshot("jd", "u")).configured).toBe(false);
});

it("keeps unprocessed CVs visible but does not assess them before ready", async () => {
  state.cvs[0].ingestionStatus = "failed";
  await runMatching((await claimMatching("jd", "u"))!);
  expect(
    (await matchSnapshot("jd", "u")).rows.find((r) => r.cvId === "one")?.status,
  ).toBe("unavailable");
  expect(state.generate).toHaveBeenCalledTimes(1);
});
