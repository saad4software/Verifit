'use client'

import React from 'react'
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { Jd, Version } from '../schema'

interface JdProgressStepperProps {
  jd: Jd
  version: Version
}

export function JdProgressStepper({ jd, version }: JdProgressStepperProps) {
  const isProcessing = Boolean(version.processing)
  const isError = Boolean(version.error)
  const isReady = jd.readiness === 'ready' && !isProcessing && !isError

  const steps = [
    {
      id: 'extracting',
      name: 'Source Extraction',
      description: version.source.origin === 'fetched' ? 'Retrieving web content' : 'Pasted text source',
      icon: FileText,
    },
    {
      id: 'structuring',
      name: 'AI Structuring',
      description: 'Parsing claims & evidence',
      icon: Sparkles,
    },
    {
      id: 'ready',
      name: 'Review & Readiness',
      description: isReady ? 'Validated & stored in Sanity' : 'Awaiting confirmation',
      icon: CheckCircle2,
    },
  ]

  const getStepState = (idx: number) => {
    if (isError) {
      if (idx === 0) return 'completed'
      if (idx === 1) return 'error'
      return 'pending'
    }

    if (isReady) return 'completed'

    if (isProcessing) {
      if (version.processing?.stage === 'extracting') {
        if (idx === 0) return 'active'
        return 'pending'
      }
      if (version.processing?.stage === 'structuring') {
        if (idx === 0) return 'completed'
        if (idx === 1) return 'active'
        return 'pending'
      }
    }

    // Finished processing, needs review
    if (idx < 2) return 'completed'
    return 'active'
  }

  return (
    <div
      data-testid="jd-progress-stepper"
      className="w-full rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Ingestion Pipeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isReady
              ? 'Job description is confirmed and ready for matching.'
              : isProcessing
              ? 'Sanity AI Agent is currently analyzing and structuring this job ad.'
              : isError
              ? 'Processing stopped with an error. Review the details below.'
              : 'Extraction completed. Review claims and confirm readiness.'}
          </p>
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Processing</span>
          </div>
        )}
      </div>

      {/* Steps Track */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((step, idx) => {
          const state = getStepState(idx)
          const Icon = step.icon

          return (
            <div
              key={step.id}
              data-testid={`step-${step.id}`}
              className={`relative flex items-center gap-3.5 rounded-xl border p-3.5 transition-all ${
                state === 'completed'
                  ? 'border-emerald-500/30 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-950/20'
                  : state === 'active'
                  ? 'border-indigo-500/40 bg-indigo-50/60 shadow-sm shadow-indigo-500/10 dark:border-indigo-500/30 dark:bg-indigo-950/30'
                  : state === 'error'
                  ? 'border-rose-500/30 bg-rose-50/50 dark:border-rose-500/20 dark:bg-rose-950/20'
                  : 'border-slate-200/60 bg-slate-50/40 opacity-60 dark:border-slate-800/60 dark:bg-slate-900/40'
              }`}
            >
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  state === 'completed'
                    ? 'bg-emerald-500 text-white'
                    : state === 'active'
                    ? 'bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white animate-pulse'
                    : state === 'error'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {state === 'completed' ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : state === 'error' ? (
                  <AlertCircle className="h-5 w-5" />
                ) : state === 'active' && isProcessing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              <div className="flex flex-col min-w-0">
                <span
                  className={`text-sm font-semibold truncate ${
                    state === 'completed'
                      ? 'text-emerald-900 dark:text-emerald-200'
                      : state === 'active'
                      ? 'text-indigo-900 dark:text-indigo-200'
                      : state === 'error'
                      ? 'text-rose-900 dark:text-rose-200'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {step.name}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {step.description}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
