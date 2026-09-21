import { defineType, defineField } from 'sanity'

export const applicationStatuses = [
  'draft',
  'applied',
  'interviewing',
  'offered',
  'rejected',
] as const

export const tailoringStatuses = [
  'idle',
  'running',
  'completed',
  'failed',
] as const

export const coverLetterTones = [
  'professional',
  'conversational',
  'executive',
] as const

export const application = defineType({
  name: 'application',
  title: 'Job Application',
  type: 'document',
  fields: [
    defineField({
      name: 'userId',
      title: 'User ID',
      type: 'string',
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'title',
      title: 'Application Title',
      type: 'string',
    }),
    defineField({
      name: 'status',
      title: 'Application Status',
      type: 'string',
      options: { list: [...applicationStatuses] },
      initialValue: 'draft',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tailoringStatus',
      title: 'Tailoring Status',
      type: 'string',
      options: { list: [...tailoringStatuses] },
      initialValue: 'idle',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tailoringError',
      title: 'Tailoring Error Message',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'jd',
      title: 'Job Description',
      type: 'reference',
      to: [{ type: 'jd' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'baseCv',
      title: 'Base CV',
      type: 'reference',
      to: [{ type: 'cv' }],
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tailoredCv',
      title: 'Tailored CV',
      type: 'reference',
      to: [{ type: 'cv' }],
    }),
    defineField({
      name: 'baselineMatch',
      title: 'Baseline Match',
      type: 'reference',
      to: [{ type: 'cvMatch' }],
    }),
    defineField({
      name: 'tailoredMatch',
      title: 'Tailored Match',
      type: 'reference',
      to: [{ type: 'cvMatch' }],
    }),
    defineField({
      name: 'coverLetter',
      title: 'Cover Letter',
      type: 'text',
      rows: 12,
    }),
    defineField({
      name: 'coverLetterTone',
      title: 'Cover Letter Tone',
      type: 'string',
      options: { list: [...coverLetterTones] },
      initialValue: 'professional',
    }),
    defineField({
      name: 'notes',
      title: 'Personal Notes',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'appliedAt',
      title: 'Applied Date',
      type: 'datetime',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      status: 'status',
      tailoringStatus: 'tailoringStatus',
    },
    prepare({ title, status, tailoringStatus }) {
      return {
        title: title || 'Untitled Application',
        subtitle: `Status: ${status || 'draft'} • Tailoring: ${tailoringStatus || 'idle'}`,
      }
    },
  },
})

export const applicationGeneration = defineType({
  name: 'applicationGeneration',
  title: 'Application Generation Target',
  type: 'document',
  fields: [
    defineField({
      name: 'coverLetter',
      title: 'Generated Cover Letter',
      type: 'text',
    }),
  ],
})

export const applicationTypes = [application, applicationGeneration]
