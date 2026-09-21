'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Sparkles,
  Package,
  FileText,
  Briefcase,
  Award,
  RefreshCw,
  Loader2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react'
import type { ApplicationStatus, PopulatedApplication } from '../types'
import { applicationStatuses } from '@/sanity/schemaTypes/application'
import { ScoreDeltaCard } from './score-delta-card'
import { RequirementDeltaTable } from './requirement-delta-table'
import { CoverLetterEditor } from './cover-letter-editor'
import { ApplicationPackageDrawer } from './application-package-drawer'

interface ApplicationDetailViewProps {
  initialApplication: PopulatedApplication
}

export function ApplicationDetailView({
  initialApplication,
}: ApplicationDetailViewProps) {
  const [app, setApp] = useState<PopulatedApplication>(initialApplication)
  const [activeTab, setActiveTab] = useState<'fit' | 'cv' | 'cover-letter' | 'jd'>('fit')
  const [isPackageOpen, setIsPackageOpen] = useState(false)
  const [isTailoring, setIsTailoring] = useState(false)
  const [isRescoring, setIsRescoring] = useState(false)
  const [tailorError, setTailorError] = useState<string | null>(null)

  const handleStatusChange = async (newStatus: ApplicationStatus) => {
    setApp((prev) => ({ ...prev, status: newStatus }))
    try {
      const res = await fetch(`/api/applications/${app._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (res.ok && data.application) setApp(data.application)
    } catch (err) {
      console.error('Failed to update status', err)
    }
  }

  const handleTriggerTailor = async () => {
    setIsTailoring(true)
    setTailorError(null)
    try {
      const res = await fetch(`/api/applications/${app._id}/tailor`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Tailoring failed')
      setApp(data.application)
    } catch (err) {
      setTailorError(err instanceof Error ? err.message : 'Tailoring failed')
    } finally {
      setIsTailoring(false)
    }
  }

  const handleRescore = async () => {
    setIsRescoring(true)
    try {
      const res = await fetch(`/api/applications/${app._id}/rescore`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Rescoring failed')
      setApp(data.application)
    } catch (err) {
      console.error('Failed to rescore', err)
    } finally {
      setIsRescoring(false)
    }
  }

  const tailoredCvId = app.tailoredCv?._ref || app.tailoredCvData?._id
  const company =
    app.jdData?.content?.fields?.find((f) => f.category === 'company')?.text || ''

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Applications
        </Link>
      </div>

      {/* Main Application Header Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {app.title || 'Job Application'}
              </h1>

              {/* Status Select */}
              <select
                value={app.status}
                onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold capitalize text-slate-700 focus:border-indigo-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {applicationStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              {company && (
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <Briefcase className="h-3.5 w-3.5" />
                  {company}
                </span>
              )}
              <span>
                Baseline CV: <span className="font-semibold">{app.baseCvData?.title || 'CV'}</span>
              </span>
              {app.jdData && (
                <Link
                  href={`/jds/${app.jdData._id}`}
                  className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  View JD Specs <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTriggerTailor}
              disabled={isTailoring || app.tailoringStatus === 'running'}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {isTailoring || app.tailoringStatus === 'running' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tailoring with Agent...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {tailoredCvId ? 'Re-tailor with Agent' : 'Tailor CV with Agent'}
                </>
              )}
            </button>

            <button
              onClick={() => setIsPackageOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition"
            >
              <Package className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Application Package
            </button>
          </div>
        </div>

        {tailorError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{tailorError}</span>
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('fit')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition ${
              activeTab === 'fit'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Award className="h-4 w-4" />
            Match & Fit Scores
          </button>

          <button
            onClick={() => setActiveTab('cv')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition ${
              activeTab === 'cv'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="h-4 w-4" />
            Tailored CV {tailoredCvId && '✨'}
          </button>

          <button
            onClick={() => setActiveTab('cover-letter')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition ${
              activeTab === 'cover-letter'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Cover Letter {app.coverLetter && '✓'}
          </button>

          <button
            onClick={() => setActiveTab('jd')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition ${
              activeTab === 'jd'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            Job Requirements
          </button>
        </nav>
      </div>

      {/* Tab 1: Fit & Scores */}
      {activeTab === 'fit' && (
        <div className="space-y-6">
          <ScoreDeltaCard
            scoreDelta={app.scoreDelta}
            tailoringStatus={app.tailoringStatus}
            onTailorClick={handleTriggerTailor}
          />
          <RequirementDeltaTable deltas={app.requirementDeltas} />
        </div>
      )}

      {/* Tab 2: Tailored CV */}
      {activeTab === 'cv' && (
        <div className="space-y-6">
          {tailoredCvId ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {app.tailoredCvData?.title || 'Tailored CV'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Customized specifically to emphasize requirements for {app.title}.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRescore}
                    disabled={isRescoring}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isRescoring ? 'animate-spin' : ''}`} />
                    Re-score Fit
                  </button>

                  <a
                    href={`/cvs/${tailoredCvId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition"
                  >
                    Open in Full CV Editor <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Tailored Content Preview */}
              <div className="mt-6 space-y-6">
                {/* Professional Summary */}
                {app.tailoredCvData?.summary && (
                  <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Tailored Professional Summary
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-200">
                      {app.tailoredCvData.summary}
                    </p>
                  </div>
                )}

                {/* Sections Overview */}
                <div className="space-y-4">
                  {app.tailoredCvData?.sections?.map((sec, idx) => (
                    <div
                      key={sec._key || idx}
                      className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-3">
                        {sec.sectionTitle || sec._type}
                      </h4>

                      {sec._type === 'workExperienceSection' && (
                        <div className="space-y-4">
                          {sec.items?.map((item) => (
                            <div key={item._key} className="space-y-1">
                              <div className="flex justify-between text-xs">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {item.role} — {item.company}
                                </span>
                                <span className="text-slate-500">
                                  {item.startDate} – {item.isCurrent ? 'Present' : item.endDate}
                                </span>
                              </div>
                              {item.highlights && (
                                <ul className="list-disc pl-5 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                                  {item.highlights.map((h, hIdx) => (
                                    <li key={hIdx}>{h}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {sec._type === 'skillsSection' && (
                        <div className="flex flex-wrap gap-2">
                          {sec.groups?.map((grp) => (
                            <div key={grp._key} className="space-y-1">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {grp.categoryName}:
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {grp.skills?.map((s, sIdx) => (
                                  <span
                                    key={sIdx}
                                    className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <Sparkles className="mx-auto h-8 w-8 text-indigo-500" />
              <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
                No Tailored CV Variant Yet
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Click the button below to have the agent tailor your baseline CV to match this JD.
              </p>
              <button
                onClick={handleTriggerTailor}
                disabled={isTailoring}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Tailor CV Now
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Cover Letter */}
      {activeTab === 'cover-letter' && (
        <CoverLetterEditor
          application={app}
          onApplicationUpdate={(updated) => setApp(updated)}
        />
      )}

      {/* Tab 4: Job Requirements */}
      {activeTab === 'jd' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Stated Job Requirements
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extracted and verified requirements from the original job description.
              </p>
            </div>
            {app.jdData && (
              <Link
                href={`/jds/${app.jdData._id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                Open Full JD <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="space-y-3">
            {app.jdData?.content?.requirements?.map((req, idx) => (
              <div
                key={(req as { _key?: string })._key || idx}
                className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {req.classification || 'required'}
                  </span>
                  <span className="text-xs text-slate-400">{req.category}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {req.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Application Package Drawer */}
      <ApplicationPackageDrawer
        application={app}
        isOpen={isPackageOpen}
        onClose={() => setIsPackageOpen(false)}
      />
    </div>
  )
}
