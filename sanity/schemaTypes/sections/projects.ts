import { defineArrayMember, defineField, defineType } from 'sanity'

export const projectItem = defineType({
  name: 'projectItem',
  title: 'Project Item',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Project Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role / Contribution',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Project Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'url',
      title: 'Live URL',
      type: 'url',
    }),
    defineField({
      name: 'repositoryUrl',
      title: 'Repository URL',
      type: 'url',
    }),
    defineField({
      name: 'highlights',
      title: 'Key Features / Highlights',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
    defineField({
      name: 'technologies',
      title: 'Technologies Used',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
    }),
  ],
})

export const projectsSection = defineType({
  name: 'projectsSection',
  title: 'Projects Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Projects',
    }),
    defineField({
      name: 'items',
      title: 'Projects List',
      type: 'array',
      of: [defineArrayMember({ type: 'projectItem' })],
    }),
  ],
})
