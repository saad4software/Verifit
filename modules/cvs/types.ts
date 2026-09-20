export type IngestionStatus =
  | 'pending'
  | 'extracting'
  | 'structuring'
  | 'ready'
  | 'failed'

export interface PersonalInfo {
  fullName?: string
  headline?: string
  email?: string
  phone?: string
  location?: string
  website?: string
  linkedin?: string
  github?: string
  twitter?: string
}

export interface WorkExperienceItem {
  _key?: string
  company: string
  role: string
  location?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
  highlights?: string[]
  technologies?: string[]
}

export interface WorkExperienceSection {
  _type: 'workExperienceSection'
  _key?: string
  sectionTitle?: string
  items: WorkExperienceItem[]
}

export interface EducationItem {
  _key?: string
  institution: string
  degree?: string
  fieldOfStudy?: string
  startDate?: string
  endDate?: string
  gradeOrHonors?: string
  highlights?: string[]
}

export interface EducationSection {
  _type: 'educationSection'
  _key?: string
  sectionTitle?: string
  items: EducationItem[]
}

export interface SkillGroup {
  _key?: string
  categoryName: string
  skills: string[]
}

export interface SkillsSection {
  _type: 'skillsSection'
  _key?: string
  sectionTitle?: string
  groups: SkillGroup[]
}

export interface ProjectItem {
  _key?: string
  name: string
  role?: string
  description?: string
  url?: string
  repositoryUrl?: string
  highlights?: string[]
  technologies?: string[]
}

export interface ProjectsSection {
  _type: 'projectsSection'
  _key?: string
  sectionTitle?: string
  items: ProjectItem[]
}

export interface CertificationItem {
  _key?: string
  name: string
  issuer: string
  issueDate?: string
  expiryDate?: string
  credentialUrl?: string
}

export interface CertificationsSection {
  _type: 'certificationsSection'
  _key?: string
  sectionTitle?: string
  items: CertificationItem[]
}

export interface LanguageItem {
  _key?: string
  language: string
  proficiency?: 'Native' | 'Fluent' | 'Professional' | 'Intermediate' | 'Basic'
}

export interface LanguagesSection {
  _type: 'languagesSection'
  _key?: string
  sectionTitle?: string
  items: LanguageItem[]
}

export interface CustomItem {
  _key?: string
  title: string
  subtitle?: string
  date?: string
  description?: string
}

export interface CustomSection {
  _type: 'customSection'
  _key?: string
  sectionTitle: string
  items: CustomItem[]
}

export type CVSection =
  | WorkExperienceSection
  | EducationSection
  | SkillsSection
  | ProjectsSection
  | CertificationsSection
  | LanguagesSection
  | CustomSection

export interface CVDocument {
  _id: string
  _type: 'cv'
  _createdAt?: string
  _updatedAt?: string
  title: string
  userId: string
  isPrimary: boolean
  ingestionStatus: IngestionStatus
  rawText?: string
  errorMessage?: string
  personalInfo?: PersonalInfo
  summary?: string
  sections?: CVSection[]
}
