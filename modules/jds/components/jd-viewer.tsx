'use client'

import React from 'react'
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Layers,
  Quote,
  Coins,
  Compass,
} from 'lucide-react'
import type { JdContent } from '../schema'

interface JdViewerProps {
  content: JdContent
}

export function JdViewer({ content }: JdViewerProps) {
  // Extract key metadata fields
  const title = content.fields.find((f) => f.category === 'title')?.text || 'Untitled Job Opportunity'
  const company = content.fields.find((f) => f.category === 'company')?.text
  const location = content.fields.find((f) => f.category === 'location')?.text
  const seniority = content.fields.find((f) => f.category === 'seniority')?.text
  const workArrangement = content.fields.find((f) => f.category === 'workArrangement')?.text
  const employmentType = content.fields.find((f) => f.category === 'employmentType')?.text
  const compensation = content.fields.find((f) => f.category === 'compensation')?.text

  // Filter remaining fields (responsibilities, eligibility, etc.)
  const otherFields = content.fields.filter(
    (f) => !['title', 'company', 'location', 'seniority', 'workArrangement', 'employmentType', 'compensation'].includes(f.category)
  )

  const requiredReqs = content.requirements.filter((r) => r.classification === 'required')
  const preferredReqs = content.requirements.filter((r) => r.classification === 'preferred')
  const otherReqs = content.requirements.filter((r) => r.classification === 'unspecified' || !r.classification)

  return (
    <div
      data-testid="jd-viewer"
      className="mx-auto w-full max-w-4xl space-y-8 rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl print:border-none print:shadow-none sm:p-12 dark:border-slate-800/80 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
    >
      {/* Header Info */}
      <div className="border-b border-slate-100 pb-6 dark:border-slate-800">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {title}
        </h1>

        {company && (
          <div className="mt-1 flex items-center gap-2 text-base font-semibold text-indigo-600 dark:text-indigo-400">
            <Building2 className="h-4 w-4" />
            <span>{company}</span>
          </div>
        )}

        {/* Metadata badges */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {location && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <MapPin className="h-3 w-3 text-slate-400" />
              {location}
            </span>
          )}
          {workArrangement && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Compass className="h-3 w-3 text-slate-400" />
              {workArrangement}
            </span>
          )}
          {seniority && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Briefcase className="h-3 w-3 text-slate-400" />
              {seniority}
            </span>
          )}
          {employmentType && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <Clock className="h-3 w-3 text-slate-400" />
              {employmentType}
            </span>
          )}
          {compensation && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
              <Coins className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              {compensation}
            </span>
          )}
        </div>
      </div>

      {/* Other Fields (Responsibilities, Overview, Eligibility) */}
      {otherFields.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
            <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Role Responsibilities & Details
            </h2>
          </div>
          <div className="grid gap-4">
            {otherFields.map((field) => (
              <div
                key={field._key}
                className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
              >
                <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                  {field.category}
                </span>
                <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {field.text}
                </p>

                {field.evidence?.length > 0 && (
                  <div className="mt-3 space-y-1 border-t border-slate-200/60 pt-2 dark:border-slate-800">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Supporting Source Excerpts
                    </p>
                    {field.evidence.map((quote, idx) => (
                      <blockquote
                        key={idx}
                        className="flex items-start gap-1.5 text-xs italic text-slate-500 dark:text-slate-400"
                      >
                        <Quote className="h-3 w-3 shrink-0 text-slate-400 mt-0.5" />
                        <span>&ldquo;{quote}&rdquo;</span>
                      </blockquote>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Qualifications & Requirements */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
          <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Target Qualifications ({content.requirements.length})
          </h2>
        </div>

        {/* Required */}
        {requiredReqs.length > 0 && (
          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5" /> Required Qualifications
            </h4>
            <div className="grid gap-3">
              {requiredReqs.map((req) => (
                <div
                  key={req._key}
                  className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                      {req.category}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Required
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {req.text}
                  </p>
                  {req.evidence?.length > 0 && (
                    <div className="mt-2.5 space-y-1 border-t border-emerald-100 pt-2 dark:border-emerald-900/30">
                      {req.evidence.map((quote, idx) => (
                        <blockquote
                          key={idx}
                          className="flex items-start gap-1.5 text-xs italic text-slate-500 dark:text-slate-400"
                        >
                          <Quote className="h-3 w-3 shrink-0 text-slate-400 mt-0.5" />
                          <span>&ldquo;{quote}&rdquo;</span>
                        </blockquote>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preferred */}
        {preferredReqs.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Preferred / Nice to Have
            </h4>
            <div className="grid gap-3">
              {preferredReqs.map((req) => (
                <div
                  key={req._key}
                  className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-4 dark:border-amber-900/40 dark:bg-amber-950/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                      {req.category}
                    </span>
                    <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                      Preferred
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {req.text}
                  </p>
                  {req.evidence?.length > 0 && (
                    <div className="mt-2.5 space-y-1 border-t border-amber-100 pt-2 dark:border-amber-900/30">
                      {req.evidence.map((quote, idx) => (
                        <blockquote
                          key={idx}
                          className="flex items-start gap-1.5 text-xs italic text-slate-500 dark:text-slate-400"
                        >
                          <Quote className="h-3 w-3 shrink-0 text-slate-400 mt-0.5" />
                          <span>&ldquo;{quote}&rdquo;</span>
                        </blockquote>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unspecified */}
        {otherReqs.length > 0 && (
          <div className="space-y-3 pt-2">
            <h4 className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              <Compass className="h-3.5 w-3.5" /> General Qualifications
            </h4>
            <div className="grid gap-3">
              {otherReqs.map((req) => (
                <div
                  key={req._key}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {req.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                    {req.text}
                  </p>
                  {req.evidence?.length > 0 && (
                    <div className="mt-2.5 space-y-1 border-t border-slate-200/60 pt-2 dark:border-slate-800">
                      {req.evidence.map((quote, idx) => (
                        <blockquote
                          key={idx}
                          className="flex items-start gap-1.5 text-xs italic text-slate-500 dark:text-slate-400"
                        >
                          <Quote className="h-3 w-3 shrink-0 text-slate-400 mt-0.5" />
                          <span>&ldquo;{quote}&rdquo;</span>
                        </blockquote>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Qualification Groups */}
      {content.groups.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
            <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Qualification Groups ({content.groups.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Alternative and combined requirement conditions identified in this job advertisement.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {content.groups.map((group, index) => (
              <div
                key={group._key}
                className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-950/50 dark:bg-indigo-950/20"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200">
                    Group {index + 1}
                  </span>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300">
                    {group.operator === 'any' ? 'Any one alternative' : 'All required together'}
                  </span>
                </div>
                {group.parentGroupId && (
                  <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    Nested within a parent group
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
