import { z } from 'zod'

const text = z.string().optional()
const strings = z.array(z.string()).optional()
const keyed = { _key: z.string().min(1), _type: text }
const section = { _key: z.string().min(1), sectionTitle: text }

// Retain Sanity object types and keys, but strip unrelated model-generated fields.
export const StructuredCvResultSchema = z.object({
  personalInfo: z.object({
    _type: text, fullName: text, headline: text, email: text, phone: text,
    location: text, website: text, linkedin: text, github: text, twitter: text,
  }),
  summary: z.string(),
  sections: z.array(z.discriminatedUnion('_type', [
    z.object({
      ...section, _type: z.literal('workExperienceSection'),
      items: z.array(z.object({
        ...keyed, company: z.string(), role: z.string(), location: text,
        startDate: text, endDate: text, isCurrent: z.boolean().optional(),
        highlights: strings, technologies: strings,
      })),
    }),
    z.object({
      ...section, _type: z.literal('educationSection'),
      items: z.array(z.object({
        ...keyed, institution: z.string(), degree: text, fieldOfStudy: text,
        startDate: text, endDate: text, gradeOrHonors: text, highlights: strings,
      })),
    }),
    z.object({
      ...section, _type: z.literal('skillsSection'),
      groups: z.array(z.object({
        ...keyed, categoryName: z.string(), skills: z.array(z.string()),
      })),
    }),
    z.object({
      ...section, _type: z.literal('projectsSection'),
      items: z.array(z.object({
        ...keyed, name: z.string(), role: text, description: text, url: text,
        repositoryUrl: text, highlights: strings, technologies: strings,
      })),
    }),
    z.object({
      ...section, _type: z.literal('certificationsSection'),
      items: z.array(z.object({
        ...keyed, name: z.string(), issuer: z.string(), issueDate: text,
        expiryDate: text, credentialUrl: text,
      })),
    }),
    z.object({
      ...section, _type: z.literal('languagesSection'),
      items: z.array(z.object({
        ...keyed, language: z.string(),
        proficiency: z.enum(['Native', 'Fluent', 'Professional', 'Intermediate', 'Basic']).optional(),
      })),
    }),
    z.object({
      ...section, _type: z.literal('customSection'), sectionTitle: z.string(),
      items: z.array(z.object({
        ...keyed, title: z.string(), subtitle: text, date: text, description: text,
      })),
    }),
  ])),
})
