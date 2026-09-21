'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Briefcase,
  LayoutGrid,
  List,
  Search,
  MoreVertical,
  Trash2,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import type { ApplicationStatus, PopulatedApplication } from '../types'
import { applicationStatuses } from '@/sanity/schemaTypes/application'

interface KanbanBoardProps {
  initialApplications: PopulatedApplication[]
}

const statusColumns: { key: ApplicationStatus; label: string; badgeColor: string }[] = [
  {
    key: 'draft',
    label: 'Draft',
    badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
  {
    key: 'applied',
    label: 'Applied',
    badgeColor: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  },
  {
    key: 'interviewing',
    label: 'Interviewing',
    badgeColor: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  },
  {
    key: 'offered',
    label: 'Offered',
    badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
  },
]

export function KanbanBoard({ initialApplications }: KanbanBoardProps) {
  const [applications, setApplications] = useState<PopulatedApplication[]>(initialApplications)
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [search, setSearch] = useState('')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  const filtered = applications.filter((app) => {
    const term = search.toLowerCase()
    const title = (app.title || '').toLowerCase()
    const company = (
      app.jdData?.content?.fields?.find((f) => f.category === 'company')?.text || ''
    ).toLowerCase()
    return title.includes(term) || company.includes(term)
  })

  const handleStatusChange = async (
    applicationId: string,
    newStatus: ApplicationStatus
  ) => {
    setActiveMenuId(null)
    setApplications((prev) =>
      prev.map((app) =>
        app._id === applicationId ? { ...app, status: newStatus } : app
      )
    )

    try {
      await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  const handleDelete = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return
    setActiveMenuId(null)
    setApplications((prev) => prev.filter((a) => a._id !== applicationId))

    try {
      await fetch(`/api/applications/${applicationId}`, {
        method: 'DELETE',
      })
    } catch (err) {
      console.error('Failed to delete application', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Controls: Search & Layout Toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 shadow-2xs focus:border-indigo-500 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'kanban'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Board
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === 'table'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Table
          </button>
        </div>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {statusColumns.map((col) => {
            const items = filtered.filter((a) => a.status === col.key)
            return (
              <div
                key={col.key}
                className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50/50 p-3 dark:border-slate-800/80 dark:bg-slate-900/50 min-h-[420px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 py-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {col.label}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${col.badgeColor}`}
                  >
                    {items.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 space-y-3">
                  {items.map((app) => {
                    const company =
                      app.jdData?.content?.fields?.find(
                        (f) => f.category === 'company'
                      )?.text || ''
                    const oldScore = app.scoreDelta?.oldScore ?? null
                    const newScore = app.scoreDelta?.newScore ?? null
                    const diff = app.scoreDelta?.scoreDiff ?? null

                    return (
                      <div
                        key={app._id}
                        className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-2xs transition hover:border-indigo-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/dashboard/applications/${app._id}`}
                            className="text-sm font-bold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400 line-clamp-2"
                          >
                            {app.title || 'Job Application'}
                          </Link>

                          {/* Options Menu Toggle */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setActiveMenuId(
                                  activeMenuId === app._id ? null : app._id
                                )
                              }
                              className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === app._id && (
                              <div className="absolute right-0 top-6 z-20 w-44 rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                                <div className="px-3 py-1 text-[10px] font-semibold uppercase text-slate-400">
                                  Move Status
                                </div>
                                {applicationStatuses.map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => handleStatusChange(app._id, s)}
                                    className={`w-full px-3 py-1.5 text-left text-xs capitalize transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                                      app.status === s
                                        ? 'font-bold text-indigo-600 dark:text-indigo-400'
                                        : 'text-slate-700 dark:text-slate-300'
                                    }`}
                                  >
                                    {s}
                                  </button>
                                ))}
                                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                                <button
                                  onClick={() => handleDelete(app._id)}
                                  className="flex w-full items-center gap-1.5 px-3 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {company && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                            <Briefcase className="h-3 w-3 shrink-0" />
                            <span className="truncate">{company}</span>
                          </p>
                        )}

                        {/* Scores Badge Row */}
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800/80">
                          {oldScore !== null || newScore !== null ? (
                            <div className="flex items-center gap-1.5 text-xs font-semibold">
                              <span className="text-slate-500 dark:text-slate-400">
                                {oldScore !== null ? `${oldScore}%` : '—'}
                              </span>
                              <span className="text-slate-300">➔</span>
                              <span
                                className={
                                  newScore !== null
                                    ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                                    : 'text-slate-400'
                                }
                              >
                                {newScore !== null ? `${newScore}%` : '—'}
                              </span>
                              {typeof diff === 'number' && diff > 0 && (
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  (+{diff})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">No score</span>
                          )}

                          {app.tailoringStatus === 'completed' && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                              <Sparkles className="h-2.5 w-2.5" /> Tailored
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {items.length === 0 && (
                    <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 dark:border-slate-800">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/50 text-xs font-medium uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3.5">Opportunity</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Scores</th>
                <th className="px-4 py-3.5">Tailoring</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((app) => {
                const company =
                  app.jdData?.content?.fields?.find(
                    (f) => f.category === 'company'
                  )?.text || ''
                const oldScore = app.scoreDelta?.oldScore ?? null
                const newScore = app.scoreDelta?.newScore ?? null

                return (
                  <tr
                    key={app._id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/applications/${app._id}`}
                        className="font-semibold text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                      >
                        {app.title || 'Job Application'}
                      </Link>
                      {company && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {company}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {app.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        <span className="text-slate-500">
                          {oldScore !== null ? `${oldScore}%` : '—'}
                        </span>
                        <span className="text-slate-300">➔</span>
                        <span
                          className={
                            newScore !== null
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'text-slate-400'
                          }
                        >
                          {newScore !== null ? `${newScore}%` : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-xs capitalize text-slate-500">
                        {app.tailoringStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/applications/${app._id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
