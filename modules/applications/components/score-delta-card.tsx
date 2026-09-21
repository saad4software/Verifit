'use client'

import React from 'react'
import { TrendingUp, Award, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react'
import type { ScoreDelta } from '../types'

interface ScoreDeltaCardProps {
  scoreDelta: ScoreDelta | null | undefined
  tailoringStatus: string
  onTailorClick?: () => void
}

export function ScoreDeltaCard({
  scoreDelta,
  tailoringStatus,
  onTailorClick,
}: ScoreDeltaCardProps) {
  const oldScore = scoreDelta?.oldScore ?? null
  const newScore = scoreDelta?.newScore ?? null
  const diff = scoreDelta?.scoreDiff ?? null
  const gapsClosed = scoreDelta?.gapsClosed ?? 0
  const total = scoreDelta?.totalRequirements ?? 0

  if (!oldScore && !newScore) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Fit Assessment Pending
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Baseline fit score has not been calculated yet.
              </p>
            </div>
          </div>
          {onTailorClick && tailoringStatus !== 'running' && (
            <button
              onClick={onTailorClick}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
            >
              Analyze & Tailor CV
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800/60 dark:bg-slate-800/20">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Match Fit Comparison
            </h2>
          </div>
          {typeof diff === 'number' && diff > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+{diff} points improvement</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {/* Baseline Score */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-slate-50/80 p-5 text-center dark:bg-slate-800/40">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Baseline Fit Score
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-slate-800 dark:text-slate-100">
              {oldScore !== null ? oldScore : '—'}
            </span>
            <span className="text-sm font-medium text-slate-400">/100</span>
          </div>
          <span className="mt-1 text-xs text-slate-500">Original Base CV</span>
        </div>

        {/* Arrow & Gaps Summary */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-indigo-50/40 p-5 text-center dark:bg-indigo-950/20">
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400">
            <ArrowRight className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Tailoring Impact
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-5 w-5" />
            <span className="text-xl font-bold">
              {gapsClosed} {gapsClosed === 1 ? 'Gap' : 'Gaps'} Closed
            </span>
          </div>
          <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            out of {total} requirements evaluated
          </span>
        </div>

        {/* Tailored Score */}
        <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50/60 p-5 text-center dark:bg-emerald-950/30">
          <span className="text-xs font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            Tailored Fit Score
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {newScore !== null ? newScore : 'Pending'}
            </span>
            {newScore !== null && (
              <span className="text-sm font-medium text-emerald-600/70">/100</span>
            )}
          </div>
          <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {newScore !== null ? 'Tailored Variant' : 'Tailor CV to view'}
          </span>
        </div>
      </div>
    </div>
  )
}
