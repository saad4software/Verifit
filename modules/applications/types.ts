import { z } from 'zod'
import type { CVDocument } from '@/modules/cvs/types'
import type { Jd } from '@/modules/jds/schema'
import type { MatchRecord } from '@/modules/matching/schema'
import {
  applicationStatuses,
  tailoringStatuses,
  coverLetterTones,
} from '@/sanity/schemaTypes/application'

export type ApplicationStatus = (typeof applicationStatuses)[number]
export type TailoringStatus = (typeof tailoringStatuses)[number]
export type CoverLetterTone = (typeof coverLetterTones)[number]

export interface ApplicationDocument {
  _id: string
  _rev?: string
  _type: 'application'
  _createdAt?: string
  _updatedAt?: string
  userId: string
  title?: string
  status: ApplicationStatus
  tailoringStatus: TailoringStatus
  tailoringError?: string | null
  jd: { _type: 'reference'; _ref: string }
  baseCv: { _type: 'reference'; _ref: string }
  tailoredCv?: { _type: 'reference'; _ref: string } | null
  baselineMatch?: { _type: 'reference'; _ref: string } | null
  tailoredMatch?: { _type: 'reference'; _ref: string } | null
  coverLetter?: string | null
  coverLetterTone?: CoverLetterTone
  notes?: string | null
  appliedAt?: string | null
}

export interface RequirementDelta {
  requirementId: string
  text: string
  classification: string
  baselineStatus: 'met' | 'partial' | 'not_evidenced' | 'not_met'
  tailoredStatus: 'met' | 'partial' | 'not_evidenced' | 'not_met'
  improved: boolean
}

export interface ScoreDelta {
  oldScore: number | null
  newScore: number | null
  scoreDiff: number | null
  gapsClosed: number
  totalRequirements: number
}

export interface PopulatedApplication extends ApplicationDocument {
  jdData?: Jd | null
  baseCvData?: CVDocument | null
  tailoredCvData?: CVDocument | null
  baselineMatchData?: MatchRecord | null
  tailoredMatchData?: MatchRecord | null
  scoreDelta?: ScoreDelta | null
  requirementDeltas?: RequirementDelta[]
}

export const CreateApplicationSchema = z.object({
  jdId: z.string().min(1, 'Job Description is required'),
  cvId: z.string().min(1, 'Base CV is required'),
  title: z.string().optional(),
  status: z.enum(applicationStatuses).optional().default('draft'),
  notes: z.string().optional(),
})

export type CreateApplicationInput = z.input<typeof CreateApplicationSchema>

export const UpdateApplicationSchema = z.object({
  title: z.string().optional(),
  status: z.enum(applicationStatuses).optional(),
  coverLetter: z.string().optional(),
  coverLetterTone: z.enum(coverLetterTones).optional(),
  notes: z.string().optional(),
  appliedAt: z.string().nullable().optional(),
})

export type UpdateApplicationInput = z.infer<typeof UpdateApplicationSchema>

export const GenerateCoverLetterSchema = z.object({
  tone: z.enum(coverLetterTones).optional().default('professional'),
  notes: z.string().optional(),
})

export type GenerateCoverLetterInput = z.infer<typeof GenerateCoverLetterSchema>
