"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { MatchList, MatchResult } from "../schema";

const labels = {
  met: "Met",
  partial: "Partially met",
  not_evidenced: "Not evidenced",
  not_met: "Explicit mismatch",
};
const button =
  "rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50";

export function MatchesPanel({
  jdId,
  revision,
}: {
  jdId: string;
  revision: string;
}) {
  const [data, setData] = useState<MatchList | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const url = "/api/jds/" + encodeURIComponent(jdId) + "/matches";

  const start = useCallback(
    async (retryFailed = false) => {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retryFailed }),
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).error || "Unable to start matching.",
        );
    },
    [url],
  );

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok)
          throw new Error(
            (await response.json()).error || "Unable to load matches.",
          );
        const next: MatchList = await response.json();
        if (cancelled) return;
        setData(next);
        setError("");
        if (
          next.configured &&
          next.ready &&
          !next.running &&
          next.rows.some((r) => r.status === "pending")
        )
          await start();
        // Keep watching for CV edits/imports even when the current list is complete.
        if (!cancelled)
          timer = setTimeout(
            refresh,
            next.running || next.rows.some((r) => r.status === "pending")
              ? 3000
              : 15000,
          );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to refresh matches.",
          );
          timer = setTimeout(refresh, 15000);
        }
      }
    }
    void refresh();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [url, revision, start]);

  async function retry() {
    setBusy(true);
    setError("");
    try {
      await start(true);
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to refresh matches.");
      setData(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to retry.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="matches-heading"
      className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 print:hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="matches-heading" className="text-xl font-bold">
            CV matches
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Documented requirement coverage, with evidence for every assessment.
          </p>
        </div>
        {data?.rows.some((r) => r.status === "failed") && (
          <button
            type="button"
            className={button}
            disabled={busy || data.running || !data.configured || !data.ready}
            onClick={() => void retry()}
          >
            Retry failed assessments
          </button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
      {!data && !error && <p role="status">Loading matches…</p>}
      {data && !data.configured && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Matching needs a one-time Sanity setup. Deploy the matching schema and
          configure it on the server.
        </p>
      )}
      {data && !data.ready && (
        <p>Confirm your job description review to start matching.</p>
      )}
      {data && data.rows.length === 0 && (
        <p>
          No CVs yet.{" "}
          <Link className="text-indigo-600 underline" href="/cvs/import">
            Import a CV
          </Link>{" "}
          to see how it matches.
        </p>
      )}
      {data && data.rows.length > 0 && (
        <>
          <p role="status" className="text-sm text-slate-500">
            {data.rows.filter((r) => r.status === "complete").length} of{" "}
            {data.rows.length} assessed.
            {data.running ? " Assessing CVs in the background…" : ""}
            {" Results refresh after content changes."}
          </p>
          <details className="text-sm text-slate-600 dark:text-slate-300">
            <summary className="cursor-pointer font-semibold">
              How the score works
            </summary>
            <p className="mt-2">
              Required requirements carry 3 points, unspecified requirements 2,
              and preferred requirements 1. Met earns full credit; partial earns
              half; missing evidence and explicit mismatches earn zero. The
              score is earned points divided by possible points, rounded to 100.
              OR alternatives count once using the strongest match; AND groups
              combine their points. Nested experience cannot earn more credit
              than its parent requirement.
            </p>
            <p className="mt-2">
              Missing evidence does not mean the person lacks a skill. Evidence
              coverage reports how many requirements can be assessed from the
              CV. This is a review aid, not a probability of success or an
              automatic hiring decision. Only listed requirements are scored.
            </p>
          </details>
          <div className="space-y-3">
            {data.rows.map((row) => (
              <article
                key={row.cvId}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={"/cvs/" + encodeURIComponent(row.cvId)}
                    className="font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                  >
                    {row.title}
                  </Link>
                  <span className="shrink-0 font-bold tabular-nums">
                    {row.status === "complete"
                      ? row.result?.score == null
                        ? "No scorable requirements"
                        : row.result.score + "/100"
                      : row.status === "pending"
                        ? "Pending"
                        : row.status === "failed"
                          ? "Assessment failed"
                          : "Awaiting ready content"}
                  </span>
                </div>
                {row.error && (
                  <p className="mt-2 text-sm text-rose-600">{row.error}</p>
                )}
                {row.result && (
                  <MatchDetails result={row.result} cvId={row.cvId} />
                )}
                {row.completedAt && (
                  <p className="mt-3 text-xs text-slate-500">
                    Assessed {new Date(row.completedAt).toLocaleString()}
                  </p>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function MatchDetails({ result, cvId }: { result: MatchResult; cvId: string }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-medium">
        View evidence and scoring · {result.evidenceCoverage}% evidence coverage
        · {result.requiredGaps.length} required gaps
      </summary>
      {result.requiredGaps.length > 0 && (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-amber-900">
          <p className="font-semibold">Required qualifications to review</p>
          <ul className="mt-1 list-disc pl-5">
            {result.requiredGaps.map((gap, i) => (
              <li key={i}>{gap}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left">
          <caption className="mb-2 text-left font-semibold">
            Score calculation: {result.earned} / {result.possible} points
          </caption>
          <thead>
            <tr>
              <th scope="col" className="p-2">
                Requirement or qualification group
              </th>
              <th scope="col" className="p-2">
                Points
              </th>
            </tr>
          </thead>
          <tbody>
            {result.units.map((unit) => (
              <tr
                key={unit.id}
                className="border-t border-slate-200 dark:border-slate-700"
              >
                <td className="p-2">{unit.label}</td>
                <td className="whitespace-nowrap p-2">
                  {unit.earned} / {unit.possible}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 space-y-3">
        {result.assessments.map((a) => (
          <div
            key={a.requirementId}
            className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950"
          >
            <div className="flex flex-wrap justify-between gap-2">
              <h3 className="font-semibold">{a.text}</h3>
              <span>
                {labels[a.status]} · {a.classification}
              </span>
            </div>
            <p className="mt-2">{a.explanation}</p>
            <p className="mt-3 font-medium">Job description evidence</p>
            {a.jdEvidence.map((quote, i) => (
              <blockquote
                key={i}
                className="mt-1 border-l-2 border-slate-300 pl-3 text-slate-600 dark:text-slate-300"
              >
                {quote}
              </blockquote>
            ))}
            <p className="mt-3 font-medium">CV evidence</p>
            {a.evidence.length === 0 ? (
              <p className="mt-1 text-slate-500">
                No supporting evidence found in the current CV.
              </p>
            ) : (
              a.evidence.map((e, i) => (
                <blockquote
                  key={i}
                  className="mt-2 border-l-2 border-indigo-300 pl-3"
                >
                  <p>{e.quote}</p>
                  <Link
                    className="mt-1 inline-block text-xs text-indigo-600 underline"
                    href={"/cvs/" + encodeURIComponent(cvId) + "#" + e.anchor}
                  >
                    View {e.label} in CV
                  </Link>
                </blockquote>
              ))
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
