'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  Clock,
  Globe,
  FileText,
  Sparkles,
  Layers,
  Trash2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MapPin,
  Building2,
} from 'lucide-react'
import type { Jd } from '../schema'

interface JdCardProps {
  jd: Jd
  onRefresh?: () => void
}

export function JdCard({ jd, onRefresh }: JdCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await fetch(`/api/jds/${jd._id}`, {
        method: 'DELETE',
      })
      onRefresh?.()
    } catch (err) {
      console.error('Failed to delete JD:', err)
    } finally {
      setIsDeleting(false)
      setShowConfirmDelete(false)
    }
  }

  // Extract common fields
  const titleField = jd.content?.fields?.find((f) => f.category === 'title')?.text
  const companyField = jd.content?.fields?.find((f) => f.category === 'company')?.text
  const locationField = jd.content?.fields?.find((f) => f.category === 'location')?.text
  const workArrangement = jd.content?.fields?.find((f) => f.category === 'workArrangement')?.text

  const responsibilitiesCount =
    jd.content?.fields?.filter((f) => f.category === 'responsibilities')?.length || 0
  const qualificationsCount = jd.content?.requirements?.length || 0
  const groupsCount = jd.content?.groups?.length || 0

  const isProcessing = Boolean(jd.processing || jd.replacement?.processing)

  const getStatusBadge = () => {
    if (isProcessing) {
      return (
        <span
          data-testid="status-processing"
          className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300"
        >
          <Loader2 className="h-3 w-3 animate-spin" /> Processing
        </span>
      )
    }

    if (jd.error) {
      return (
        <span
          data-testid="status-error"
          className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
        >
          <AlertCircle className="h-3 w-3" /> Needs Attention
        </span>
      )
    }

    if (jd.readiness === 'ready') {
      return (
        <span
          data-testid="status-ready"
          className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
        >
          <CheckCircle2 className="h-3 w-3" /> Ready
        </span>
      )
    }

    return (
      <span
        data-testid="status-review"
        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
      >
        <AlertCircle className="h-3 w-3" /> Needs Review
      </span>
    )
  }

  return (
    <div
      data-testid={`jd-card-${jd._id}`}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/70 p-5 shadow-sm backdrop-blur-xl transition hover:border-indigo-500/30 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/70"
    >
      <div>
        {/* Header row: Status badges & Replacement indicator */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {jd.replacement && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                <Sparkles className="h-3 w-3 text-indigo-500" /> Replacement Pending
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            {jd.source.origin === 'fetched' ? (
              <span className="inline-flex items-center gap-1" title={jd.source.url}>
                <Globe className="h-3 w-3 text-blue-500" /> URL
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3 w-3 text-slate-400" /> Pasted
              </span>
            )}
          </div>
        </div>

        {/* Title and Company */}
        <Link href={`/dashboard/jds/${jd._id}`} className="block group-hover:text-indigo-600">
          <h3 className="text-base font-bold text-slate-900 transition dark:text-white dark:group-hover:text-indigo-400 line-clamp-1">
            {titleField || 'Imported Job Description'}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {companyField && (
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                {companyField}
              </span>
            )}
            {(locationField || workArrangement) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {[locationField, workArrangement].filter(Boolean).join(' • ')}
              </span>
            )}
          </div>
        </Link>

        {/* Section and Item counters */}
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
          {responsibilitiesCount > 0 && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" /> {responsibilitiesCount} Details
            </span>
          )}
          {qualificationsCount > 0 && (
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> {qualificationsCount} Qualifications
            </span>
          )}
          {groupsCount > 0 && (
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5 text-slate-400" /> {groupsCount} Groups
            </span>
          )}
        </div>
      </div>

      {/* Footer row */}
      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="h-3 w-3" />
          <span>Active Opportunity</span>
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
              data-testid="delete-jd-button"
              onClick={() => setShowConfirmDelete(true)}
              className="rounded-lg p-1 text-slate-400 transition hover:text-rose-600 dark:hover:text-rose-400"
              title="Delete JD"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <Link
            href={`/dashboard/jds/${jd._id}`}
            data-testid="open-jd-button"
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
