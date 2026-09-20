'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Star,
  Clock,
  Briefcase,
  GraduationCap,
  Sparkles,
  Trash2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { CVDocument } from '../types'

interface CvCardProps {
  cv: CVDocument
  onRefresh?: () => void
}

export function CvCard({ cv, onRefresh }: CvCardProps) {
  const [isSettingPrimary, setIsSettingPrimary] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const handleSetPrimary = async () => {
    setIsSettingPrimary(true)
    try {
      await fetch(`/api/cvs/${cv._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true }),
      })
      onRefresh?.()
    } catch (err) {
      console.error('Failed to set primary CV:', err)
    } finally {
      setIsSettingPrimary(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await fetch(`/api/cvs/${cv._id}`, {
        method: 'DELETE',
      })
      onRefresh?.()
    } catch (err) {
      console.error('Failed to delete CV:', err)
    } finally {
      setIsDeleting(false)
      setShowConfirmDelete(false)
    }
  }

  // Count sections
  const experiences =
    cv.sections?.find((s) => s._type === 'workExperienceSection')?.items?.length || 0
  const educations =
    cv.sections?.find((s) => s._type === 'educationSection')?.items?.length || 0
  const skillsCount =
    cv.sections?.find((s) => s._type === 'skillsSection')?.groups?.reduce(
      (acc, g) => acc + (g.skills?.length || 0),
      0
    ) || 0

  const getStatusBadge = () => {
    switch (cv.ingestionStatus) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Ready
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertCircle className="h-3 w-3" /> Failed
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
            <Loader2 className="h-3 w-3 animate-spin" /> Processing
          </span>
        )
    }
  }

  return (
    <div
      data-testid={`cv-card-${cv._id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl transition hover:border-indigo-500/30 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/70"
    >
      <div>
        {/* Header row: Primary flag + Status */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {cv.isPrimary ? (
              <span
                data-testid="primary-badge"
                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
              >
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Primary CV
              </span>
            ) : (
              <button
                type="button"
                data-testid="set-primary-button"
                onClick={handleSetPrimary}
                disabled={isSettingPrimary}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-amber-600 transition dark:hover:text-amber-400"
              >
                <Star className="h-3 w-3" /> Make Primary
              </button>
            )}
          </div>
          <div>{getStatusBadge()}</div>
        </div>

        {/* Title and subtitle */}
        <Link href={`/cvs/${cv._id}`} className="block group-hover:text-indigo-600">
          <h3 className="text-base font-bold text-slate-900 transition dark:text-white dark:group-hover:text-indigo-400">
            {cv.title || 'Untitled CV'}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
            {cv.personalInfo?.fullName || 'Anonymous'}
            {cv.personalInfo?.headline ? ` • ${cv.personalInfo.headline}` : ''}
          </p>
        </Link>

        {/* Section counters */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          {experiences > 0 && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" /> {experiences} Experience
            </span>
          )}
          {educations > 0 && (
            <span className="flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 text-slate-400" /> {educations} Education
            </span>
          )}
          {skillsCount > 0 && (
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> {skillsCount} Skills
            </span>
          )}
        </div>
      </div>

      {/* Footer row */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="h-3 w-3" />
          <span>
            {cv._createdAt
              ? new Date(cv._createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : 'Recently'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {showConfirmDelete ? (
            <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
              <button
                type="button"
                data-testid="confirm-delete-button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-rose-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-rose-700"
              >
                {isDeleting ? 'Deleting...' : 'Confirm'}
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="rounded-lg px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid="delete-cv-button"
              onClick={() => setShowConfirmDelete(true)}
              className="rounded-lg p-1 text-slate-400 transition hover:text-rose-600 dark:hover:text-rose-400"
              title="Delete CV"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <Link
            href={`/cvs/${cv._id}`}
            data-testid="open-cv-button"
            className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400"
          >
            <span>Open</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
