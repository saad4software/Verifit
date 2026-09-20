'use client'

import React from 'react'
import {
  FormField,
  FormTextarea,
  FormSelect,
  BulletListInput,
  TagListInput,
  SectionItemCard,
  AddItemButton,
  generateKey,
  inputClass,
  labelClass,
} from '@/modules/core'
import {
  WorkExperienceSection,
  WorkExperienceItem,
  EducationSection,
  EducationItem,
  SkillsSection,
  SkillGroup,
  ProjectsSection,
  ProjectItem,
  CertificationsSection,
  CertificationItem,
  LanguagesSection,
  LanguageItem,
  CustomSection,
  CustomItem,
} from '../types'

// Re-export core styling and key generator for backwards compatibility
export { generateKey, inputClass, labelClass }

// ----------------------------------------------------
// Work Experience Section Editor
// ----------------------------------------------------
interface WorkExperienceEditorProps {
  section: WorkExperienceSection
  sectionIdx: number
  onChange: (updated: WorkExperienceSection) => void
}

export function WorkExperienceEditor({ section, sectionIdx, onChange }: WorkExperienceEditorProps) {
  const items = section.items || []

  const updateItem = (itemIdx: number, patch: Partial<WorkExperienceItem>) => {
    const nextItems = items.map((item, i) => (i === itemIdx ? { ...item, ...patch } : item))
    onChange({ ...section, items: nextItems })
  }

  const addItem = () => {
    const newItem: WorkExperienceItem = {
      _key: generateKey('work'),
      company: '',
      role: '',
      location: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      highlights: [],
      technologies: [],
    }
    onChange({ ...section, items: [...items, newItem] })
  }

  const removeItem = (itemIdx: number) => {
    onChange({ ...section, items: items.filter((_, i) => i !== itemIdx) })
  }

  return (
    <div className="space-y-4 pt-2">
      {items.map((item, itemIdx) => (
        <SectionItemCard
          key={item._key || itemIdx}
          testId={`work-item-${sectionIdx}-${itemIdx}`}
          removeTestId={`remove-item-${sectionIdx}-${itemIdx}`}
          title={`Experience #${itemIdx + 1}: ${item.company || 'New Position'}`}
          onRemove={() => removeItem(itemIdx)}
          removeTitle="Delete experience"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              label="Company / Organization *"
              data-testid={`work-company-${sectionIdx}-${itemIdx}`}
              value={item.company || ''}
              onChange={(e) => updateItem(itemIdx, { company: e.target.value })}
              placeholder="e.g. Acme Corp"
              required
            />
            <FormField
              label="Role / Title *"
              data-testid={`work-role-${sectionIdx}-${itemIdx}`}
              value={item.role || ''}
              onChange={(e) => updateItem(itemIdx, { role: e.target.value })}
              placeholder="e.g. Senior Software Engineer"
              required
            />
            <FormField
              label="Location"
              value={item.location || ''}
              onChange={(e) => updateItem(itemIdx, { location: e.target.value })}
              placeholder="e.g. San Francisco, CA or Remote"
            />
            <div className="grid grid-cols-2 gap-2">
              <FormField
                label="Start Date"
                value={item.startDate || ''}
                onChange={(e) => updateItem(itemIdx, { startDate: e.target.value })}
                placeholder="e.g. Jan 2022"
              />
              <FormField
                label="End Date"
                disabled={item.isCurrent}
                value={item.isCurrent ? 'Present' : item.endDate || ''}
                onChange={(e) => updateItem(itemIdx, { endDate: e.target.value })}
                placeholder="e.g. Present"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id={`work-current-${sectionIdx}-${itemIdx}`}
              checked={item.isCurrent || false}
              onChange={(e) =>
                updateItem(itemIdx, {
                  isCurrent: e.target.checked,
                  endDate: e.target.checked ? 'Present' : '',
                })
              }
              className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950"
            />
            <label
              htmlFor={`work-current-${sectionIdx}-${itemIdx}`}
              className="text-xs font-medium text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              Currently working here
            </label>
          </div>

          <BulletListInput
            containerClassName="mt-3"
            data-testid={`work-highlights-${sectionIdx}-${itemIdx}`}
            items={item.highlights}
            onChange={(highlights) => updateItem(itemIdx, { highlights })}
            placeholder="Led development of distributed microservices&#10;Mentored 5 junior engineers"
          />

          <TagListInput
            containerClassName="mt-3"
            label="Technologies / Skills Used (comma-separated)"
            tags={item.technologies}
            onChange={(technologies) => updateItem(itemIdx, { technologies })}
            placeholder="TypeScript, Next.js, Node.js, AWS"
          />
        </SectionItemCard>
      ))}

      <AddItemButton
        data-testid={`add-item-to-section-${sectionIdx}`}
        onClick={addItem}
        label="Add Experience"
      />
    </div>
  )
}

