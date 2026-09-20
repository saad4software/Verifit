import { defineType, defineField, defineArrayMember } from 'sanity'
import {
  fieldCategories,
  requirementCategories,
} from '../../modules/jds/schema'
const strings = (name: string) =>
  defineField({ name, type: 'array', of: [{ type: 'string' }] })
const claimFields = [
  defineField({ name: 'text', type: 'text' }),
  strings('evidence'),
]
export const jdField = defineType({
  name: 'jdField',
  type: 'object',
  fields: [
    defineField({
      name: 'category',
      type: 'string',
      options: { list: [...fieldCategories] },
    }),
    ...claimFields,
  ],
})
export const jdRequirement = defineType({
  name: 'jdRequirement',
  type: 'object',
  fields: [
    defineField({
      name: 'category',
      type: 'string',
      options: { list: [...requirementCategories] },
    }),
    ...claimFields,
    defineField({
      name: 'classification',
      type: 'string',
      options: { list: ['required', 'preferred', 'unspecified'] },
    }),
    defineField({ name: 'groupId', type: 'string' }),
    defineField({ name: 'withinRequirementId', type: 'string' }),
  ],
})
export const jdGroup = defineType({
  name: 'jdGroup',
  type: 'object',
  fields: [
    defineField({
      name: 'operator',
      type: 'string',
      options: { list: ['all', 'any'] },
    }),
    defineField({ name: 'parentGroupId', type: 'string' }),
  ],
})
export const jdContent = defineType({
  name: 'jdContent',
  type: 'object',
  fields: [
    defineField({
      name: 'fields',
      type: 'array',
      of: [defineArrayMember({ type: 'jdField' })],
    }),
    defineField({
      name: 'requirements',
      type: 'array',
      of: [defineArrayMember({ type: 'jdRequirement' })],
    }),
    defineField({
      name: 'groups',
      type: 'array',
      of: [defineArrayMember({ type: 'jdGroup' })],
    }),
  ],
})
export const jdSource = defineType({
  name: 'jdSource',
  type: 'object',
  fields: [
    defineField({ name: 'id', type: 'string' }),
    defineField({ name: 'text', type: 'text' }),
    defineField({ name: 'url', type: 'url' }),
    defineField({
      name: 'origin',
      type: 'string',
      options: { list: ['pasted', 'fetched'] },
    }),
  ],
})
export const jdProcessing = defineType({
  name: 'jdProcessing',
  type: 'object',
  fields: [
    defineField({ name: 'id', type: 'string' }),
    defineField({ name: 'startedAt', type: 'datetime' }),
    defineField({ name: 'stage', type: 'string' }),
    defineField({ name: 'attempt', type: 'number' }),
  ],
})
const versionFields = [
  defineField({ name: 'source', type: 'jdSource' }),
  defineField({ name: 'content', type: 'jdContent' }),
  strings('warnings'),
  strings('findings'),
  defineField({ name: 'processing', type: 'jdProcessing' }),
  defineField({ name: 'error', type: 'text' }),
]
export const jdReplacement = defineType({
  name: 'jdReplacement',
  type: 'object',
  fields: versionFields,
})
export const jd = defineType({
  name: 'jd',
  title: 'Job Description',
  type: 'document',
  readOnly: true,
  fields: [
    defineField({ name: 'userId', type: 'string' }),
    ...versionFields,
    defineField({
      name: 'readiness',
      type: 'string',
      options: { list: ['needs_review', 'ready'] },
    }),
    defineField({ name: 'attempts', type: 'number' }),
    defineField({ name: 'replacement', type: 'jdReplacement' }),
  ],
  preview: {
    select: { title: 'source.url', subtitle: 'readiness' },
    prepare: ({ title, subtitle }) => ({
      title: title || 'Pasted job description',
      subtitle,
    }),
  },
})
// Generation-only targets: noWrite prevents drafts or orphaned source documents.
export const jdGeneration = defineType({
  name: 'jdGeneration',
  type: 'document',
  fields: [
    defineField({
      name: 'assessment',
      type: 'string',
      options: { list: ['single', 'multiple', 'unrelated'] },
    }),
    strings('warnings'),
    defineField({ name: 'content', type: 'jdContent' }),
  ],
})
export const jdSupport = defineType({
  name: 'jdSupport',
  type: 'document',
  fields: [strings('findings')],
})
export const jdTypes = [
  jd,
  jdField,
  jdRequirement,
  jdGroup,
  jdContent,
  jdSource,
  jdProcessing,
  jdReplacement,
  jdGeneration,
  jdSupport,
]
