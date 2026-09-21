'use client'

import React, { useState } from 'react'
import {
  X,
  FileText,
  Copy,
  Check,
  Download,
  ExternalLink,
  Package,
} from 'lucide-react'
import type { PopulatedApplication } from '../types'

interface ApplicationPackageDrawerProps {
  application: PopulatedApplication
  isOpen: boolean
  onClose: () => void
}

export function ApplicationPackageDrawer({
  application,
  isOpen,
  onClose,
}: ApplicationPackageDrawerProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const tailoredCvId = application.tailoredCv?._ref || application.tailoredCvData?._id
  const coverLetter = application.coverLetter || ''
  const externalJobUrl = application.jdData?.source?.url

  const handleCopyCoverLetter = async () => {
    if (!coverLetter) return
    await navigator.clipboard.writeText(coverLetter)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadCoverLetter = () => {
    if (!coverLetter) return
    const blob = new Blob([coverLetter], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Cover-Letter-${application.title?.replace(/[^a-zA-Z0-9]/g, '-') || 'Job'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Application Package
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Target Opportunity
            </h3>
            <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">
              {application.title || 'Job Application'}
            </p>
            {externalJobUrl && (
              <a
                href={externalJobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Original Job Posting
              </a>
            )}
          </div>

          {/* Tailored CV Section */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Tailored Resume (CV)
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {tailoredCvId ? 'Customized for ATS alignment' : 'Not generated yet'}
                  </p>
                </div>
              </div>
            </div>

            {tailoredCvId ? (
              <div className="mt-4 flex gap-2">
                <a
                  href={`/dashboard/cvs/${tailoredCvId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  View & Print PDF
                </a>
              </div>
            ) : (
              <p className="mt-3 text-xs italic text-slate-400">
                Run the tailoring agent to generate your customized CV.
              </p>
            )}
          </div>

          {/* Cover Letter Section */}
          <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Cover Letter
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {coverLetter ? 'Ready for submission' : 'Not generated yet'}
                  </p>
                </div>
              </div>
            </div>

            {coverLetter ? (
              <div className="mt-4 flex flex-col gap-2">
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyCoverLetter}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy to Clipboard
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadCoverLetter}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    .txt
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-3 text-xs italic text-slate-400">
                Generate a cover letter in the Cover Letter tab.
              </p>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