// ----------------------------------------------------
// Education Section Editor
// ----------------------------------------------------
interface EducationEditorProps {
  section: EducationSection
  sectionIdx: number
  onChange: (updated: EducationSection) => void
}

export function EducationEditor({ section, sectionIdx, onChange }: EducationEditorProps) {
  const items = section.items || []

  const updateItem = (itemIdx: number, patch: Partial<EducationItem>) => {
    const nextItems = items.map((item, i) => (i === itemIdx ? { ...item, ...patch } : item))
    onChange({ ...section, items: nextItems })
  }

  const addItem = () => {
    const newItem: EducationItem = {
      _key: generateKey('edu'),
      institution: '',
      degree: '',
      fieldOfStudy: '',
      startDate: '',
      endDate: '',
      gradeOrHonors: '',
      highlights: [],
    }
    onChange({ ...section, items: [...items, newItem] })
  }

  const removeItem = (itemIdx: number) => {
    onChange({ ...section, items: items.filter((_, i) => i !== itemIdx) })
  }

  return (
    <div className="space-y-4 pt-2">
      {items.map((item, itemIdx) => (
        <SectionItemCard
          key={item._key || itemIdx}
          testId={`edu-item-${sectionIdx}-${itemIdx}`}
          removeTestId={`remove-item-${sectionIdx}-${itemIdx}`}
          title={`Education #${itemIdx + 1}: ${item.institution || 'New Institution'}`}
          onRemove={() => removeItem(itemIdx)}
          removeTitle="Delete education entry"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              label="School / University *"
              data-testid={`edu-institution-${sectionIdx}-${itemIdx}`}
              value={item.institution || ''}
              onChange={(e) => updateItem(itemIdx, { institution: e.target.value })}
              placeholder="e.g. Stanford University"
              required
            />
            <FormField
              label="Degree"
              data-testid={`edu-degree-${sectionIdx}-${itemIdx}`}
              value={item.degree || ''}
              onChange={(e) => updateItem(itemIdx, { degree: e.target.value })}
              placeholder="e.g. B.S., M.S., Ph.D."
            />
            <FormField
              label="Field of Study / Major"
              value={item.fieldOfStudy || ''}
              onChange={(e) => updateItem(itemIdx, { fieldOfStudy: e.target.value })}
              placeholder="e.g. Computer Science"
            />
            <FormField
              label="Grade / GPA / Honors"
              value={item.gradeOrHonors || ''}
              onChange={(e) => updateItem(itemIdx, { gradeOrHonors: e.target.value })}
              placeholder="e.g. Summa Cum Laude, GPA 3.9"
            />
            <div className="grid grid-cols-2 gap-2 sm:col-span-2">
              <FormField
                label="Start Date"
                value={item.startDate || ''}
                onChange={(e) => updateItem(itemIdx, { startDate: e.target.value })}
                placeholder="e.g. 2018"
              />
              <FormField
                label="End Date / Graduation"
                value={item.endDate || ''}
                onChange={(e) => updateItem(itemIdx, { endDate: e.target.value })}
                placeholder="e.g. 2022"
              />
            </div>
          </div>

          <BulletListInput
            containerClassName="mt-3"
            label="Activities / Highlights (one per line)"
            rows={2}
            items={item.highlights}
            onChange={(highlights) => updateItem(itemIdx, { highlights })}
            placeholder="President of Computer Science Society&#10;Dean's Honor List"
          />
        </SectionItemCard>
      ))}

      <AddItemButton
        data-testid={`add-item-to-section-${sectionIdx}`}
        onClick={addItem}
        label="Add Education"
      />
    </div>
  )
}

// ----------------------------------------------------
// Skills Section Editor
// ----------------------------------------------------
interface SkillsEditorProps {
  section: SkillsSection
  sectionIdx: number
  onChange: (updated: SkillsSection) => void
}

