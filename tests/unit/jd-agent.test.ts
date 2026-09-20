// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { structureJd } from "@/modules/jds/agent";
const generate = vi.hoisted(() => vi.fn());
vi.mock("@/sanity/lib/agent-client", () => ({
  getSanityAgentClient: () => ({ agent: { action: { generate } } }),
}));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetAllMocks();
});
function response() {
  return {
    assessment: "single",
    warnings: [],
    content: {
      fields: [],
      requirements: [
        {
          _key: "sanity-a",
          text: "Five years development",
          evidence: ["Five years development"],
          category: "experience",
          classification: "required",
          groupId: "group:0",
        },
        {
          _key: "sanity-b",
          text: "Two years React",
          evidence: ["Two years React"],
          category: "experience",
          classification: "required",
          groupId: "group:1",
          withinRequirementId: "requirement:0",
        },
      ],
      groups: [
        { _key: "sanity-c", operator: "all" },
        { _key: "sanity-d", operator: "any", parentGroupId: "group:0" },
      ],
    },
  };
}
it("resolves generated relationships to the keys returned by Sanity", async () => {
  vi.stubEnv("SANITY_JD_AGENT_SCHEMA_ID", "test-schema");
  generate.mockResolvedValue(response());
  const result = await structureJd(
    "Five years development including Two years React",
  );
  expect(result.content.requirements[0].groupId).toBe("sanity-c");
  expect(result.content.requirements[1]).toMatchObject({
    groupId: "sanity-d",
    withinRequirementId: "sanity-a",
  });
  expect(result.content.groups[1].parentGroupId).toBe("sanity-c");
});
it.each(["group-1", "group:99", "group:-1"])(
  "rejects unresolved relationship %s",
  async (groupId) => {
    vi.stubEnv("SANITY_JD_AGENT_SCHEMA_ID", "test-schema");
    const generated = response();
    generated.content.requirements[0].groupId = groupId;
    generate.mockResolvedValue(generated);
    await expect(structureJd("source")).rejects.toThrow(
      "The agent returned invalid job content",
    );
  },
);
it("rejects a circular relationship after resolving positions", async () => {
  vi.stubEnv("SANITY_JD_AGENT_SCHEMA_ID", "test-schema");
  const generated = response();
  generated.content.requirements[1].withinRequirementId = "requirement:1";
  generate.mockResolvedValue(generated);
  await expect(structureJd("source")).rejects.toThrow(
    "The agent returned invalid job content",
  );
});
