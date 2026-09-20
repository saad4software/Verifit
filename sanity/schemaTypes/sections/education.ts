import { defineArrayMember, defineField, defineType } from 'sanity'

export const educationItem = defineType({
  name: 'educationItem',
  title: 'Education Item',
  type: 'object',
  fields: [
    defineField({
      name: 'institution',
      title: 'School / University / Institution',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'degree',
      title: 'Degree (e.g. B.S., M.S., High School)',
      type: 'string',
    }),
    defineField({
      name: 'fieldOfStudy',
      title: 'Field of Study / Major',
      type: 'string',
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'string',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date / Graduation Year',
      type: 'string',
    }),
    defineField({
      name: 'gradeOrHonors',
      title: 'Grade / GPA / Honors',
      type: 'string',
    }),
    defineField({
      name: 'highlights',
      title: 'Activities / Achievements',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
  ],
})

export const educationSection = defineType({
  name: 'educationSection',
  title: 'Education Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Education',
    }),
    defineField({
      name: 'items',
      title: 'Education History',
      type: 'array',
      of: [defineArrayMember({ type: 'educationItem' })],
    }),
  ],
})
