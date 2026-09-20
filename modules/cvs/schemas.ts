import { z } from 'zod'

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
] as const

export const ImportCvInputSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  rawText: z.string().trim().min(1, 'Raw text cannot be empty').optional(),
})

export type ImportCvInput = z.infer<typeof ImportCvInputSchema>

export const UpdateCvInputSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  isPrimary: z.boolean().optional(),
  summary: z.string().optional(),
  personalInfo: z
    .object({
      fullName: z.string().optional(),
      headline: z.string().optional(),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
      location: z.string().optional(),
      website: z.string().url().optional().or(z.literal('')),
      linkedin: z.string().url().optional().or(z.literal('')),
      github: z.string().url().optional().or(z.literal('')),
      twitter: z.string().url().optional().or(z.literal('')),
    })
    .optional(),
  sections: z.array(z.record(z.string(), z.any())).optional(),
})

export type UpdateCvInput = z.infer<typeof UpdateCvInputSchema>
