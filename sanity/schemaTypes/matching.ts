import { defineType, defineField } from "sanity";
import { statuses } from "../../modules/matching/schema";
const string = (name: string) => defineField({ name, type: "string" });
const strings = (name: string) =>
  defineField({ name, type: "array", of: [{ type: "string" }] });
const number = (name: string) => defineField({ name, type: "number" });
const evidence = defineType({
  name: "matchEvidence",
  type: "object",
  fields: [
    string("path"),
    defineField({ name: "quote", type: "text" }),
    string("label"),
    string("anchor"),
  ],
});
const assessment = defineType({
  name: "requirementAssessment",
  type: "object",
  fields: [
    string("requirementId"),
    defineField({
      name: "status",
      type: "string",
      options: { list: [...statuses] },
    }),
    defineField({ name: "explanation", type: "text" }),
    defineField({
      name: "evidence",
      type: "array",
      of: [{ type: "matchEvidence" }],
    }),
    string("text"),
    string("classification"),
    strings("jdEvidence"),
  ],
});
const assessments = defineField({
  name: "assessments",
  type: "array",
  of: [{ type: "requirementAssessment" }],
});
const generation = defineType({
  name: "matchAssessment",
  type: "document",
  fields: [assessments],
});
const result = defineType({
  name: "matchResult",
  type: "object",
  fields: [
    number("score"),
    number("earned"),
    number("possible"),
    number("evidenceCoverage"),
    strings("requiredGaps"),
    assessments,
    defineField({
      name: "units",
      type: "array",
      of: [
        {
          type: "object",
          name: "matchScoringUnit",
          fields: [
            string("id"),
            string("label"),
            number("earned"),
            number("possible"),
          ],
        },
      ],
    }),
  ],
});
const match = defineType({
  name: "cvMatch",
  title: "CV Match",
  type: "document",
  readOnly: true,
  fields: [
    string("userId"),
    defineField({ name: "jd", type: "reference", to: [{ type: "jd" }] }),
    defineField({ name: "cv", type: "reference", to: [{ type: "cv" }] }),
    string("fingerprint"),
    string("scoringVersion"),
    string("status"),
    defineField({ name: "result", type: "matchResult" }),
    defineField({ name: "error", type: "text" }),
    defineField({ name: "completedAt", type: "datetime" }),
  ],
  preview: {
    select: { title: "cv.title", score: "result.score" },
    prepare: ({ title, score }) => ({
      title: title || "CV match",
      subtitle:
        typeof score === "number"
          ? score + "/100 documented match"
          : "Assessment pending",
    }),
  },
});
const job = defineType({
  name: "matchJob",
  title: "Matching Job",
  type: "document",
  readOnly: true,
  fields: [
    string("userId"),
    string("jdId"),
    string("token"),
    defineField({ name: "leaseUntil", type: "datetime" }),
  ],
});
export const matchingTypes = [
  evidence,
  assessment,
  generation,
  result,
  match,
  job,
];
