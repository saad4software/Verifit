'use client'

import React, { useState, useEffect } from 'react'
import { X, Briefcase, Loader2, AlertCircle } from 'lucide-react'
import type { CVDocument } from '@/modules/cvs/types'
import type { Jd } from '@/modules/jds/schema'
import type { PopulatedApplication } from '../types'

interface NewApplicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (application: PopulatedApplication) => void
}

export function NewApplicationModal({
  isOpen,
  onClose,
  onSuccess,
}: NewApplicationModalProps) {
  const [cvs, setCvs] = useState<CVDocument[]>([])
  const [jds, setJds] = useState<Jd[]>([])
  const [selectedCvId, setSelectedCvId] = useState<string>('')
  const [selectedJdId, setSelectedJdId] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    let active = true

    Promise.all([
      fetch('/api/cvs').then((r) => r.json()),
      fetch('/api/jds').then((r) => r.json()),
    ])
      .then(([cvData, jdData]) => {
        if (!active) return
        const readyCvs = (cvData.cvs || []).filter(
          (c: CVDocument) => c.ingestionStatus === 'ready'
        )
        const primaryCv = readyCvs.find((c: CVDocument) => c.isPrimary) || readyCvs[0]

        setCvs(readyCvs)
        setJds(jdData.jds || [])

        if (primaryCv) setSelectedCvId(primaryCv._id)
        if (jdData.jds?.[0]) setSelectedJdId(jdData.jds[0]._id)
        setIsLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to load options')
        setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCvId || !selectedJdId) {
      setError('Please select both a Job Description and a Base CV.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvId: selectedCvId,
          jdId: selectedJdId,
          title: title.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create application')
      onSuccess(data.application)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              New Job Application
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="mt-2 text-xs text-slate-500">Loading CVs and JDs...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Select JD */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Target Job Description
              </label>
              {jds.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No Job Descriptions found. Please import a Job Description first.
                </p>
              ) : (
                <select
                  value={selectedJdId}
                  onChange={(e) => setSelectedJdId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {jds.map((jd) => {
                    const title =
                      jd.content?.fields?.find((f) => f.category === 'title')?.text ||
                      jd.source?.url ||
                      'Untitled Job'
                    const company =
                      jd.content?.fields?.find((f) => f.category === 'company')?.text || ''
                    return (
                      <option key={jd._id} value={jd._id}>
                        {company ? `${title} (${company})` : title}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>

            {/* Select Base CV */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Baseline CV
              </label>
              {cvs.length === 0 ? (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  No ready CVs found. Please create or import a CV first.
                </p>
              ) : (
                <select
                  value={selectedCvId}
                  onChange={(e) => setSelectedCvId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {cvs.map((cv) => (
                    <option key={cv._id} value={cv._id}>
                      {cv.title} {cv.isPrimary ? '⭐ (Primary)' : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Optional Application Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Application Title (Optional)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer at Acme"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                Personal Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Initial thoughts, salary range, contact person..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || jds.length === 0 || cvs.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Application'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
