'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  UploadCloud,
  FileText,
  FileCode,
  X,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { MAX_FILE_SIZE_BYTES } from '../schemas'

export function ImportForm() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload')
  const [title, setTitle] = useState('')
  const [rawText, setRawText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    setErrorMessage(null)

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File exceeds 5 MB limit (file size: ${(file.size / (1024 * 1024)).toFixed(2)} MB). Please select a smaller file.`
      )
      return
    }

    const name = file.name.toLowerCase()
    const validExtensions = ['.pdf', '.docx', '.txt']
    const hasValidExtension = validExtensions.some((ext) => name.endsWith(ext))

    if (!hasValidExtension) {
      setErrorMessage(
        'Unsupported file format. Please upload a PDF (.pdf), Word Document (.docx), or plain text (.txt).'
      )
      return
    }

    setSelectedFile(file)
    if (!title) {
      const baseName = file.name.replace(/\.[^/.]+$/, '')
      setTitle(baseName)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (activeTab === 'upload' && !selectedFile) {
      setErrorMessage('Please select or drop a PDF or DOCX file.')
      return
    }

    if (activeTab === 'text' && !rawText.trim()) {
      setErrorMessage('Please paste your CV text content.')
      return
    }

    setIsSubmitting(true)

    try {
      let res: Response
      if (activeTab === 'upload' && selectedFile) {
        const formData = new FormData()
        formData.append('file', selectedFile)
        if (title.trim()) formData.append('title', title.trim())

        res = await fetch('/api/cvs/import', {
          method: 'POST',
          body: formData,
        })
      } else {
        res = await fetch('/api/cvs/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim() || undefined,
            rawText: rawText.trim(),
          }),
        })
      }

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to import CV')
      }

      // Immediately navigate to /dashboard/cvs/[id] with live stepper
      router.push(`/dashboard/cvs/${data.cvId}`)
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong during import.'
      setErrorMessage(message)
      setIsSubmitting(false)
    }
  }

  return (
    <form
      data-testid="import-cv-form"
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-2xl rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-xl backdrop-blur-xl sm:p-8 dark:border-slate-800/80 dark:bg-slate-900/80"
    >
      <div className="mb-6 flex flex-col gap-1">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Import Your CV
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload a document or paste raw text. The Sanity AI Agent will automatically parse and structure it into standardized sections.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <button
          type="button"
          data-testid="tab-upload"
          onClick={() => {
            setActiveTab('upload')
            setErrorMessage(null)
          }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
            activeTab === 'upload'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload File (PDF / DOCX)</span>
        </button>

        <button
          type="button"
          data-testid="tab-text"
          onClick={() => {
            setActiveTab('text')
            setErrorMessage(null)
          }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition ${
            activeTab === 'text'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Paste Plain Text</span>
        </button>
      </div>

      {/* CV Title Input */}
      <div className="mb-5">
        <label
          htmlFor="cv-title"
          className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
        >
          CV Title (Optional)
        </label>
        <input
          id="cv-title"
          data-testid="cv-title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Senior Software Engineer 2026"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-600"
        />
      </div>

      {/* Tab: Upload File */}
      {activeTab === 'upload' && (
        <div className="mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0])
              }
            }}
            className="hidden"
            data-testid="file-input"
          />

          {!selectedFile ? (
            <div
              data-testid="file-dropzone"
              onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-400 dark:bg-indigo-950/20'
                  : 'border-slate-300 bg-slate-50/50 hover:border-indigo-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <UploadCloud className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">
                Drag & drop your resume here, or <span className="text-indigo-600 dark:text-indigo-400">browse</span>
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Supports PDF, DOCX, or TXT up to 5 MB
              </p>
            </div>
          ) : (
            <div
              data-testid="selected-file-preview"
              className="flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/30"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <FileCode className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to extract
                  </p>
                </div>
              </div>

              <button
                type="button"
                data-testid="remove-file-button"
                onClick={() => setSelectedFile(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Plain Text */}
      {activeTab === 'text' && (
        <div className="mb-6">
          <label
            htmlFor="raw-text"
            className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            Raw Resume Content
          </label>
          <textarea
            id="raw-text"
            data-testid="raw-text-input"
            rows={10}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste your resume or career summary here..."
            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 font-mono text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-600"
          />
          <div className="mt-1 flex justify-between text-[11px] text-slate-400">
            <span>Include contact info, work history, and skills</span>
            <span>{rawText.length} characters</span>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div
          data-testid="import-error-banner"
          className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        data-testid="import-submit-button"
        disabled={isSubmitting}
        className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 hover:brightness-110 disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Ingesting & Initializing Structuring...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Import & Structure with AI</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </form>
  )
}
