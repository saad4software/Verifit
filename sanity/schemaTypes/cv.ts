import { defineArrayMember, defineField, defineType } from 'sanity'

export const cv = defineType({
  name: 'cv',
  title: 'CV',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'CV Title',
      type: 'string',
      validation: (rule) => rule.required(),
      initialValue: 'My CV',
    }),
    defineField({
      name: 'userId',
      title: 'User ID',
      type: 'string',
      validation: (rule) => rule.required(),
      readOnly: true,
    }),
    defineField({
      name: 'isPrimary',
      title: 'Primary CV',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'ingestionStatus',
      title: 'Ingestion Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Extracting Text', value: 'extracting' },
          { title: 'Structuring Content', value: 'structuring' },
          { title: 'Ready', value: 'ready' },
          { title: 'Failed', value: 'failed' },
        ],
      },
      initialValue: 'pending',
    }),
    defineField({
      name: 'rawText',
      title: 'Extracted Raw Text',
      type: 'text',
      rows: 10,
    }),
    defineField({
      name: 'errorMessage',
      title: 'Error Message (if failed)',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'personalInfo',
      title: 'Personal Info',
      type: 'personalInfo',
    }),
    defineField({
      name: 'summary',
      title: 'Professional Summary',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'sections',
      title: 'CV Sections',
      type: 'array',
      of: [
        defineArrayMember({ type: 'workExperienceSection' }),
        defineArrayMember({ type: 'educationSection' }),
        defineArrayMember({ type: 'skillsSection' }),
        defineArrayMember({ type: 'projectsSection' }),
        defineArrayMember({ type: 'certificationsSection' }),
        defineArrayMember({ type: 'languagesSection' }),
        defineArrayMember({ type: 'customSection' }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'personalInfo.fullName',
      isPrimary: 'isPrimary',
      status: 'ingestionStatus',
    },
    prepare({ title, subtitle, isPrimary, status }) {
      return {
        title: `${isPrimary ? '⭐ ' : ''}${title || 'Untitled CV'}`,
        subtitle: `${subtitle || 'No Name'} • [${status || 'draft'}]`,
      }
    },
  },
})
