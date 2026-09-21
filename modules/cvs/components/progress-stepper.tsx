'use client'

import React, { useState } from 'react'
import {
  CheckCircle2,
  FileText,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { IngestionStatus } from '../types'

interface ProgressStepperProps {
  cvId: string
  status: IngestionStatus
  errorMessage?: string
  rawText?: string
  onStatusChange?: (newStatus: IngestionStatus) => void
}

export function ProgressStepper({
  cvId,
  status,
  errorMessage,
  onStatusChange,
}: ProgressStepperProps) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  const steps = [
    {
      id: 'extracting',
      name: 'Extract Text',
      description: 'Parsing document content in memory',
      icon: FileText,
    },
    {
      id: 'structuring',
      name: 'AI Agent Structuring',
      description: 'Extracting sections into schema fields',
      icon: Sparkles,
    },
    {
      id: 'ready',
      name: 'Structured CV Ready',
      description: 'Validated & stored in dataset',
      icon: CheckCircle2,
    },
  ]

  const getStepState = (stepIndex: number) => {
    if (status === 'failed') {
      if (stepIndex === 0) return 'completed'
      if (stepIndex === 1) return 'error'
      return 'pending'
    }

    if (status === 'ready') return 'completed'

    if (status === 'structuring') {
      if (stepIndex === 0) return 'completed'
      if (stepIndex === 1) return 'active'
      return 'pending'
    }

    // extracting or pending
    if (stepIndex === 0) return 'active'
    return 'pending'
  }

  const handleRetry = async () => {
    setIsRetrying(true)
    setRetryError(null)

    try {
      const res = await fetch(`/api/cvs/${cvId}/retry`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Retry failed')
      }
      onStatusChange?.('extracting')
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to trigger retry.'
      setRetryError(message)
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div
      data-testid="progress-stepper"
      className="w-full rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70"
    >
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Ingestion Pipeline
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {status === 'ready'
              ? 'Your CV is fully structured and ready for tailoring'
              : status === 'failed'
              ? 'Structuring stopped with an error'
              : 'Processing your document with AI Agent'}
          </p>
        </div>

        {status !== 'ready' && status !== 'failed' && (
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Live Processing</span>
          </div>
        )}
      </div>

      {/* Stepper track */}
      <div className="relative grid grid-cols-1 gap-4 md:grid-cols-3">
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
                ) : state === 'active' ? (
                  <Icon className="h-5 w-5 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5" />
                )}
              </div>

              <div className="flex flex-col">
                <span
                  className={`text-sm font-semibold ${
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
                <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                  {step.description}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Failure recovery banner */}
      {status === 'failed' && (
        <div
          data-testid="stepper-error-banner"
          className="mt-5 rounded-xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/50 dark:bg-rose-950/30"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                AI Structuring Encountered an Issue
              </h4>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                {errorMessage ||
                  'The AI Agent could not complete structuring this document. Your extracted text has been preserved.'}
              </p>
              {retryError && (
                <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                  {retryError}
                </p>
              )}

              <div className="mt-3 flex items-center gap-3">
                <button
                  type="button"
                  data-testid="retry-structuring-button"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-50"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Retrying...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retry Structuring</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
