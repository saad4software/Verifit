'use client'

import React, { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Trash2,
  ExternalLink,
  Eye,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Globe,
  Printer,
} from 'lucide-react'
import type { Jd } from '../schema'
import { ContentEditor } from './content-editor'
import { JdViewer } from './jd-viewer'
import { JdProgressStepper } from './jd-progress-stepper'

export function JdDetail({ initialJd }: { initialJd: Jd }) {
  const router = useRouter()
  const [jd, setJd] = useState(initialJd)
  const [replacement, setReplacement] = useState(false)
  const [draft, setDraft] = useState(initialJd.content)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [paste, setPaste] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview')

  const deleteDialog = useRef<HTMLDivElement>(null)
  const deleteButton = useRef<HTMLButtonElement>(null)
  const version = replacement && jd.replacement ? jd.replacement : jd
  const processing = Boolean(jd.processing || jd.replacement?.processing)

  // Polling effect when processing
  useEffect(() => {
    if (!processing || dirty || busy) return
    let cancelled = false
    const timer = setInterval(async () => {
      try {
        const response = await fetch(`/api/jds/${jd._id}/status`, {
          cache: 'no-store',
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        if (!cancelled) {
          setJd(data.jd)
          setDraft(
            replacement
              ? (data.jd.replacement?.content ?? null)
              : data.jd.content,
          )
        }
      } catch (error) {
        if (!cancelled)
          setError(
            error instanceof Error
              ? error.message
              : 'Unable to refresh status.',
          )
      }
    }, 2000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [jd._id, processing, replacement, dirty, busy])

  useEffect(() => {
    if (deleting)
      deleteDialog.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }, [deleting])

  async function act(action: string) {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/jds/${jd._id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          revision: jd._rev,
          ...(action === 'save' || action === 'saveConfirm'
            ? { content: draft, replacement }
            : {}),
          ...(action === 'paste' ? { text: paste } : {}),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      setJd(data.jd)
      setDirty(false)
      const showReplacement = replacement && Boolean(data.jd.replacement)
      setReplacement(showReplacement)
      setDraft(showReplacement ? data.jd.replacement.content : data.jd.content)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Unable to save. Please retry.',
      )
    } finally {
      setBusy(false)
    }
  }

  function switchVersion(next: boolean) {
    setReplacement(next)
    setDraft(next ? (jd.replacement?.content ?? null) : jd.content)
    setError('')
  }

  function closeDelete() {
    setDeleting(false)
    deleteButton.current?.focus()
  }

  async function remove() {
    setBusy(true)
    setError('')
    try {
      const response = await fetch(`/api/jds/${jd._id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error((await response.json()).error)
      router.push('/jds')
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Deletion failed.')
      closeDelete()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/jds"
            data-testid="back-to-jds-link"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition dark:text-slate-400 dark:hover:text-indigo-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All job descriptions</span>
          </Link>

          <span className="text-slate-300 dark:text-slate-700">•</span>

          {jd.readiness === 'ready' ? (
            <span
              data-testid="ready-badge"
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-3 w-3" /> Ready for matching
            </span>
          ) : (
            <span
              data-testid="review-badge"
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            >
              <AlertCircle className="h-3 w-3" /> Needs review
            </span>
          )}
        </div>

        {/* Toolbar buttons: View toggle, Print/PDF, Sanity Studio, Delete */}
        <div className="flex items-center gap-2">
          {draft && (
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
          )}

          {draft && (
            <button
              type="button"
              data-testid="print-jd-button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Print or Export to PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          )}

          <Link
            href={`/studio/structure/jd;${jd._id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Inspect in Sanity Studio"
          >
            <span className="hidden sm:inline">Sanity Studio</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            ref={deleteButton}
            type="button"
            data-testid="delete-jd-button"
            onClick={() => setDeleting(true)}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50 dark:border-slate-800 dark:bg-slate-900 dark:text-rose-400 dark:hover:bg-rose-950/30 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete JD</span>
          </button>
        </div>
      </div>

      {/* Screen-reader status announcement */}
      <p className="sr-only" role="status">
        {jd.readiness === 'ready'
          ? 'Ready for future matching'
          : 'Needs review'}
      </p>

      {/* Error Alert */}
      {error && (
        <p role="alert" className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-medium text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      )}

      {/* Replacement Review Banner */}
      {jd.replacement && (
        <section className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-5 shadow-sm dark:border-indigo-900/60 dark:bg-indigo-950/40 print:hidden">
          <div className="flex items-center gap-2 font-semibold text-indigo-900 dark:text-indigo-200">
            <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <p>Your current JD stays available while you review its replacement.</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                !replacement
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              } disabled:opacity-50`}
              disabled={busy || dirty}
              onClick={() => switchVersion(false)}
            >
              View current JD
            </button>
            <button
              type="button"
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                replacement
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              } disabled:opacity-50`}
              disabled={busy || dirty}
              onClick={() => switchVersion(true)}
            >
              Review replacement
            </button>
          </div>
          {dirty && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Save or discard edits before changing versions.
            </p>
          )}
        </section>
      )}

      {/* Stepper Pipeline - shown while processing, on error, or when not ready */}
      {(!draft || Boolean(version.processing) || Boolean(version.error) || jd.readiness !== 'ready') && (
        <div className="print:hidden">
          <JdProgressStepper jd={jd} version={version} />
        </div>
      )}

      {/* Active Processing Live Status */}
      {version.processing && (
        <p role="status" className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 text-xs font-medium text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-200">
          {version.processing.stage === 'extracting'
            ? 'Retrieving and extracting the job ad…'
            : 'Structuring the job description…'}{' '}
          Interrupted processing becomes recoverable after five minutes.
        </p>
      )}

      {/* Version Error and Retry */}
      {version.error && (
        <div role="alert" className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs dark:border-amber-900/50 dark:bg-amber-950/30">
          <p className="font-medium text-amber-900 dark:text-amber-200">{version.error}</p>
          {!replacement && version.source.text && (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 shadow-sm hover:bg-amber-50 dark:border-amber-800 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800 disabled:opacity-50"
              disabled={busy || Boolean(version.processing)}
              onClick={() => void act('retry')}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry retained text</span>
            </button>
          )}
        </div>
      )}

      {/* Pasted Fallback for failed URL extraction */}
      {!replacement && jd.error && !jd.source.text && jd.source.url && (
        <section className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Paste the job ad
            <textarea
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              rows={8}
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={busy || !paste.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-50"
            onClick={() => void act('paste')}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Continue with pasted text</span>
          </button>
        </section>
      )}

      {/* Main Content Area */}
      {draft ? (
        activeTab === 'preview' ? (
          /* PREVIEW VIEW: Clean, centered document view like CV Details Page; Retained source is hidden */
          <div className="space-y-6">
            <JdViewer content={draft} />

            {/* In-preview actions when review is pending */}
            {!replacement && jd.readiness !== 'ready' && (
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 print:hidden">
                <button
                  type="button"
                  data-testid="preview-edit-button"
                  onClick={() => setActiveTab('edit')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit &amp; review fields</span>
                </button>
                <button
                  type="button"
                  data-testid="preview-confirm-button"
                  onClick={() => void act('confirm')}
                  disabled={busy || dirty || Boolean(version.processing)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Confirm review</span>
                </button>
              </div>
            )}

            {/* Replacement Decision Controls in Preview */}
            {replacement ? (
              <div className="flex flex-wrap justify-center gap-3 border-t border-slate-200/60 pt-6 dark:border-slate-800 print:hidden">
                <button
                  type="button"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50"
                  disabled={
                    busy ||
                    dirty ||
                    !version.content ||
                    Boolean(version.processing) ||
                    Boolean(version.error)
                  }
                  onClick={() => void act('accept')}
                >
                  Accept replacement
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50"
                  disabled={busy || dirty}
                  onClick={() => void act('reject')}
                >
                  Reject replacement
                </button>
              </div>
            ) : (
              jd.content && jd.readiness === 'ready' && (
                <div className="flex flex-wrap justify-center gap-3 border-t border-slate-200/60 pt-6 dark:border-slate-800 print:hidden">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50"
                    disabled={
                      busy ||
                      dirty ||
                      Boolean(jd.replacement) ||
                      Boolean(jd.processing)
                    }
                    onClick={() => void act('reprocess')}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Reprocess retained text</span>
                  </button>
                  {jd.source.url && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50"
                      disabled={
                        busy ||
                        dirty ||
                        Boolean(jd.replacement) ||
                        Boolean(jd.processing)
                      }
                      onClick={() => void act('refetch')}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Refetch URL for replacement</span>
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        ) : (
          /* EDIT VIEW: Editable fields first, Retained source beneath */
          <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {replacement ? 'Edit proposed replacement' : 'Edit job description fields'}
              </h2>
            </div>

            {/* Warnings & Findings */}
            {version.warnings.length > 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200 mb-2">
                  Warnings
                </p>
                <ul className="list-disc pl-5 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  {version.warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {version.findings.length > 0 && (
              <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
                <p className="font-semibold text-sm text-amber-900 dark:text-amber-200 mb-2">
                  Resolve before confirming
                </p>
                <ul className="list-disc pl-5 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  {version.findings.map((finding, index) => (
                    <li key={index}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Content Form Editor with all editable fields */}
            <ContentEditor
              content={draft}
              disabled={busy || Boolean(version.processing)}
              onChange={(value) => {
                setDraft(value)
                setDirty(true)
              }}
            />

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Keep claims faithful to the source. Automated checks assist your review; they cannot guarantee correctness.
            </p>

            {/* Action Buttons Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-50"
                disabled={busy || Boolean(version.processing)}
                onClick={() => void act('save')}
              >
                Save corrections
              </button>

              {!replacement && (
                <>
                  <button
                    type="button"
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:brightness-110 disabled:opacity-50"
                    disabled={busy || Boolean(version.processing)}
                    onClick={() => void act('saveConfirm')}
                  >
                    Save and confirm
                  </button>

                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-50"
                    disabled={busy || dirty || Boolean(version.processing)}
                    onClick={() => void act('confirm')}
                  >
                    Confirm review
                  </button>
                </>
              )}

              {dirty && (
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                  disabled={busy}
                  onClick={() => {
                    setDraft(version.content)
                    setDirty(false)
                  }}
                >
                  Discard edits
                </button>
              )}
            </div>

            {/* Retained Source Panel - positioned beneath all edit editable fields */}
            <section
              data-testid="retained-source-panel"
              className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 sm:p-8 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Retained source
                  </h3>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    (Original job advertisement for reference)
                  </span>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase">
                  {version.source.origin}
                </span>
              </div>

              {version.source.url && (
                <p className="my-3 break-all text-xs text-slate-600 dark:text-slate-400">
                  {version.source.origin === 'pasted'
                    ? 'Pasted text; URL kept as provenance:'
                    : 'Imported from:'}{' '}
                  <a
                    href={version.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400"
                  >
                    {version.source.url}
                  </a>
                </p>
              )}

              <pre className="mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-50/80 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:bg-slate-950/60 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60">
                {version.source.text || 'No source text retrieved yet.'}
              </pre>
            </section>

            {/* Replacement Decision Controls */}
            {replacement ? (
              <div className="flex flex-wrap gap-3 border-t border-slate-200/60 pt-6 dark:border-slate-800">
                <button
                  type="button"
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-500 disabled:opacity-50"
                  disabled={
                    busy ||
                    dirty ||
                    !version.content ||
                    Boolean(version.processing) ||
                    Boolean(version.error)
                  }
                  onClick={() => void act('accept')}
                >
                  Accept replacement
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50"
                  disabled={busy || dirty}
                  onClick={() => void act('reject')}
                >
                  Reject replacement
                </button>
              </div>
            ) : (
              jd.content && (
                <div className="flex flex-wrap gap-3 border-t border-slate-200/60 pt-6 dark:border-slate-800">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50"
                    disabled={
                      busy ||
                      dirty ||
                      Boolean(jd.replacement) ||
                      Boolean(jd.processing)
                    }
                    onClick={() => void act('reprocess')}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Reprocess retained text</span>
                  </button>
                  {jd.source.url && (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 disabled:opacity-50"
                      disabled={
                        busy ||
                        dirty ||
                        Boolean(jd.replacement) ||
                        Boolean(jd.processing)
                      }
                      onClick={() => void act('refetch')}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Refetch URL for replacement</span>
                    </button>
                  )}
                </div>
              )
            )}
          </div>
        )
      ) : (
        /* When content has not been structured yet, show retained source if available */
        version.source.text && (
          <section
            data-testid="retained-source-panel"
            className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/70"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Retained source
              </h3>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 uppercase">
                {version.source.origin}
              </span>
            </div>

            {version.source.url && (
              <p className="my-3 break-all text-xs text-slate-600 dark:text-slate-400">
                {version.source.origin === 'pasted'
                  ? 'Pasted text; URL kept as provenance:'
                  : 'Imported from:'}{' '}
                <a
                  href={version.source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-indigo-600 underline hover:text-indigo-500 dark:text-indigo-400"
                >
                  {version.source.url}
                </a>
              </p>
            )}

            <pre className="mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-50/80 p-4 font-mono text-xs leading-relaxed text-slate-700 dark:bg-slate-950/60 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800/60">
              {version.source.text}
            </pre>
          </section>
        )
      )}

      {/* Accessible Deletion Confirmation Dialog */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            ref={deleteDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-jd-title"
            className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !busy) closeDelete()
              if (e.key === 'Tab') {
                const buttons = deleteDialog.current?.querySelectorAll('button')
                if (buttons?.length) {
                  e.preventDefault()
                  ;(document.activeElement === buttons[0]
                    ? buttons[1]
                    : buttons[0]
                  ).focus()
                }
              }
            }}
          >
            <h2 id="delete-jd-title" className="text-lg font-bold text-slate-900 dark:text-white">
              Delete job description?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This removes the job description, retained source, and any pending replacement.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                disabled={busy}
                onClick={closeDelete}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-500 disabled:opacity-50"
                disabled={busy}
                onClick={() => void remove()}
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
