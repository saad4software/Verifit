import { defineArrayMember, defineField, defineType } from 'sanity'

export const languageItem = defineType({
  name: 'languageItem',
  title: 'Language Item',
  type: 'object',
  fields: [
    defineField({
      name: 'language',
      title: 'Language',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'proficiency',
      title: 'Proficiency',
      type: 'string',
      options: {
        list: [
          { title: 'Native / Bilingual', value: 'Native' },
          { title: 'Fluent / Full Professional', value: 'Fluent' },
          { title: 'Professional Working', value: 'Professional' },
          { title: 'Intermediate', value: 'Intermediate' },
          { title: 'Elementary / Basic', value: 'Basic' },
        ],
      },
    }),
  ],
})

export const languagesSection = defineType({
  name: 'languagesSection',
  title: 'Languages Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Languages',
    }),
    defineField({
      name: 'items',
      title: 'Languages List',
      type: 'array',
      of: [defineArrayMember({ type: 'languageItem' })],
    }),
  ],
})
