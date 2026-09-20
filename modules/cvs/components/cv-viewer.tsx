'use client'

import React from 'react'
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Link as LinkIcon,
  Briefcase,
  GraduationCap,
  Sparkles,
  FolderGit2,
  Award,
  Languages as LanguagesIcon,
  ExternalLink,
} from 'lucide-react'
import { CVDocument } from '../types'

interface CvViewerProps {
  cv: CVDocument
}

export function CvViewer({ cv }: CvViewerProps) {
  const p = cv.personalInfo || {}

  return (
    <div
      data-testid="cv-viewer"
      className="mx-auto w-full max-w-4xl rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl print:border-none print:shadow-none sm:p-12 dark:border-slate-800/80 dark:bg-slate-900"
    >
      {/* CV Header: Personal Info */}
      <div className="border-b border-slate-100 pb-6 text-center sm:text-left dark:border-slate-800">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {p.fullName || cv.title || 'Untitled CV'}
        </h1>
        {p.headline && (
          <p className="mt-1 text-lg font-medium text-indigo-600 dark:text-indigo-400">
            {p.headline}
          </p>
        )}

        {/* Contact info row */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-slate-600 sm:justify-start dark:text-slate-300">
          {p.email && (
            <a
              href={`mailto:${p.email}`}
              className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Mail className="h-3.5 w-3.5 text-slate-400" />
              <span>{p.email}</span>
            </a>
          )}
          {p.phone && (
            <a
              href={`tel:${p.phone}`}
              className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              <span>{p.phone}</span>
            </a>
          )}
          {p.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>{p.location}</span>
            </span>
          )}
          {p.website && (
            <a
              href={p.website}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span>Portfolio</span>
            </a>
          )}
          {p.linkedin && (
            <a
              href={p.linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <LinkIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>LinkedIn</span>
            </a>
          )}
          {p.github && (
            <a
              href={p.github}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <LinkIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>GitHub</span>
            </a>
          )}
          {p.twitter && (
            <a
              href={p.twitter}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              <LinkIcon className="h-3.5 w-3.5 text-slate-400" />
              <span>Twitter</span>
            </a>
          )}
        </div>
      </div>

      {/* Summary */}
      {cv.summary && (
        <div className="mt-6 border-b border-slate-100 pb-6 dark:border-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
            Professional Summary
          </h2>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {cv.summary}
          </p>
        </div>
      )}

      {/* Render Polymorphic Sections */}
      <div className="mt-6 space-y-8">
        {cv.sections?.map((section, idx) => {
          if (section._type === 'workExperienceSection') {
            return (
              <section key={section._key || idx} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {section.sectionTitle || 'Work Experience'}
                  </h2>
                </div>

                <div className="space-y-6">
                  {section.items?.map((item, itemIdx) => (
                    <div key={item._key || itemIdx} className="space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {item.role} <span className="font-medium text-slate-500">at</span> {item.company}
                        </h3>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {item.startDate || ''} — {item.isCurrent ? 'Present' : item.endDate || ''}
                        </span>
                      </div>

                      {item.location && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.location}
                        </p>
                      )}

                      {item.highlights && item.highlights.length > 0 && (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                          {item.highlights.map((h, hIdx) => (
                            <li key={hIdx}>{h}</li>
                          ))}
                        </ul>
                      )}

                      {item.technologies && item.technologies.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.technologies.map((tech, tIdx) => (
                            <span
                              key={tIdx}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (section._type === 'educationSection') {
            return (
              <section key={section._key || idx} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {section.sectionTitle || 'Education'}
                  </h2>
                </div>

                <div className="space-y-4">
                  {section.items?.map((item, itemIdx) => (
                    <div key={item._key || itemIdx} className="space-y-1">
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.institution}
                        </h3>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {item.startDate || ''} {item.endDate ? `— ${item.endDate}` : ''}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {item.degree}
                        {item.fieldOfStudy ? ` in ${item.fieldOfStudy}` : ''}
                        {item.gradeOrHonors ? ` • ${item.gradeOrHonors}` : ''}
                      </p>

                      {item.highlights && item.highlights.length > 0 && (
                        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-slate-600 dark:text-slate-300">
                          {item.highlights.map((h, hIdx) => (
                            <li key={hIdx}>{h}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (section._type === 'skillsSection') {
            return (
              <section key={section._key || idx} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {section.sectionTitle || 'Skills'}
                  </h2>
                </div>

                <div className="space-y-3">
                  {section.groups?.map((group, gIdx) => (
                    <div key={group._key || gIdx} className="space-y-1">
                      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {group.categoryName}
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {group.skills?.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10 dark:bg-indigo-950/50 dark:text-indigo-300 dark:ring-indigo-700/30"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (section._type === 'projectsSection') {
            return (
              <section key={section._key || idx} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <FolderGit2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {section.sectionTitle || 'Projects'}
                  </h2>
                </div>

                <div className="space-y-4">
                  {section.items?.map((item, itemIdx) => (
                    <div key={item._key || itemIdx} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </h3>
                        {item.url && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5 dark:text-indigo-400"
                          >
                            <span>Live</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {item.repositoryUrl && (
                          <a
                            href={item.repositoryUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-slate-500 hover:underline flex items-center gap-0.5 dark:text-slate-400"
                          >
                            <span>GitHub</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>

                      {item.description && (
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {item.description}
                        </p>
                      )}

                      {item.technologies && item.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.technologies.map((t, tIdx) => (
                            <span
                              key={tIdx}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (section._type === 'certificationsSection') {
            return (
              <section key={section._key || idx} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <Award className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {section.sectionTitle || 'Certifications'}
                  </h2>
                </div>

                <div className="space-y-2">
                  {section.items?.map((item, itemIdx) => (
                    <div key={item._key || itemIdx} className="flex justify-between items-baseline text-xs">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                        <span className="text-slate-500"> — {item.issuer}</span>
                      </div>
                      {item.issueDate && (
                        <span className="text-slate-400">{item.issueDate}</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (section._type === 'languagesSection') {
            return (
              <section key={section._key || idx} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <LanguagesIcon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {section.sectionTitle || 'Languages'}
                  </h2>
                </div>

                <div className="flex flex-wrap gap-4 text-xs">
                  {section.items?.map((item, itemIdx) => (
                    <div key={item._key || itemIdx}>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {item.language}
                      </span>
                      {item.proficiency && (
                        <span className="text-slate-500"> ({item.proficiency})</span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          if (section._type === 'customSection') {
            return (
              <section key={section._key || idx} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
                  <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    {section.sectionTitle}
                  </h2>
                </div>

                <div className="space-y-3">
                  {section.items?.map((item, itemIdx) => (
                    <div key={item._key || itemIdx} className="space-y-1">
                      <div className="flex justify-between items-baseline">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        {item.date && (
                          <span className="text-[11px] text-slate-400">{item.date}</span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className="text-xs text-slate-500">{item.subtitle}</p>
                      )}
                      {item.description && (
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {item.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )
          }

          return null
        })}
      </div>
    </div>
  )
}
