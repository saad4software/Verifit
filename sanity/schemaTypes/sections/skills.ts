import { defineArrayMember, defineField, defineType } from 'sanity'

export const skillGroup = defineType({
  name: 'skillGroup',
  title: 'Skill Group',
  type: 'object',
  fields: [
    defineField({
      name: 'categoryName',
      title: 'Category Name (e.g. Languages, Frameworks, Tools)',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'skills',
      title: 'Skills List',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
  ],
})

export const skillsSection = defineType({
  name: 'skillsSection',
  title: 'Skills Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Skills',
    }),
    defineField({
      name: 'groups',
      title: 'Skill Groups',
      type: 'array',
      of: [defineArrayMember({ type: 'skillGroup' })],
    }),
  ],
})
