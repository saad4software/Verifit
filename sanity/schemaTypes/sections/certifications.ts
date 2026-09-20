import { defineArrayMember, defineField, defineType } from 'sanity'

export const certificationItem = defineType({
  name: 'certificationItem',
  title: 'Certification Item',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Certification Name',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'issuer',
      title: 'Issuing Organization',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'issueDate',
      title: 'Issue Date',
      type: 'string',
    }),
    defineField({
      name: 'expiryDate',
      title: 'Expiry Date',
      type: 'string',
    }),
    defineField({
      name: 'credentialUrl',
      title: 'Credential / Verification URL',
      type: 'url',
    }),
  ],
})

export const certificationsSection = defineType({
  name: 'certificationsSection',
  title: 'Certifications Section',
  type: 'object',
  fields: [
    defineField({
      name: 'sectionTitle',
      title: 'Section Title',
      type: 'string',
      initialValue: 'Certifications',
    }),
    defineField({
      name: 'items',
      title: 'Certifications List',
      type: 'array',
      of: [defineArrayMember({ type: 'certificationItem' })],
    }),
  ],
})
