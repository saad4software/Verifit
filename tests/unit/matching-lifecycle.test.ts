// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { deleteCv, updateCv, processCvBackground } from "@/modules/cvs/service";
import {
  getMockSanityClient,
  resetMockSanityClient,
} from "@/sanity/lib/server-client";
import { deleteJd } from "@/modules/jds/service";
import { scheduleMatching } from "@/modules/matching/scheduling";

const state = vi.hoisted(() => ({
  after: vi.fn(),
  docs: new Map<string, Record<string, unknown>>(),
}));
vi.mock("next/server", () => ({ after: state.after }));
vi.mock("@/modules/cvs/agent", () => ({
  executeCvStructuringAgent: async () => ({
    _id: "cv",
    _type: "cv",
    userId: "u",
    ingestionStatus: "ready",
  }),
}));
vi.mock("@/sanity/lib/jd-client", () => ({
  getJdClient: () => ({
    fetch: async (_query: string, params: Record<string, string>) => {
      const doc = state.docs.get(params.id);
      return doc?.userId === params.userId ? doc : null;
    },
    delete: async (selection: string | { params: Record<string, string> }) => {
      if (typeof selection === "string") state.docs.delete(selection);
      else
        for (const [id, doc] of state.docs) {
          if (
            doc.userId === selection.params.userId &&
            ((doc._type === "cvMatch" &&
              (doc.jd as { _ref: string })._ref === selection.params.id) ||
              (doc._type === "matchJob" && doc.jdId === selection.params.id))
          )
            state.docs.delete(id);
        }
    },
  }),
}));
beforeEach(() => {
  resetMockSanityClient();
  state.docs.clear();
  state.after.mockReset();
  vi.stubEnv("SANITY_MATCH_AGENT_SCHEMA_ID", "matching");
});
afterEach(() => vi.unstubAllEnvs());

it("schedules matching after successful CV structuring and saves", async () => {
  await processCvBackground("cv", "Source");
  expect(state.after).toHaveBeenCalledTimes(1);
  await getMockSanityClient().create({
    _id: "cv",
    _type: "cv",
    userId: "u",
    ingestionStatus: "ready",
  });
  await updateCv("cv", "u", { summary: "React developer" });
  expect(state.after).toHaveBeenCalledTimes(2);
});
it("preserves successful saves if the host cannot schedule background work", async () => {
  state.after.mockImplementation(() => {
    throw new Error("No lifecycle");
  });
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  await getMockSanityClient().create({
    _id: "cv",
    _type: "cv",
    userId: "u",
    ingestionStatus: "ready",
  });
  await expect(
    updateCv("cv", "u", { summary: "Saved" }),
  ).resolves.toMatchObject({ summary: "Saved" });
  log.mockRestore();
});
it("does not schedule billable work when matching is not configured", () => {
  vi.stubEnv("SANITY_MATCH_AGENT_SCHEMA_ID", "");
  scheduleMatching("u", "jd");
  expect(state.after).not.toHaveBeenCalled();
});
it("removes saved CV evidence on deletion without touching another source or user", async () => {
  const client = getMockSanityClient();
  await client.create({ _id: "cv", _type: "cv", userId: "u" });
  await client.create({
    _id: "match",
    _type: "cvMatch",
    userId: "u",
    cv: { _ref: "cv" },
  });
  await client.create({
    _id: "other-cv-match",
    _type: "cvMatch",
    userId: "u",
    cv: { _ref: "other" },
  });
  await client.create({
    _id: "foreign-match",
    _type: "cvMatch",
    userId: "other",
    cv: { _ref: "other" },
  });
  await expect(deleteCv("cv", "other")).rejects.toThrow();
  expect(client.documents.has("match")).toBe(true);
  await deleteCv("cv", "u");
  expect(client.documents.has("cv")).toBe(false);
  expect(client.documents.has("match")).toBe(false);
  expect(client.documents.has("other-cv-match")).toBe(true);
  expect(client.documents.has("foreign-match")).toBe(true);
});
it("removes JD match records and its worker lease after ownership verification", async () => {
  state.docs.set("jd", {
    _id: "jd",
    _type: "jd",
    userId: "u",
    processing: null,
    replacement: null,
  });
  state.docs.set("match", {
    _type: "cvMatch",
    userId: "u",
    jd: { _ref: "jd" },
  });
  state.docs.set("job", { _type: "matchJob", userId: "u", jdId: "jd" });
  state.docs.set("other", {
    _type: "cvMatch",
    userId: "u",
    jd: { _ref: "other" },
  });
  await expect(deleteJd("jd", "other")).rejects.toThrow();
  expect(state.docs.size).toBe(4);
  await deleteJd("jd", "u");
  expect([...state.docs.keys()]).toEqual(["other"]);
});
