'use client'

import React, { useState } from 'react'
import {
  Save,
  ArrowUp,
  ArrowDown,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  FormField,
  FormTextarea,
  generateKey,
  inputClass,
  labelClass,
} from '@/modules/core'
import { CVDocument, CVSection } from '../types'
import {
  WorkExperienceEditor,
  EducationEditor,
  SkillsEditor,
  ProjectsEditor,
  CertificationsEditor,
  LanguagesEditor,
  CustomEditor,
} from './section-editors'

interface CvEditorProps {
  cv: CVDocument
  onSaveSuccess?: (updated: CVDocument) => void
}

const SECTION_TYPE_LABELS: Record<CVSection['_type'], string> = {
  workExperienceSection: '💼 Work Experience',
  educationSection: '🎓 Education',
  skillsSection: '✨ Skills',
  projectsSection: '📁 Projects',
  certificationsSection: '🏆 Certifications',
  languagesSection: '🌐 Languages',
  customSection: '📄 Custom Section',
}

export function CvEditor({ cv, onSaveSuccess }: CvEditorProps) {
  const [formData, setFormData] = useState<CVDocument>(cv)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedNewType, setSelectedNewType] = useState<CVSection['_type']>('workExperienceSection')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  const toggleSectionCollapse = (keyOrIdx: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [keyOrIdx]: !prev[keyOrIdx],
    }))
  }

  const handlePersonalInfoChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }))
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const currentSections = [...(formData.sections || [])]
    const targetIndex = direction === 'up' ? index - 1 : index + 1

    if (targetIndex < 0 || targetIndex >= currentSections.length) return

    const temp = currentSections[index]
    currentSections[index] = currentSections[targetIndex]
    currentSections[targetIndex] = temp

    setFormData((prev) => ({
      ...prev,
      sections: currentSections,
    }))
  }

  const handleRemoveSection = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sections: (prev.sections || []).filter((_, i) => i !== index),
    }))
  }

  const handleSectionChange = (index: number, updated: CVSection) => {
    setFormData((prev) => {
      const nextSections = [...(prev.sections || [])]
      nextSections[index] = updated
      return { ...prev, sections: nextSections }
    })
  }

  const handleSectionTitleChange = (index: number, title: string) => {
    setFormData((prev) => {
      const nextSections = [...(prev.sections || [])]
      nextSections[index] = { ...nextSections[index], sectionTitle: title }
      return { ...prev, sections: nextSections }
    })
  }

  const handleAddSection = () => {
    const key = generateKey('sec')
    let newSection: CVSection

    switch (selectedNewType) {
      case 'workExperienceSection':
        newSection = {
          _type: 'workExperienceSection',
          _key: key,
          sectionTitle: 'Work Experience',
          items: [],
        }
        break
      case 'educationSection':
        newSection = {
          _type: 'educationSection',
          _key: key,
          sectionTitle: 'Education',
          items: [],
        }
        break
      case 'skillsSection':
        newSection = {
          _type: 'skillsSection',
          _key: key,
          sectionTitle: 'Skills',
          groups: [],
        }
        break
      case 'projectsSection':
        newSection = {
          _type: 'projectsSection',
          _key: key,
          sectionTitle: 'Projects',
          items: [],
        }
        break
      case 'certificationsSection':
        newSection = {
          _type: 'certificationsSection',
          _key: key,
          sectionTitle: 'Certifications',
          items: [],
        }
        break
      case 'languagesSection':
        newSection = {
          _type: 'languagesSection',
          _key: key,
          sectionTitle: 'Languages',
          items: [],
        }
        break
      case 'customSection':
        newSection = {
          _type: 'customSection',
          _key: key,
          sectionTitle: 'Additional Experience',
          items: [],
        }
        break
    }

    setFormData((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSaveStatus('idle')
    setErrorMessage(null)

    try {
      const res = await fetch(`/api/cvs/${cv._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          isPrimary: formData.isPrimary,
          summary: formData.summary,
          personalInfo: formData.personalInfo,
          sections: formData.sections,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save CV changes')
      }

      setSaveStatus('success')
      onSaveSuccess?.(data.cv)
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (err: unknown) {
      setSaveStatus('error')
      const message = err instanceof Error ? err.message : 'Failed to save CV changes.'
      setErrorMessage(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form
      data-testid="cv-editor"
      onSubmit={handleSave}
      className="mx-auto w-full max-w-4xl space-y-6"
    >
      {/* Top Bar with Title, Primary checkbox, and Save button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            CV Title
          </label>
          <input
            type="text"
            data-testid="edit-title-input"
            value={formData.title || ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              data-testid="edit-is-primary-checkbox"
              checked={formData.isPrimary || false}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, isPrimary: e.target.checked }))
              }
              className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950"
            />
            <span>Set as Primary CV</span>
          </label>

          <button
            type="submit"
            data-testid="save-cv-button"
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveStatus === 'success' ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveStatus === 'error' && errorMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Personal Info Section */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
          Personal Information
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Full Name"
            data-testid="edit-fullname-input"
            value={formData.personalInfo?.fullName || ''}
            onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
          />

          <FormField
            label="Headline / Title"
            data-testid="edit-headline-input"
            value={formData.personalInfo?.headline || ''}
            onChange={(e) => handlePersonalInfoChange('headline', e.target.value)}
          />

          <FormField
            label="Email"
            type="email"
            value={formData.personalInfo?.email || ''}
            onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
          />

          <FormField
            label="Phone"
            type="text"
            value={formData.personalInfo?.phone || ''}
            onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
          />

          <FormField
            label="Location"
            type="text"
            value={formData.personalInfo?.location || ''}
            onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
          />

          <FormField
            label="Portfolio Website"
            type="url"
            value={formData.personalInfo?.website || ''}
            onChange={(e) => handlePersonalInfoChange('website', e.target.value)}
          />

          <FormField
            label="LinkedIn URL"
            type="url"
            value={formData.personalInfo?.linkedin || ''}
            onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
          />

          <FormField
            label="GitHub URL"
            type="url"
            value={formData.personalInfo?.github || ''}
            onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
          />
        </div>
      </div>

      {/* Professional Summary */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
          Professional Summary
        </h3>
        <FormTextarea
          label=""
          rows={4}
          data-testid="edit-summary-input"
          value={formData.summary || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, summary: e.target.value }))
          }
        />
      </div>

      {/* Modular Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Modular Sections ({formData.sections?.length || 0})
          </h3>
        </div>

        {formData.sections?.map((section, idx) => {
          const sectionKey = section._key || String(idx)
          const isCollapsed = collapsedSections[sectionKey] || false

          return (
            <div
              key={sectionKey}
              data-testid={`editor-section-${idx}`}
              className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80"
            >
              {/* Section Header Controls */}
              <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div className="flex flex-1 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSectionCollapse(sectionKey)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title={isCollapsed ? 'Expand section' : 'Collapse section'}
                  >
                    {isCollapsed ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronUp className="h-4 w-4" />
                    )}
                  </button>

                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {SECTION_TYPE_LABELS[section._type]}
                  </span>

                  <input
                    type="text"
                    data-testid={`section-title-input-${idx}`}
                    value={section.sectionTitle || ''}
                    onChange={(e) => handleSectionTitleChange(idx, e.target.value)}
                    placeholder="Section Title"
                    className="flex-1 rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm font-bold text-slate-900 hover:border-slate-200 focus:border-indigo-500 focus:bg-white focus:outline-none dark:text-white dark:hover:border-slate-800 dark:focus:bg-slate-950"
                  />
                </div>

                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <button
                    type="button"
                    data-testid={`move-up-section-${idx}`}
                    onClick={() => handleMoveSection(idx, 'up')}
                    disabled={idx === 0}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-slate-800"
                    title="Move section up"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    data-testid={`move-down-section-${idx}`}
                    onClick={() => handleMoveSection(idx, 'down')}
                    disabled={idx === (formData.sections?.length || 0) - 1}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-slate-800"
                    title="Move section down"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    data-testid={`remove-section-${idx}`}
                    onClick={() => handleRemoveSection(idx)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    title="Remove section"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Collapsible Content Editor */}
              {!isCollapsed && (
                <div className="mt-2">
                  {section._type === 'workExperienceSection' && (
                    <WorkExperienceEditor
                      section={section}
                      sectionIdx={idx}
                      onChange={(updated) => handleSectionChange(idx, updated)}
                    />
                  )}
                  {section._type === 'educationSection' && (
                    <EducationEditor
                      section={section}
                      sectionIdx={idx}
                      onChange={(updated) => handleSectionChange(idx, updated)}
                    />
                  )}
                  {section._type === 'skillsSection' && (
                    <SkillsEditor
                      section={section}
                      sectionIdx={idx}
                      onChange={(updated) => handleSectionChange(idx, updated)}
                    />
                  )}
                  {section._type === 'projectsSection' && (
                    <ProjectsEditor
                      section={section}
                      sectionIdx={idx}
                      onChange={(updated) => handleSectionChange(idx, updated)}
                    />
                  )}
                  {section._type === 'certificationsSection' && (
                    <CertificationsEditor
                      section={section}
                      sectionIdx={idx}
                      onChange={(updated) => handleSectionChange(idx, updated)}
                    />
                  )}
                  {section._type === 'languagesSection' && (
                    <LanguagesEditor
                      section={section}
                      sectionIdx={idx}
                      onChange={(updated) => handleSectionChange(idx, updated)}
                    />
                  )}
                  {section._type === 'customSection' && (
                    <CustomEditor
                      section={section}
                      sectionIdx={idx}
                      onChange={(updated) => handleSectionChange(idx, updated)}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* Add New Section Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center rounded-2xl border border-dashed border-slate-300/80 bg-white/40 p-4 dark:border-slate-800/80 dark:bg-slate-900/40">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            Add Section:
          </span>
          <select
            data-testid="add-section-select"
            value={selectedNewType}
            onChange={(e) => setSelectedNewType(e.target.value as CVSection['_type'])}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="workExperienceSection">💼 Work Experience</option>
            <option value="educationSection">🎓 Education</option>
            <option value="skillsSection">✨ Skills</option>
            <option value="projectsSection">📁 Projects</option>
            <option value="certificationsSection">🏆 Certifications</option>
            <option value="languagesSection">🌐 Languages</option>
            <option value="customSection">📄 Custom Section</option>
          </select>
          <button
            type="button"
            data-testid="add-section-button"
            onClick={handleAddSection}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Section</span>
          </button>
        </div>
      </div>
    </form>
  )
}
