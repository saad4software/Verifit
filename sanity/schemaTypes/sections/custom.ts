import { defineArrayMember, defineField, defineType } from 'sanity'

export const customItem = defineType({
  name: 'customItem',
  title: 'Custom Item',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle / Context',
      type: 'string',
    }),
    defineField({
      name: 'date',
      title: 'Date / Period',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Description / Details',
      type: 'text',
      rows: 3,
    }),
  ],
})

export const customSection = defineType({
  name: 'customSection',
  title: 'Custom Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [defineArrayMember({ type: 'customItem' })],
    }),
  ],
})
