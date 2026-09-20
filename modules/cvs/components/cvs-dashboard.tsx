'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Search,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { CVDocument } from '../types'
import { CvCard } from './cv-card'

interface CvsDashboardProps {
  initialCvs: CVDocument[]
}

export function CvsDashboard({ initialCvs }: CvsDashboardProps) {
  const [cvs, setCvs] = useState<CVDocument[]>(initialCvs)
  const [searchQuery, setSearchQuery] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/cvs')
      if (res.ok) {
        const data = await res.json()
        setCvs(data.cvs || [])
      }
    } catch (err) {
      console.error('Failed to refresh CVs:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const filteredCvs = cvs.filter((c) => {
    const query = searchQuery.toLowerCase()
    const matchTitle = c.title?.toLowerCase().includes(query)
    const matchName = c.personalInfo?.fullName?.toLowerCase().includes(query)
    const matchHeadline = c.personalInfo?.headline?.toLowerCase().includes(query)
    return matchTitle || matchName || matchHeadline
  })

  return (
    <div data-testid="cvs-dashboard" className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* Header with Title and Import CTA */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            My Resumes & CVs
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Manage your baseline CVs and tailor them with Sanity AI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="refresh-cvs-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Refresh CVs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Link
            href="/cvs/import"
            data-testid="import-new-cv-button"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:shadow-indigo-500/40 hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            <span>Import New CV</span>
          </Link>
        </div>
      </div>

      {/* Search Bar */}
      {cvs.length > 0 && (
        <div className="mb-6 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            data-testid="search-cvs-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search CVs by title, name, or role..."
            className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900/80 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
      )}

      {/* Empty State */}
      {cvs.length === 0 ? (
        <div
          data-testid="empty-cvs-state"
          className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center dark:border-slate-800 dark:bg-slate-950/40"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            No CVs imported yet
          </h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
            Import your existing resume as a PDF, DOCX, or raw text. The Sanity AI Agent will structure it into ATS-friendly sections ready for instant tailoring.
          </p>

          <Link
            href="/cvs/import"
            data-testid="empty-state-import-button"
            className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-indigo-500"
          >
            <Sparkles className="h-4 w-4" />
            <span>Import Your First CV</span>
          </Link>
        </div>
      ) : filteredCvs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No CVs matched &ldquo;{searchQuery}&rdquo;.
          </p>
        </div>
      ) : (
        /* CV Grid */
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredCvs.map((cv) => (
            <CvCard key={cv._id} cv={cv} onRefresh={handleRefresh} />
          ))}
        </div>
      )}
    </div>
  )
}
