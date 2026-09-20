import React from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { MatchesPanel } from "@/modules/matching/components/matches-panel";
import type { MatchList } from "@/modules/matching/schema";

const fetcher = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetcher);
  fetcher.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const response = (body: unknown) => ({ ok: true, json: async () => body });
const empty: MatchList = {
  rows: [],
  ready: true,
  running: false,
  configured: true,
};

it("shows the empty library and import action", async () => {
  fetcher.mockResolvedValue(response(empty));
  render(<MatchesPanel jdId="jd" revision="r" />);
  expect(await screen.findByText(/No CVs yet/)).toBeVisible();
  expect(screen.getByRole("link", { name: "Import a CV" })).toHaveAttribute(
    "href",
    "/cvs/import",
  );
});
it("starts pending work automatically and does not hide CVs awaiting structuring", async () => {
  fetcher.mockImplementation(async (_url, init) =>
    response(
      init?.method === "POST"
        ? { scheduled: true }
        : {
            ...empty,
            rows: [
              {
                cvId: "a",
                title: "CV A",
                status: "pending",
                result: null,
                error: null,
                completedAt: null,
              },
              {
                cvId: "b",
                title: "CV B",
                status: "unavailable",
                result: null,
                error: null,
                completedAt: null,
              },
            ],
          },
    ),
  );
  render(<MatchesPanel jdId="jd" revision="r" />);
  expect(await screen.findByText("Pending")).toBeVisible();
  expect(screen.getByText("Awaiting ready content")).toBeVisible();
  await waitFor(() =>
    expect(fetcher).toHaveBeenCalledWith(
      "/api/jds/jd/matches",
      expect.objectContaining({ method: "POST" }),
    ),
  );
});
it("explains missing setup without attempting AI requests", async () => {
  fetcher.mockResolvedValue(response({ ...empty, configured: false }));
  render(<MatchesPanel jdId="jd" revision="r" />);
  expect(await screen.findByText(/one-time Sanity setup/)).toBeVisible();
  expect(fetcher).toHaveBeenCalledTimes(1);
});
it("renders the exact evidence, arithmetic, gap and CV source link", async () => {
  fetcher.mockResolvedValue(
    response({
      ...empty,
      rows: [
        {
          cvId: "a",
          title: "CV A",
          status: "complete",
          completedAt: null,
          error: null,
          result: {
            score: 50,
            earned: 1.5,
            possible: 3,
            evidenceCoverage: 100,
            requiredGaps: ["React experience"],
            units: [
              {
                id: "react",
                label: "React experience",
                earned: 1.5,
                possible: 3,
              },
            ],
            assessments: [
              {
                requirementId: "react",
                text: "React experience",
                classification: "required",
                status: "partial",
                explanation: "Three years documented; five requested.",
                jdEvidence: ["Five years React required"],
                evidence: [
                  {
                    path: "summary",
                    quote: "Three years with React",
                    label: "Summary",
                    anchor: "cv-summary",
                  },
                ],
              },
            ],
          },
        },
      ],
    }),
  );
  render(<MatchesPanel jdId="jd" revision="r" />);
  expect(await screen.findByText("50/100")).toBeVisible();
  fireEvent.click(screen.getByText(/View evidence and scoring/));
  expect(
    screen.getByText("Three years documented; five requested."),
  ).toBeVisible();
  expect(screen.getByText("Three years with React")).toBeVisible();
  expect(screen.getByText("Five years React required")).toBeVisible();
  expect(
    screen.getByRole("link", { name: "View Summary in CV" }),
  ).toHaveAttribute("href", "/cvs/a#cv-summary");
});
it("provides an explicit retry for failed assessments", async () => {
  fetcher.mockResolvedValue(
    response({
      ...empty,
      rows: [
        {
          cvId: "a",
          title: "A",
          status: "failed",
          result: null,
          error: "Assessment unavailable",
          completedAt: null,
        },
      ],
    }),
  );
  render(<MatchesPanel jdId="jd" revision="r" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Retry failed assessments" }),
  );
  await waitFor(() =>
    expect(fetcher).toHaveBeenCalledWith(
      "/api/jds/jd/matches",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ retryFailed: true }),
      }),
    ),
  );
});
