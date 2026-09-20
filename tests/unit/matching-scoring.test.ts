// @vitest-environment node
import { describe, expect, it } from "vitest";
import { scoreMatch, cvEvidence } from "@/modules/matching/scoring";
import { fingerprint } from "@/modules/matching/service";
import type { Jd, JdContent } from "@/modules/jds/schema";
import type { CVDocument } from "@/modules/cvs/types";
import type { Assessment } from "@/modules/matching/schema";

const fields = [
  {
    path: "summary",
    text: "React developer with three years experience",
    label: "Summary",
    anchor: "cv-summary",
  },
];
const requirement = (
  _key: string,
  classification: "required" | "preferred" | "unspecified" = "required",
  extra = {},
) => ({
  _key,
  text: _key,
  category: "skills" as const,
  classification,
  evidence: [_key],
  ...extra,
});
const assessment = (
  requirementId: string,
  status: Assessment["status"],
): Assessment => ({
  requirementId,
  status,
  explanation: "Supported by the supplied CV.",
  evidence:
    status === "not_evidenced"
      ? []
      : [{ path: "summary", quote: "React developer" }],
});
const content = (
  requirements: JdContent["requirements"],
  groups: JdContent["groups"] = [],
): JdContent => ({ fields: [], requirements, groups });

describe("documented requirement scoring", () => {
  it("calculates the agreed 64/100 example and keeps missing evidence distinct from mismatch", () => {
    const result = scoreMatch(
      content([
        requirement("React"),
        requirement("Five years"),
        requirement("AWS", "preferred"),
      ]),
      fields,
      {
        assessments: [
          assessment("React", "met"),
          assessment("Five years", "partial"),
          assessment("AWS", "not_evidenced"),
        ],
      },
    );
    expect(result).toMatchObject({
      score: 64,
      earned: 4.5,
      possible: 7,
      evidenceCoverage: 67,
      requiredGaps: ["Five years"],
    });
    expect(result.assessments[2].status).toBe("not_evidenced");
  });
  it("uses the documented default weight for unspecified requirements", () => {
    const result = scoreMatch(
      content([
        requirement("React", "unspecified"),
        requirement("AWS", "preferred"),
      ]),
      fields,
      {
        assessments: [assessment("React", "met"), assessment("AWS", "not_met")],
      },
    );
    expect(result).toMatchObject({
      score: 67,
      possible: 3,
      evidenceCoverage: 100,
    });
  });
  it("counts OR alternatives once and does not flag an unused required alternative", () => {
    const result = scoreMatch(
      content(
        [
          requirement("degree", "required", { groupId: "g" }),
          requirement("experience", "required", { groupId: "g" }),
        ],
        [{ _key: "g", operator: "any" }],
      ),
      fields,
      {
        assessments: [
          assessment("degree", "not_evidenced"),
          assessment("experience", "met"),
        ],
      },
    );
    expect(result).toMatchObject({
      score: 100,
      earned: 3,
      possible: 3,
      requiredGaps: [],
    });
    expect(result.units).toHaveLength(1);
  });
  it("preserves nested AND alternatives instead of choosing just one member of an AND branch", () => {
    const result = scoreMatch(
      content(
        [
          requirement("degree", "required", { groupId: "or" }),
          requirement("years", "required", { groupId: "and" }),
          requirement("certificate", "required", { groupId: "and" }),
        ],
        [
          { _key: "or", operator: "any" },
          { _key: "and", operator: "all", parentGroupId: "or" },
        ],
      ),
      fields,
      {
        assessments: [
          assessment("degree", "not_evidenced"),
          assessment("years", "met"),
          assessment("certificate", "not_evidenced"),
        ],
      },
    );
    expect(result.score).toBe(50);
    expect(result.requiredGaps).toHaveLength(1);
  });
  it("caps nested experience by the evidence for the parent and rejects cyclic requirements", () => {
    const c = content([
      requirement("overall"),
      requirement("nested", "required", { withinRequirementId: "overall" }),
    ]);
    expect(
      scoreMatch(c, fields, {
        assessments: [
          assessment("overall", "partial"),
          assessment("nested", "met"),
        ],
      }).score,
    ).toBe(50);
    c.requirements[0].withinRequirementId = "nested";
    expect(() => scoreMatch(c, fields, { assessments: [] })).toThrow();
  });
  it("returns no score for a JD without requirements, rather than a misleading zero or 100", () => {
    expect(
      scoreMatch(content([]), fields, { assessments: [] }).score,
    ).toBeNull();
  });
  it.each([
    { assessments: [] },
    { assessments: [assessment("React", "met"), assessment("React", "met")] },
    { assessments: [assessment("unknown", "met")] },
    { assessments: [{ ...assessment("React", "met"), evidence: [] }] },
    { assessments: [{ ...assessment("React", "not_met"), evidence: [] }] },
    {
      assessments: [
        {
          ...assessment("React", "met"),
          evidence: [{ path: "summary", quote: "invented skill" }],
        },
      ],
    },
    {
      assessments: [
        {
          ...assessment("React", "met"),
          evidence: [{ path: "email", quote: "React developer" }],
        },
      ],
    },
    {
      assessments: [
        {
          ...assessment("React", "not_evidenced"),
          evidence: [{ path: "summary", quote: "React" }],
        },
      ],
    },
  ])(
    "rejects incomplete, duplicate, fabricated, or unsupported evidence: %#",
    (raw) => {
      expect(() =>
        scoreMatch(content([requirement("React")]), fields, raw),
      ).toThrow();
    },
  );
  it("attaches validated links and original JD excerpts to each assessment", () => {
    expect(
      scoreMatch(content([requirement("React")]), fields, {
        assessments: [assessment("React", "met")],
      }).assessments[0],
    ).toMatchObject({
      jdEvidence: ["React"],
      evidence: [
        {
          label: "Summary",
          anchor: "cv-summary",
          path: "summary",
          quote: "React developer",
        },
      ],
    });
  });
});

