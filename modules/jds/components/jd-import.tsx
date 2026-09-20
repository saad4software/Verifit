'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Globe,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
} from 'lucide-react'

export function JdImport() {
  const router = useRouter()
  const [mode, setMode] = useState<'text' | 'url'>('text')
  const [value, setValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [existing, setExisting] = useState<string | null>(null)

  async function submit(allowDuplicate = false) {
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/jds/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [mode]: value, allowDuplicate }),
      })
      const data = await response.json()
      if (data.existingId) {
        setExisting(data.existingId)
        return
      }
      if (!response.ok) throw new Error(data.error)
      router.push(`/jds/${data.jd._id}`)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Import failed. Please retry.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      data-testid="import-jd-form"
      className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/80"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Add a job description
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Import one job ad. Review its requirements against the source before marking it ready.
        </p>
      </div>

      {/* Source Radio/Tab Fieldset */}
      <fieldset className="mb-6" disabled={busy}>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Source
        </legend>
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
              mode === 'text'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <input
              type="radio"
              name="source-mode"
              aria-label="Pasted text"
              checked={mode === 'text'}
              onChange={() => {
                setMode('text')
                setValue('')
                setExisting(null)
              }}
              className="sr-only"
            />
            <FileText className="h-4 w-4" />
            <span>Pasted text</span>
          </label>

          <label
            className={`flex cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
              mode === 'url'
                ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <input
              type="radio"
              name="source-mode"
              aria-label="Web page URL"
              checked={mode === 'url'}
              onChange={() => {
                setMode('url')
                setValue('')
                setExisting(null)
              }}
              className="sr-only"
            />
            <Globe className="h-4 w-4" />
            <span>Web page URL</span>
          </label>
        </div>
      </fieldset>

      {/* Input area */}
      <div className="mb-6">
        {mode === 'text' ? (
          <div>
            <label
              htmlFor="job-ad-text"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Job ad text
            </label>
            <textarea
              id="job-ad-text"
              aria-label="Job ad text"
              rows={12}
              className="w-full rounded-xl border border-slate-200 bg-white p-3.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600"
              placeholder="Paste the full job posting, including title, requirements, and responsibilities..."
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                setExisting(null)
              }}
              required
            />
          </div>
        ) : (
          <div>
            <label
              htmlFor="job-ad-url"
              className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Job ad URL
            </label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="job-ad-url"
                aria-label="Job ad URL"
                type="url"
                placeholder="https://boards.greenhouse.io/company/jobs/12345"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  setExisting(null)
                }}
                required
              />
            </div>
          </div>
        )}

        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>
            One ad per import; maximum 50,000 characters. URL retrieval is best effort. You can paste the ad if retrieval fails.
          </span>
          {mode === 'text' && (
            <span className="shrink-0 ml-2 font-mono">{value.length} / 50,000</span>
          )}
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Duplicate warning card */}
      {existing && (
        <div
          role="status"
          className="mb-6 space-y-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>This URL is already in your library.</span>
          </div>
          <div className="flex flex-wrap gap-4 pt-1">
            <Link
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-500 underline dark:text-indigo-400"
              href={`/jds/${existing}`}
            >
              <span>Open existing JD</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
            <button
              type="button"
              disabled={busy}
              className="inline-flex items-center gap-1 font-semibold text-slate-700 hover:text-slate-900 underline dark:text-slate-300 dark:hover:text-white disabled:opacity-50"
              onClick={() => void submit(true)}
            >
              <Copy className="h-3 w-3" />
              <span>Create separate copy</span>
            </button>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={busy}
        className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Starting import…</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Import job description</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  )
}
