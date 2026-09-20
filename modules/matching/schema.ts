import { z } from "zod";

export const SCORING_VERSION = "requirements-v1";
export const statuses = ["met", "partial", "not_evidenced", "not_met"] as const;
export const AssessmentSchema = z.object({
  assessments: z.array(
    z.object({
      requirementId: z.string().min(1),
      status: z.enum(statuses),
      explanation: z.string().min(1).max(2000),
      evidence: z
        .array(
          z.object({
            path: z.string().min(1),
            quote: z.string().min(1).max(4000),
          }),
        )
        .max(20),
    }),
  ),
});
export type Assessment = z.infer<
  typeof AssessmentSchema
>["assessments"][number];
export type EvidenceField = {
  path: string;
  text: string;
  label: string;
  anchor: string;
};
export type MatchResult = {
  score: number | null;
  earned: number;
  possible: number;
  evidenceCoverage: number;
  requiredGaps: string[];
  assessments: (Omit<Assessment, "evidence"> & {
    text: string;
    classification: string;
    jdEvidence: string[];
    evidence: (Assessment["evidence"][number] & {
      label: string;
      anchor: string;
    })[];
  })[];
  units: { id: string; label: string; earned: number; possible: number }[];
};
export type MatchRecord = {
  _id: string;
  _rev: string;
  _type: "cvMatch";
  userId: string;
  jd: { _type: "reference"; _ref: string };
  cv: { _type: "reference"; _ref: string };
  fingerprint: string;
  scoringVersion: string;
  status: "complete" | "failed";
  result: MatchResult | null;
  error: string | null;
  completedAt: string;
};
export type MatchRow = {
  cvId: string;
  title: string;
  status: "pending" | "complete" | "failed" | "unavailable";
  result: MatchResult | null;
  error: string | null;
  completedAt: string | null;
};
export type MatchList = {
  rows: MatchRow[];
  ready: boolean;
  running: boolean;
  configured: boolean;
};
