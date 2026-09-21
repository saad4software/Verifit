'use client'

import React, { useState } from 'react'
import { Plus, Briefcase, Award, CheckCircle2, RefreshCw } from 'lucide-react'
import type { PopulatedApplication } from '../types'
import { KanbanBoard } from './kanban-board'
import { NewApplicationModal } from './new-application-modal'

interface ApplicationsDashboardProps {
  initialApplications: PopulatedApplication[]
}

export function ApplicationsDashboard({
  initialApplications,
}: ApplicationsDashboardProps) {
  const [applications, setApplications] = useState<PopulatedApplication[]>(initialApplications)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch('/api/applications')
      if (res.ok) {
        const data = await res.json()
        setApplications(data.applications || [])
      }
    } catch (err) {
      console.error('Failed to refresh applications:', err)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleApplicationCreated = (newApp: PopulatedApplication) => {
    setApplications((prev) => [newApp, ...prev])
  }

  const total = applications.length
  const interviewing = applications.filter((a) => a.status === 'interviewing').length
  const offered = applications.filter((a) => a.status === 'offered').length
  const scores = applications
    .map((a) => a.scoreDelta?.newScore ?? a.scoreDelta?.oldScore)
    .filter((s): s is number => typeof s === 'number')
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Job Applications
            </h1>
            <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
              {total} Total
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Tailor resumes for specific job descriptions, evaluate match fit, and track your hiring pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="refresh-applications-button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            title="Refresh Applications"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            data-testid="new-application-button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="my-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <Briefcase className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Total Tracked</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{total}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Briefcase className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Interviewing</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
            {interviewing}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Offers</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {offered}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Award className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Avg Match Fit</span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {avgScore !== null ? `${avgScore}%` : '—'}
          </p>
        </div>
      </div>

      {/* Main Kanban Board */}
      <KanbanBoard
        initialApplications={applications}
        onApplicationsChange={setApplications}
      />

      {/* New Application Modal */}
      <NewApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleApplicationCreated}
      />
    </div>
  )
}
