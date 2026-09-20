import { jdTypes } from './jd'
import { matchingTypes } from './matching'
import { type SchemaTypeDefinition } from 'sanity'

import { cv } from './cv'
import { personalInfo } from './sections/personalInfo'
import {
  workExperienceItem,
  workExperienceSection,
} from './sections/workExperience'
import { educationItem, educationSection } from './sections/education'
import { skillGroup, skillsSection } from './sections/skills'
import { projectItem, projectsSection } from './sections/projects'
import {
  certificationItem,
  certificationsSection,
} from './sections/certifications'
import { languageItem, languagesSection } from './sections/languages'
import { customItem, customSection } from './sections/custom'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    ...jdTypes,
    ...matchingTypes,
    cv,
    personalInfo,
    workExperienceItem,
    workExperienceSection,
    educationItem,
    educationSection,
    skillGroup,
    skillsSection,
    projectItem,
    projectsSection,
    certificationItem,
    certificationsSection,
    languageItem,
    languagesSection,
    customItem,
    customSection,
  ],
}
