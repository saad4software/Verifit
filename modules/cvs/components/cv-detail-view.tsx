'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { flushSync } from 'react-dom'
import {
  ArrowLeft,
  Edit3,
  Eye,
  Printer,
  Star,
} from 'lucide-react'
import { CVDocument, IngestionStatus } from '../types'
import { ProgressStepper } from './progress-stepper'
import { CvViewer } from './cv-viewer'
import { CvEditor } from './cv-editor'

interface CvDetailViewProps {
  initialCv: CVDocument
}

export function CvDetailView({ initialCv }: CvDetailViewProps) {
  const [cv, setCv] = useState<CVDocument>(initialCv)
  const [status, setStatus] = useState<IngestionStatus>(initialCv.ingestionStatus)
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    initialCv.errorMessage
  )
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview')
  const [isSettingPrimary, setIsSettingPrimary] = useState(false)

  // Polling effect when processing
  useEffect(() => {
    if (status === 'ready' || status === 'failed') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/cvs/${cv._id}/status`)
        if (!res.ok) return

        const data = await res.json()
        setStatus(data.ingestionStatus)
        setErrorMessage(data.errorMessage)

        if (data.ingestionStatus === 'ready') {
          // Fetch updated full document
          const fullRes = await fetch(`/api/cvs/${cv._id}`)
          if (fullRes.ok) {
            const fullData = await fullRes.json()
            setCv(fullData.cv)
          }
        }
      } catch (err) {
        console.error('Polling status failed:', err)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [cv._id, status])

  const handleSetPrimary = async () => {
    setIsSettingPrimary(true)
    try {
      const res = await fetch(`/api/cvs/${cv._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true }),
      })
      if (res.ok) {
        const data = await res.json()
        setCv(data.cv)
      }
    } catch (err) {
      console.error('Failed to set primary CV:', err)
    } finally {
      setIsSettingPrimary(false)
    }
  }

  const handlePrint = () => {
    flushSync(() => setActiveTab('preview'))
    window.print()
  }

  return (
    <div
      data-testid="cv-detail-view"
      className="cv-detail mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Only mount this page rule on the CV detail page. */}
      <style media="print">{`@page { margin: 0; }`}</style>
      {/* Navigation and Actions Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/cvs"
            data-testid="back-to-cvs-link"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition dark:text-slate-400 dark:hover:text-indigo-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>My Resumes</span>
          </Link>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          {cv.isPrimary ? (
            <span
              data-testid="primary-indicator"
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            >
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Primary CV
            </span>
          ) : (
            <button
              type="button"
              data-testid="detail-set-primary-button"
              onClick={handleSetPrimary}
              disabled={isSettingPrimary}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-amber-600 transition dark:hover:text-amber-400"
            >
              <Star className="h-3.5 w-3.5" />
              <span>Make Primary</span>
            </button>
          )}
        </div>

        {/* Action buttons (Preview / Edit / Print) */}
        {status === 'ready' && (
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                data-testid="toggle-preview-mode"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'preview'
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Preview</span>
              </button>
              <button
                type="button"
                data-testid="toggle-edit-mode"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'edit'
                    ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            </div>

            <button
              type="button"
              data-testid="print-cv-button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Print or Export to PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

          </div>
        )}
      </div>

      {/* Ingestion Stepper if not ready */}
      {status !== 'ready' && (
        <div className="mb-8">
          <ProgressStepper
            cvId={cv._id}
            status={status}
            errorMessage={errorMessage}
            rawText={cv.rawText}
            onStatusChange={(newStatus) => setStatus(newStatus)}
          />
        </div>
      )}

      {/* Main Content Area */}
      {status === 'ready' ? (
        activeTab === 'preview' ? (
          <CvViewer cv={cv} />
        ) : (
          <CvEditor
            cv={cv}
            onSaveSuccess={(updated) => {
              setCv(updated)
            }}
          />
        )
      ) : cv.rawText ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/70 p-6 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/70">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Retained Raw Text (Auditing)
          </h4>
          <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap font-mono text-xs text-slate-600 dark:text-slate-300">
            {cv.rawText}
          </pre>
        </div>
      ) : null}
    </div>
  )
}