export function SkillsEditor({ section, sectionIdx, onChange }: SkillsEditorProps) {
  const groups = section.groups || []

  const updateGroup = (groupIdx: number, patch: Partial<SkillGroup>) => {
    const nextGroups = groups.map((g, i) => (i === groupIdx ? { ...g, ...patch } : g))
    onChange({ ...section, groups: nextGroups })
  }

  const addGroup = () => {
    const newGroup: SkillGroup = {
      _key: generateKey('skill'),
      categoryName: '',
      skills: [],
    }
    onChange({ ...section, groups: [...groups, newGroup] })
  }

  const removeGroup = (groupIdx: number) => {
    onChange({ ...section, groups: groups.filter((_, i) => i !== groupIdx) })
  }

  return (
    <div className="space-y-4 pt-2">
      {groups.map((group, groupIdx) => (
        <SectionItemCard
          key={group._key || groupIdx}
          testId={`skill-group-${sectionIdx}-${groupIdx}`}
          removeTestId={`remove-item-${sectionIdx}-${groupIdx}`}
          title={`Category #${groupIdx + 1}: ${group.categoryName || 'New Skill Category'}`}
          onRemove={() => removeGroup(groupIdx)}
          removeTitle="Delete skill category"
        >
          <div className="space-y-3">
            <FormField
              label="Category Name *"
              data-testid={`skill-category-${sectionIdx}-${groupIdx}`}
              value={group.categoryName || ''}
              onChange={(e) => updateGroup(groupIdx, { categoryName: e.target.value })}
              placeholder="e.g. Languages & Frameworks, Cloud & DevOps, Databases"
              required
            />
            <TagListInput
              label="Skills List (comma-separated)"
              data-testid={`skill-list-${sectionIdx}-${groupIdx}`}
              tags={group.skills}
              onChange={(skills) => updateGroup(groupIdx, { skills })}
              placeholder="React, TypeScript, Next.js, Node.js, GraphQL"
            />
          </div>
        </SectionItemCard>
      ))}

      <AddItemButton
        data-testid={`add-item-to-section-${sectionIdx}`}
        onClick={addGroup}
        label="Add Skill Category"
      />
    </div>
  )
}

// ----------------------------------------------------
// Projects Section Editor
// ----------------------------------------------------
interface ProjectsEditorProps {
  section: ProjectsSection
  sectionIdx: number
  onChange: (updated: ProjectsSection) => void
}

export function ProjectsEditor({ section, sectionIdx, onChange }: ProjectsEditorProps) {
  const items = section.items || []

  const updateItem = (itemIdx: number, patch: Partial<ProjectItem>) => {
    const nextItems = items.map((item, i) => (i === itemIdx ? { ...item, ...patch } : item))
    onChange({ ...section, items: nextItems })
  }

  const addItem = () => {
    const newItem: ProjectItem = {
      _key: generateKey('proj'),
      name: '',
      role: '',
      description: '',
      url: '',
      repositoryUrl: '',
      highlights: [],
      technologies: [],
    }
    onChange({ ...section, items: [...items, newItem] })
  }

  const removeItem = (itemIdx: number) => {
    onChange({ ...section, items: items.filter((_, i) => i !== itemIdx) })
  }

  return (
    <div className="space-y-4 pt-2">
      {items.map((item, itemIdx) => (
        <SectionItemCard
          key={item._key || itemIdx}
          testId={`project-item-${sectionIdx}-${itemIdx}`}
          removeTestId={`remove-item-${sectionIdx}-${itemIdx}`}
          title={`Project #${itemIdx + 1}: ${item.name || 'New Project'}`}
          onRemove={() => removeItem(itemIdx)}
          removeTitle="Delete project"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              label="Project Name *"
              data-testid={`project-name-${sectionIdx}-${itemIdx}`}
              value={item.name || ''}
              onChange={(e) => updateItem(itemIdx, { name: e.target.value })}
              placeholder="e.g. AI Resume Optimizer"
              required
            />
            <FormField
              label="Role / Contribution"
              value={item.role || ''}
              onChange={(e) => updateItem(itemIdx, { role: e.target.value })}
              placeholder="e.g. Creator & Lead Developer"
            />
            <FormField
              label="Live URL"
              type="url"
              value={item.url || ''}
              onChange={(e) => updateItem(itemIdx, { url: e.target.value })}
              placeholder="https://example.com"
            />
            <FormField
              label="Repository URL"
              type="url"
              value={item.repositoryUrl || ''}
              onChange={(e) => updateItem(itemIdx, { repositoryUrl: e.target.value })}
              placeholder="https://github.com/user/project"
            />
          </div>

          <FormTextarea
            containerClassName="mt-3"
            label="Description"
            rows={2}
            value={item.description || ''}
            onChange={(e) => updateItem(itemIdx, { description: e.target.value })}
            placeholder="Brief description of the project, problem solved, and architecture"
          />

          <BulletListInput
            containerClassName="mt-3"
            label="Highlights (one per line)"
            rows={2}
            items={item.highlights}
            onChange={(highlights) => updateItem(itemIdx, { highlights })}
            placeholder="Scaled to 10k monthly active users&#10;Integrated Stripe subscriptions"
          />

          <TagListInput
            containerClassName="mt-3"
            label="Technologies Used (comma-separated)"
            tags={item.technologies}
            onChange={(technologies) => updateItem(itemIdx, { technologies })}
            placeholder="React, Next.js, Tailwind, PostgreSQL"
          />
        </SectionItemCard>
      ))}

      <AddItemButton
        data-testid={`add-item-to-section-${sectionIdx}`}
        onClick={addItem}
        label="Add Project"
      />
    </div>
  )
}