const cv: CVDocument = {
  _id: "cv",
  _type: "cv",
  title: "My CV",
  userId: "u",
  isPrimary: true,
  ingestionStatus: "ready",
  rawText: "Old CV",
  summary: "React developer",
  personalInfo: {
    fullName: "Person",
    email: "secret@example.com",
    headline: "Developer",
  },
  sections: [
    {
      _key: "skills",
      _type: "skillsSection",
      groups: [{ categoryName: "Web", skills: ["React"] }],
    },
  ],
};
const jd: Jd = {
  _id: "jd",
  _type: "jd",
  _rev: "r1",
  userId: "u",
  source: { id: "s", origin: "pasted", text: "React" },
  content: content([requirement("React")]),
  warnings: [],
  findings: [],
  processing: null,
  error: null,
  readiness: "ready",
  replacement: null,
  attempts: 1,
};

it("omits identity, contacts, ingestion metadata and superseded raw CV from assessment inputs", () => {
  const evidence = cvEvidence(cv);
  expect(JSON.stringify(evidence)).not.toMatch(
    /secret@example|Person|Old CV|isPrimary/,
  );
  expect(evidence).toContainEqual(
    expect.objectContaining({
      path: "sections.0.groups.0.skills.0",
      text: "React",
      anchor: "cv-section-0",
    }),
  );
});
it("invalidates cached scores on content changes, not display titles or processing metadata", () => {
  expect(fingerprint(jd, cv)).toBe(
    fingerprint(
      { ...jd, _rev: "r2", replacement: { ...jd, processing: null } },
      { ...cv, title: "Renamed", isPrimary: false },
    ),
  );
  expect(fingerprint(jd, cv)).not.toBe(
    fingerprint(jd, { ...cv, summary: "Changed" }),
  );
  expect(fingerprint(jd, cv)).not.toBe(
    fingerprint({ ...jd, content: content([requirement("AWS")]) }, cv),
  );
});
