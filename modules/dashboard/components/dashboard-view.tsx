'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileText, Briefcase, Layers, Sparkles } from 'lucide-react'
import { CvsDashboard } from '@/modules/cvs/components/cvs-dashboard'
import { JdsDashboard } from '@/modules/jds/components/jds-dashboard'
import { ApplicationsDashboard } from '@/modules/applications/components/applications-dashboard'
import type { CVDocument } from '@/modules/cvs/types'
import type { Jd } from '@/modules/jds/schema'
import type { PopulatedApplication } from '@/modules/applications/types'

export type DashboardTab = 'cvs' | 'jds' | 'applications'

interface DashboardViewProps {
  initialCvs: CVDocument[]
  initialJds: Jd[]
  initialApplications: PopulatedApplication[]
  userName?: string
  initialTab?: DashboardTab
}

export function DashboardView({
  initialCvs,
  initialJds,
  initialApplications,
  userName,
  initialTab = 'cvs',
}: DashboardViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryTab = searchParams.get('tab') as DashboardTab | null

  const validTabs: DashboardTab[] = ['cvs', 'jds', 'applications']
  const resolveTab = (tab: string | null | undefined): DashboardTab => {
    if (tab && validTabs.includes(tab as DashboardTab)) {
      return tab as DashboardTab
    }
    return initialTab
  }

  const [activeTab, setActiveTab] = useState<DashboardTab>(resolveTab(queryTab))

  useEffect(() => {
    if (queryTab && validTabs.includes(queryTab)) {
      setActiveTab(queryTab)
    }
  }, [queryTab])

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab)
    const newUrl = `/dashboard?tab=${tab}`
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', newUrl)
    } else {
      router.replace(newUrl)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8" data-testid="dashboard-view">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/20 p-6 sm:p-8 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-2xs backdrop-blur-md dark:border-indigo-900/60 dark:bg-indigo-950/50 dark:text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Career Intelligence Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Welcome back{userName ? `, ${userName}` : ''}
            </h1>
            <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Manage your baseline resumes, inspect job descriptions, and track your tailored AI-matched applications in one centralized workspace.
            </p>
          </div>

          {/* Quick Metrics Summary */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Resumes</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{initialCvs.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Target JDs</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{initialJds.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-800/60">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/50 dark:text-cyan-400">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Applications</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{initialApplications.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 border-b border-slate-200 dark:border-slate-800">
          <nav
            className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto"
            role="tablist"
            aria-label="Dashboard navigation tabs"
            data-testid="dashboard-tabs"
          >
            <button
              type="button"
              role="tab"
              id="tab-cvs"
              data-testid="tab-cvs"
              aria-selected={activeTab === 'cvs'}
              aria-controls="tab-content-cvs"
              onClick={() => handleTabChange('cvs')}
              className={`group inline-flex items-center gap-2 border-b-2 py-3.5 px-3 sm:px-1 text-sm font-semibold transition-all duration-150 ${
                activeTab === 'cvs'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <FileText
                className={`h-4 w-4 transition-colors ${
                  activeTab === 'cvs'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                }`}
              />
              <span>CVs & Resumes</span>
              <span
                data-testid="badge-cvs-count"
                className={`rounded-full px-2 py-0.5 text-xs font-bold transition-colors ${
                  activeTab === 'cvs'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {initialCvs.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-jds"
              data-testid="tab-jds"
              aria-selected={activeTab === 'jds'}
              aria-controls="tab-content-jds"
              onClick={() => handleTabChange('jds')}
              className={`group inline-flex items-center gap-2 border-b-2 py-3.5 px-3 sm:px-1 text-sm font-semibold transition-all duration-150 ${
                activeTab === 'jds'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Briefcase
                className={`h-4 w-4 transition-colors ${
                  activeTab === 'jds'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                }`}
              />
              <span>Job Descriptions</span>
              <span
                data-testid="badge-jds-count"
                className={`rounded-full px-2 py-0.5 text-xs font-bold transition-colors ${
                  activeTab === 'jds'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {initialJds.length}
              </span>
            </button>

            <button
              type="button"
              role="tab"
              id="tab-applications"
              data-testid="tab-applications"
              aria-selected={activeTab === 'applications'}
              aria-controls="tab-content-applications"
              onClick={() => handleTabChange('applications')}
              className={`group inline-flex items-center gap-2 border-b-2 py-3.5 px-3 sm:px-1 text-sm font-semibold transition-all duration-150 ${
                activeTab === 'applications'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Layers
                className={`h-4 w-4 transition-colors ${
                  activeTab === 'applications'
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300'
                }`}
              />
              <span>Applications</span>
              <span
                data-testid="badge-applications-count"
                className={`rounded-full px-2 py-0.5 text-xs font-bold transition-colors ${
                  activeTab === 'applications'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {initialApplications.length}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'cvs' && (
          <div data-testid="tab-content-cvs" role="tabpanel" aria-labelledby="tab-cvs">
            <CvsDashboard initialCvs={initialCvs} />
          </div>
        )}

        {activeTab === 'jds' && (
          <div data-testid="tab-content-jds" role="tabpanel" aria-labelledby="tab-jds">
            <JdsDashboard initialJds={initialJds} />
          </div>
        )}

        {activeTab === 'applications' && (
          <div
            data-testid="tab-content-applications"
            role="tabpanel"
            aria-labelledby="tab-applications"
          >
            <ApplicationsDashboard initialApplications={initialApplications} />
          </div>
        )}
      </div>
    </div>
  )
}