// ----------------------------------------------------
// Certifications Section Editor
// ----------------------------------------------------
interface CertificationsEditorProps {
  section: CertificationsSection
  sectionIdx: number
  onChange: (updated: CertificationsSection) => void
}

export function CertificationsEditor({ section, sectionIdx, onChange }: CertificationsEditorProps) {
  const items = section.items || []

  const updateItem = (itemIdx: number, patch: Partial<CertificationItem>) => {
    const nextItems = items.map((item, i) => (i === itemIdx ? { ...item, ...patch } : item))
    onChange({ ...section, items: nextItems })
  }

  const addItem = () => {
    const newItem: CertificationItem = {
      _key: generateKey('cert'),
      name: '',
      issuer: '',
      issueDate: '',
      expiryDate: '',
      credentialUrl: '',
    }
    onChange({ ...section, items: [...items, newItem] })
  }

  const removeItem = (itemIdx: number) => {
    onChange({ ...section, items: items.filter((_, i) => i !== itemIdx) })
  }

  return (
    <div className="space-y-4 pt-2">
      {items.map((item, itemIdx) => (
        <SectionItemCard
          key={item._key || itemIdx}
          testId={`cert-item-${sectionIdx}-${itemIdx}`}
          removeTestId={`remove-item-${sectionIdx}-${itemIdx}`}
          title={`Certification #${itemIdx + 1}: ${item.name || 'New Certification'}`}
          onRemove={() => removeItem(itemIdx)}
          removeTitle="Delete certification"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              label="Certification Name *"
              data-testid={`cert-name-${sectionIdx}-${itemIdx}`}
              value={item.name || ''}
              onChange={(e) => updateItem(itemIdx, { name: e.target.value })}
              placeholder="e.g. AWS Certified Solutions Architect"
              required
            />
            <FormField
              label="Issuing Organization *"
              value={item.issuer || ''}
              onChange={(e) => updateItem(itemIdx, { issuer: e.target.value })}
              placeholder="e.g. Amazon Web Services"
              required
            />
            <FormField
              label="Issue Date"
              value={item.issueDate || ''}
              onChange={(e) => updateItem(itemIdx, { issueDate: e.target.value })}
              placeholder="e.g. 2023"
            />
            <FormField
              label="Expiry Date (optional)"
              value={item.expiryDate || ''}
              onChange={(e) => updateItem(itemIdx, { expiryDate: e.target.value })}
              placeholder="e.g. 2026 or No Expiration"
            />
            <FormField
              containerClassName="sm:col-span-2"
              label="Credential URL"
              type="url"
              value={item.credentialUrl || ''}
              onChange={(e) => updateItem(itemIdx, { credentialUrl: e.target.value })}
              placeholder="https://www.credly.com/badges/..."
            />
          </div>
        </SectionItemCard>
      ))}

      <AddItemButton
        data-testid={`add-item-to-section-${sectionIdx}`}
        onClick={addItem}
        label="Add Certification"
      />
    </div>
  )
}

// ----------------------------------------------------
// Languages Section Editor
// ----------------------------------------------------
interface LanguagesEditorProps {
  section: LanguagesSection
  sectionIdx: number
  onChange: (updated: LanguagesSection) => void
}

const PROFICIENCY_OPTIONS = [
  { label: 'Native / Bilingual', value: 'Native' },
  { label: 'Fluent / Full Professional', value: 'Fluent' },
  { label: 'Professional Working', value: 'Professional' },
  { label: 'Intermediate', value: 'Intermediate' },
  { label: 'Basic / Elementary', value: 'Basic' },
]

