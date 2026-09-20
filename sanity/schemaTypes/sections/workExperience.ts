import { defineArrayMember, defineField, defineType } from 'sanity'

export const workExperienceItem = defineType({
  name: 'workExperienceItem',
  title: 'Work Experience Item',
  type: 'object',
  fields: [
    defineField({
      name: 'company',
      title: 'Company / Organization',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Job Title / Role',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      title: 'Location (e.g. Remote, City, Country)',
      type: 'string',
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date (e.g. Jan 2022, 2022-01)',
      type: 'string',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date (or Present)',
      type: 'string',
    }),
    defineField({
      name: 'isCurrent',
      title: 'Currently Working Here',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'highlights',
      title: 'Bullet Points / Accomplishments',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'technologies',
      title: 'Technologies / Skills Used',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
  ],
})

export const workExperienceSection = defineType({
  name: 'workExperienceSection',
  title: 'Work Experience Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Work Experience',
    }),
    defineField({
      name: 'items',
      title: 'Experiences',
      type: 'array',
      of: [defineArrayMember({ type: 'workExperienceItem' })],
    }),
  ],
})
