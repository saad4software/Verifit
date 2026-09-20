import type { CVDocument } from "@/modules/cvs/types";
import { ContentSchema, type JdContent } from "@/modules/jds/schema";
import {
  AssessmentSchema,
  type Assessment,
  type EvidenceField,
  type MatchResult,
} from "./schema";

/** Only current, job-relevant fields are assessed. Contact details never enter the prompt. */
export function cvEvidence(cv: CVDocument): EvidenceField[] {
  const fields: EvidenceField[] = [];
  function walk(value: unknown, path: string, label: string, anchor: string) {
    if (typeof value === "string" && value.trim())
      fields.push({ path, text: value, label, anchor });
    else if (value === true && path.endsWith(".isCurrent"))
      fields.push({ path, text: "Present", label, anchor });
    else if (Array.isArray(value))
      value.forEach((item, i) => walk(item, path + "." + i, label, anchor));
    else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) {
        if (
          !key.startsWith("_") &&
          !["url", "repositoryUrl", "credentialUrl"].includes(key)
        )
          walk(item, path + "." + key, label, anchor);
      }
    }
  }
  walk(cv.summary, "summary", "Summary", "cv-summary");
  walk(
    cv.personalInfo?.headline,
    "personalInfo.headline",
    "Headline",
    "cv-header",
  );
  cv.sections?.forEach((section, i) =>
    walk(
      section,
      "sections." + i,
      section.sectionTitle || section._type.replace(/Section$/, ""),
      "cv-section-" + i,
    ),
  );
  return fields;
}

export function validateAssessments(
  content: JdContent,
  fields: EvidenceField[],
  input: unknown,
): Assessment[] {
  const { assessments } = AssessmentSchema.parse(input);
  const expected = new Set(content.requirements.map((r) => r._key));
  const actual = new Set(assessments.map((a) => a.requirementId));
  if (
    assessments.length !== expected.size ||
    actual.size !== expected.size ||
    [...actual].some((id) => !expected.has(id))
  )
    throw new Error(
      "The assessment did not cover each requirement exactly once.",
    );
  const sources = new Map(fields.map((f) => [f.path, f.text]));
  for (const assessment of assessments) {
    if (assessment.status !== "not_evidenced" && !assessment.evidence.length)
      throw new Error(
        "An assessment claimed a match or mismatch without evidence.",
      );
    if (assessment.status === "not_evidenced" && assessment.evidence.length)
      throw new Error(
        "A missing-evidence assessment unexpectedly included evidence.",
      );
    if (
      assessment.evidence.some((e) => !sources.get(e.path)?.includes(e.quote))
    )
      throw new Error(
        "An assessment cited evidence that is not in the current CV.",
      );
  }
  return assessments;
}

/** AI supplies evidence judgments; this rubric owns all arithmetic and group semantics. */
export function scoreMatch(
  input: JdContent,
  fields: EvidenceField[],
  raw: unknown,
): MatchResult {
  const content = ContentSchema.parse(input);
  const assessments = validateAssessments(content, fields, raw);
  const byId = new Map(assessments.map((a) => [a.requirementId, a]));
  const requirements = new Map(content.requirements.map((r) => [r._key, r]));
  const weights = { required: 3, unspecified: 2, preferred: 1 };
  const ratios = { met: 1, partial: 0.5, not_evidenced: 0, not_met: 0 };
  function ratio(id: string): number {
    const r = requirements.get(id)!;
    const value = ratios[byId.get(id)!.status];
    return r.withinRequirementId
      ? Math.min(value, ratio(r.withinRequirementId))
      : value;
  }
  type Unit = {
    id: string;
    label: string;
    earned: number;
    possible: number;
    gaps: string[];
  };
  function leaf(r: JdContent["requirements"][number]): Unit {
    const possible = weights[r.classification];
    return {
      id: r._key,
      label: r.text,
      earned: ratio(r._key) * possible,
      possible,
      gaps:
        r.classification === "required" && ratio(r._key) < 1 ? [r.text] : [],
    };
  }
  function group(id: string): Unit | null {
    const g = content.groups.find((g) => g._key === id)!;
    const children = [
      ...content.requirements.filter((r) => r.groupId === id).map(leaf),
      ...content.groups
        .filter((child) => child.parentGroupId === id)
        .map((child) => group(child._key))
        .filter((u): u is Unit => u !== null),
    ];
    if (!children.length) return null;
    const label =
      "(" +
      children
        .map((c) => c.label)
        .join(g.operator === "any" ? " OR " : " AND ") +
      ")";
    if (g.operator === "any") {
      const best = Math.max(...children.map((c) => c.earned / c.possible));
      const possible = Math.max(...children.map((c) => c.possible));
      return {
        id,
        label,
        possible,
        earned: best * possible,
        gaps: best < 1 && children.some((c) => c.gaps.length) ? [label] : [],
      };
    }
    return {
      id,
      label,
      possible: children.reduce((s, c) => s + c.possible, 0),
      earned: children.reduce((s, c) => s + c.earned, 0),
      gaps: children.flatMap((c) => c.gaps),
    };
  }
  const units = [
    ...content.requirements.filter((r) => !r.groupId).map(leaf),
    ...content.groups
      .filter((g) => !g.parentGroupId)
      .map((g) => group(g._key))
      .filter((u): u is Unit => u !== null),
  ];
  const earned = units.reduce((s, u) => s + u.earned, 0);
  const possible = units.reduce((s, u) => s + u.possible, 0);
  return {
    score: possible ? Math.round((100 * earned) / possible) : null,
    earned,
    possible,
    evidenceCoverage: assessments.length
      ? Math.round(
          (100 *
            assessments.filter((a) => a.status !== "not_evidenced").length) /
            assessments.length,
        )
      : 0,
    requiredGaps: units.flatMap((u) => u.gaps),
    units: units.map(({ id, label, earned, possible }) => ({
      id,
      label,
      earned,
      possible,
    })),
    assessments: content.requirements.map((r) => ({
      ...byId.get(r._key)!,
      text: r.text,
      classification: r.classification,
      jdEvidence: r.evidence,
      evidence: byId
        .get(r._key)!
        .evidence.map((e) => ({
          ...e,
          label: fields.find((f) => f.path === e.path)!.label,
          anchor: fields.find((f) => f.path === e.path)!.anchor,
        })),
    })),
  };
}