export function LanguagesEditor({ section, sectionIdx, onChange }: LanguagesEditorProps) {
  const items = section.items || []

  const updateItem = (itemIdx: number, patch: Partial<LanguageItem>) => {
    const nextItems = items.map((item, i) => (i === itemIdx ? { ...item, ...patch } : item))
    onChange({ ...section, items: nextItems })
  }

  const addItem = () => {
    const newItem: LanguageItem = {
      _key: generateKey('lang'),
      language: '',
      proficiency: 'Professional',
    }
    onChange({ ...section, items: [...items, newItem] })
  }

  const removeItem = (itemIdx: number) => {
    onChange({ ...section, items: items.filter((_, i) => i !== itemIdx) })
  }

  return (
    <div className="space-y-4 pt-2">
      {items.map((item, itemIdx) => (
        <SectionItemCard
          key={item._key || itemIdx}
          testId={`lang-item-${sectionIdx}-${itemIdx}`}
          removeTestId={`remove-item-${sectionIdx}-${itemIdx}`}
          title={`Language #${itemIdx + 1}: ${item.language || 'New Language'}`}
          onRemove={() => removeItem(itemIdx)}
          removeTitle="Delete language"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              label="Language *"
              data-testid={`lang-name-${sectionIdx}-${itemIdx}`}
              value={item.language || ''}
              onChange={(e) => updateItem(itemIdx, { language: e.target.value })}
              placeholder="e.g. English, French, Spanish"
              required
            />
            <FormSelect
              label="Proficiency Level"
              data-testid={`lang-proficiency-${sectionIdx}-${itemIdx}`}
              value={item.proficiency || 'Professional'}
              options={PROFICIENCY_OPTIONS}
              onChange={(e) =>
                updateItem(itemIdx, {
                  proficiency: e.target.value as LanguageItem['proficiency'],
                })
              }
            />
          </div>
        </SectionItemCard>
      ))}

      <AddItemButton
        data-testid={`add-item-to-section-${sectionIdx}`}
        onClick={addItem}
        label="Add Language"
      />
    </div>
  )
}

// ----------------------------------------------------
// Custom Section Editor
// ----------------------------------------------------
interface CustomEditorProps {
  section: CustomSection
  sectionIdx: number
  onChange: (updated: CustomSection) => void
}

export function CustomEditor({ section, sectionIdx, onChange }: CustomEditorProps) {
  const items = section.items || []

  const updateItem = (itemIdx: number, patch: Partial<CustomItem>) => {
    const nextItems = items.map((item, i) => (i === itemIdx ? { ...item, ...patch } : item))
    onChange({ ...section, items: nextItems })
  }

  const addItem = () => {
    const newItem: CustomItem = {
      _key: generateKey('custom'),
      title: '',
      subtitle: '',
      date: '',
      description: '',
    }
    onChange({ ...section, items: [...items, newItem] })
  }

  const removeItem = (itemIdx: number) => {
    onChange({ ...section, items: items.filter((_, i) => i !== itemIdx) })
  }

  return (
    <div className="space-y-4 pt-2">
      {items.map((item, itemIdx) => (
        <SectionItemCard
          key={item._key || itemIdx}
          testId={`custom-item-${sectionIdx}-${itemIdx}`}
          removeTestId={`remove-item-${sectionIdx}-${itemIdx}`}
          title={`Item #${itemIdx + 1}: ${item.title || 'New Item'}`}
          onRemove={() => removeItem(itemIdx)}
          removeTitle="Delete item"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField
              label="Title *"
              data-testid={`custom-title-${sectionIdx}-${itemIdx}`}
              value={item.title || ''}
              onChange={(e) => updateItem(itemIdx, { title: e.target.value })}
              placeholder="e.g. Volunteer Leader, Research Publication"
              required
            />
            <FormField
              label="Subtitle / Organization"
              value={item.subtitle || ''}
              onChange={(e) => updateItem(itemIdx, { subtitle: e.target.value })}
              placeholder="e.g. Red Cross International"
            />
            <FormField
              containerClassName="sm:col-span-2"
              label="Date / Period"
              value={item.date || ''}
              onChange={(e) => updateItem(itemIdx, { date: e.target.value })}
              placeholder="e.g. 2021 — 2023"
            />
          </div>

          <FormTextarea
            containerClassName="mt-3"
            label="Description / Details"
            rows={2}
            value={item.description || ''}
            onChange={(e) => updateItem(itemIdx, { description: e.target.value })}
            placeholder="Provide context, metrics, and details"
          />
        </SectionItemCard>
      ))}

      <AddItemButton
        data-testid={`add-item-to-section-${sectionIdx}`}
        onClick={addItem}
        label="Add Item"
      />
    </div>
  )
}
