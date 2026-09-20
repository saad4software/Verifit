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
} from 'lucide-react'
import { CVDocument } from '../types'

interface CvEditorProps {
  cv: CVDocument
  onSaveSuccess?: (updated: CVDocument) => void
}

export function CvEditor({ cv, onSaveSuccess }: CvEditorProps) {
  const [formData, setFormData] = useState<CVDocument>(cv)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

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
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Full Name
            </label>
            <input
              type="text"
              data-testid="edit-fullname-input"
              value={formData.personalInfo?.fullName || ''}
              onChange={(e) => handlePersonalInfoChange('fullName', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Headline / Title
            </label>
            <input
              type="text"
              data-testid="edit-headline-input"
              value={formData.personalInfo?.headline || ''}
              onChange={(e) => handlePersonalInfoChange('headline', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Email
            </label>
            <input
              type="email"
              value={formData.personalInfo?.email || ''}
              onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Phone
            </label>
            <input
              type="text"
              value={formData.personalInfo?.phone || ''}
              onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Location
            </label>
            <input
              type="text"
              value={formData.personalInfo?.location || ''}
              onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              Portfolio Website
            </label>
            <input
              type="url"
              value={formData.personalInfo?.website || ''}
              onChange={(e) => handlePersonalInfoChange('website', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              LinkedIn URL
            </label>
            <input
              type="url"
              value={formData.personalInfo?.linkedin || ''}
              onChange={(e) => handlePersonalInfoChange('linkedin', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
              GitHub URL
            </label>
            <input
              type="url"
              value={formData.personalInfo?.github || ''}
              onChange={(e) => handlePersonalInfoChange('github', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-2">
          Professional Summary
        </h3>
        <textarea
          rows={4}
          data-testid="edit-summary-input"
          value={formData.summary || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, summary: e.target.value }))
          }
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        />
      </div>

      {/* Modular Reorderable Sections */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
          Modular Sections ({formData.sections?.length || 0})
        </h3>

        {formData.sections?.map((section, idx) => (
          <div
            key={section._key || idx}
            data-testid={`editor-section-${idx}`}
            className="rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80"
          >
            {/* Section Header Controls */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {section._type === 'workExperienceSection' && '💼 Work Experience'}
                {section._type === 'educationSection' && '🎓 Education'}
                {section._type === 'skillsSection' && '✨ Skills'}
                {section._type === 'projectsSection' && '📁 Projects'}
                {section._type === 'certificationsSection' && '🏆 Certifications'}
                {section._type === 'languagesSection' && '🌐 Languages'}
                {section._type === 'customSection' && `📄 ${section.sectionTitle}`}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  data-testid={`move-up-section-${idx}`}
                  onClick={() => handleMoveSection(idx, 'up')}
                  disabled={idx === 0}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-slate-800"
                  title="Move section up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  data-testid={`move-down-section-${idx}`}
                  onClick={() => handleMoveSection(idx, 'down')}
                  disabled={idx === (formData.sections?.length || 0) - 1}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 dark:hover:bg-slate-800"
                  title="Move section down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  data-testid={`remove-section-${idx}`}
                  onClick={() => handleRemoveSection(idx)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                  title="Remove section"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Section items overview */}
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {section._type === 'workExperienceSection' && (
                <span>
                  {section.items?.length || 0} experiences listed. (
                  {section.items?.map((item) => item.company).join(', ')})
                </span>
              )}
              {section._type === 'educationSection' && (
                <span>
                  {section.items?.length || 0} education items. (
                  {section.items?.map((item) => item.institution).join(', ')})
                </span>
              )}
              {section._type === 'skillsSection' && (
                <span>
                  {section.groups?.length || 0} skill groups with{' '}
                  {section.groups?.flatMap((g) => g.skills).length || 0} skills.
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </form>
  )
}
