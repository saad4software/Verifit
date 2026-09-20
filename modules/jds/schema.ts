import { z } from 'zod'

export const MAX_TEXT = 50_000
export const TextSchema = z
  .string()
  .max(MAX_TEXT, 'Use at most 50,000 characters.')
  .refine((text) => text.trim().length > 0, 'Paste one job ad.')
const evidence = z.array(z.string().min(1)).min(1)
const claim = { _key: z.string().min(1), text: z.string().min(1), evidence }
export const fieldCategories = [
  'title',
  'company',
  'responsibilities',
  'seniority',
  'location',
  'workArrangement',
  'employmentType',
  'compensation',
  'eligibility',
] as const
export const requirementCategories = [
  'skills',
  'experience',
  'education',
  'certifications',
  'languages',
  'eligibility',
] as const
export const ContentSchema = z
  .object({
    fields: z.array(z.object({ ...claim, category: z.enum(fieldCategories) })),
    requirements: z.array(
      z.object({
        ...claim,
        category: z.enum(requirementCategories),
        classification: z.enum(['required', 'preferred', 'unspecified']),
        groupId: z.string().optional(),
        withinRequirementId: z.string().optional(),
      }),
    ),
    groups: z.array(
      z.object({
        _key: z.string().min(1),
        operator: z.enum(['all', 'any']),
        parentGroupId: z.string().optional(),
      }),
    ),
  })
  .superRefine((value, ctx) => {
    const ids = [...value.fields, ...value.requirements, ...value.groups].map(
      (item) => item._key,
    )
    if (new Set(ids).size !== ids.length)
      ctx.addIssue({
        code: 'custom',
        message: 'Each field, requirement, and group needs a unique key.',
      })
    const groups = new Map(value.groups.map((g) => [g._key, g]))
    const requirements = new Map(value.requirements.map((r) => [r._key, r]))
    for (const item of value.requirements) {
      if (item.groupId && !groups.has(item.groupId))
        ctx.addIssue({
          code: 'custom',
          message: 'Unknown qualification group.',
        })
      const seen = new Set([item._key])
      let parent = item.withinRequirementId
      while (parent) {
        if (seen.has(parent) || !requirements.has(parent)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Invalid nested experience relationship.',
          })
          break
        }
        seen.add(parent)
        parent = requirements.get(parent)?.withinRequirementId
      }
    }
    for (const group of value.groups) {
      const seen = new Set([group._key])
      let parent = group.parentGroupId
      while (parent) {
        if (seen.has(parent) || !groups.has(parent)) {
          ctx.addIssue({
            code: 'custom',
            message: 'Invalid qualification group relationship.',
          })
          break
        }
        seen.add(parent)
        parent = groups.get(parent)?.parentGroupId
      }
    }
  })
export const GenerationSchema = z.object({
  assessment: z.enum(['single', 'multiple', 'unrelated']),
  warnings: z.array(z.string()),
  content: ContentSchema,
})
export type JdContent = z.infer<typeof ContentSchema>
export type JdSource = {
  id: string
  text: string
  origin: 'pasted' | 'fetched'
  url?: string
}
export type Processing = {
  id: string
  startedAt: string
  stage: 'extracting' | 'structuring'
  attempt: number
}
export type Version = {
  source: JdSource
  content: JdContent | null
  warnings: string[]
  findings: string[]
  processing: Processing | null
  error: string | null
}
export type Jd = Version & {
  _id: string
  _rev: string
  _type: 'jd'
  userId: string
  readiness: 'needs_review' | 'ready'
  replacement: Version | null
  attempts: number
}
export class JdError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message)
  }
}
export function evidenceFindings(
  content: JdContent,
  source: JdSource,
): string[] {
  return [...content.fields, ...content.requirements].flatMap((claim) =>
    claim.evidence.every((quote) => source.text.includes(quote))
      ? []
      : [
          `${claim.category}: supporting excerpts must occur exactly in the retained source.`,
        ],
  )
}
