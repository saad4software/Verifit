'use client'

import React from 'react'
import { Check, Clock, MinusCircle, AlertTriangle, Sparkles } from 'lucide-react'
import type { RequirementDelta } from '../types'

interface RequirementDeltaTableProps {
  deltas: RequirementDelta[] | undefined
}

function StatusPill({ status }: { status: string }) {
  switch (status) {
    case 'met':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
          <Check className="h-3 w-3" /> Met
        </span>
      )
    case 'partial':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
          <Clock className="h-3 w-3" /> Partial
        </span>
      )
    case 'not_met':
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          <MinusCircle className="h-3 w-3" /> Not Met
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          <AlertTriangle className="h-3 w-3" /> Unevidenced
        </span>
      )
  }
}

export function RequirementDeltaTable({ deltas }: RequirementDeltaTableProps) {
  if (!deltas || deltas.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        No requirements evaluated yet.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800/60 dark:bg-slate-800/20">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          Requirement Alignment Breakdown
        </h3>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Compare candidate evidence before and after CV tailoring against job requirements.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/30 text-xs font-medium uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
            <tr>
              <th className="px-6 py-3">Requirement</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-center">Baseline Fit</th>
              <th className="px-4 py-3 text-center">Tailored Fit</th>
              <th className="px-6 py-3 text-right">Impact</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {deltas.map((delta, i) => (
              <tr
                key={delta.requirementId || i}
                className={`transition hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                  delta.improved ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <p className="max-w-md font-medium text-slate-800 dark:text-slate-200">
                    {delta.text}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <span className="capitalize text-xs text-slate-500 dark:text-slate-400">
                    {delta.classification}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <StatusPill status={delta.baselineStatus} />
                </td>
                <td className="px-4 py-4 text-center">
                  <StatusPill status={delta.tailoredStatus} />
                </td>
                <td className="px-6 py-4 text-right">
                  {delta.improved ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100/70 px-2 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                      <Sparkles className="h-3 w-3" /> Gap Closed
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Unchanged
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
