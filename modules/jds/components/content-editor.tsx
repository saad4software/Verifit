'use client'

import React from 'react'
import {
  fieldCategories,
  requirementCategories,
  type JdContent,
} from '../schema'
import {
  Plus,
  Trash2,
  Layers,
  Quote,
  Sparkles,
  Briefcase,
} from 'lucide-react'

const inputStyle =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-950 dark:text-white dark:focus:border-indigo-400'

const label = (value: string) => value.replace(/([A-Z])/g, ' $1').toLowerCase()

export function ContentEditor({
  content,
  onChange,
  disabled,
}: {
  content: JdContent
  onChange: (value: JdContent) => void
  disabled: boolean
}) {
  function changeClaim(
    kind: 'fields' | 'requirements',
    index: number,
    patch: object,
  ) {
    onChange({
      ...content,
      [kind]: content[kind].map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    })
  }

  return (
    <fieldset
      disabled={disabled}
      className="min-w-0 space-y-6 disabled:opacity-60"
    >
      <legend className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        Structured information
      </legend>

      {(['fields', 'requirements'] as const).map((kind) => (
        <section key={kind} className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
            {kind === 'fields' ? (
              <Briefcase className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            ) : (
              <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            )}
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              {kind === 'fields' ? 'Job details' : 'Qualifications'}
            </h3>
          </div>

          <div className="space-y-4">
            {content[kind].map((item, index) => (
              <div
                key={item._key}
                className="space-y-3.5 rounded-2xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Category
                    <select
                      aria-label={`Category for ${item.text}`}
                      className={inputStyle}
                      value={item.category}
                      onChange={(e) =>
                        changeClaim(kind, index, { category: e.target.value })
                      }
                    >
                      {(kind === 'fields'
                        ? fieldCategories
                        : requirementCategories
                      ).map((category) => (
                        <option key={category} value={category}>
                          {label(category)}
                        </option>
                      ))}
                    </select>
                  </label>

                  {'classification' in item && (
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Qualification importance
                      <select
                        className={inputStyle}
                        value={item.classification}
                        onChange={(e) =>
                          changeClaim(kind, index, {
                            classification: e.target.value,
                          })
                        }
                      >
                        {['required', 'preferred', 'unspecified'].map((value) => (
                          <option key={value}>{value}</option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>

                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {label(item.category)} content
                  <textarea
                    className={inputStyle}
                    rows={2}
                    value={item.text}
                    onChange={(e) =>
                      changeClaim(kind, index, { text: e.target.value })
                    }
                  />
                </label>

                {'classification' in item && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Alternative or combined group
                      <select
                        className={inputStyle}
                        value={item.groupId || ''}
                        onChange={(e) =>
                          changeClaim(kind, index, {
                            groupId: e.target.value || undefined,
                          })
                        }
                      >
                        <option value="">Independent requirement</option>
                        {content.groups.map((group, i) => (
                          <option key={group._key} value={group._key}>
                            Group {i + 1}:{' '}
                            {group.operator === 'any'
                              ? 'any one alternative'
                              : 'all required together'}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Included within experience
                      <select
                        className={inputStyle}
                        value={item.withinRequirementId || ''}
                        onChange={(e) =>
                          changeClaim(kind, index, {
                            withinRequirementId: e.target.value || undefined,
                          })
                        }
                      >
                        <option value="">No overlapping duration</option>
                        {content.requirements
                          .filter((r) => r._key !== item._key)
                          .map((r) => (
                            <option key={r._key} value={r._key}>
                              {r.text}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>
                )}

                {/* Excerpts / Evidence */}
                {item.evidence.length > 0 && (
                  <div className="space-y-3 rounded-xl bg-slate-50/70 p-3.5 dark:bg-slate-950/40">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Supporting excerpts ({item.evidence.length})
                    </p>
                    {item.evidence.map((quote, quoteIndex) => (
                      <div key={quoteIndex} className="space-y-1.5">
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                          Supporting excerpt {quoteIndex + 1}
                          <textarea
                            className={inputStyle}
                            rows={2}
                            value={quote}
                            onChange={(e) =>
                              changeClaim(kind, index, {
                                evidence: item.evidence.map((value, i) =>
                                  i === quoteIndex ? e.target.value : value,
                                ),
                              })
                            }
                          />
                        </label>
                        <button
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 underline dark:text-rose-400"
                          type="button"
                          onClick={() =>
                            changeClaim(kind, index, {
                              evidence: item.evidence.filter(
                                (_, i) => i !== quoteIndex,
                              ),
                            })
                          }
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Remove excerpt</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 underline dark:text-indigo-400"
                    onClick={() =>
                      changeClaim(kind, index, {
                        evidence: [...item.evidence, ''],
                      })
                    }
                  >
                    <Quote className="h-3 w-3" />
                    <span>Add excerpt</span>
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 underline dark:text-rose-400"
                    onClick={() =>
                      onChange({
                        ...content,
                        [kind]: content[kind].filter((_, i) => i !== index),
                      })
                    }
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Remove {kind === 'fields' ? 'field' : 'qualification'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            type="button"
            onClick={() =>
              onChange({
                ...content,
                [kind]: [
                  ...content[kind],
                  {
                    _key: crypto.randomUUID(),
                    category: kind === 'fields' ? 'responsibilities' : 'skills',
                    text: '',
                    evidence: [''],
                    ...(kind === 'requirements'
                      ? { classification: 'unspecified' }
                      : {}),
                  },
                ],
              })
            }
          >
            <Plus className="h-4 w-4 text-indigo-500" />
            <span>Add {kind === 'fields' ? 'field' : 'qualification'}</span>
          </button>
        </section>
      ))}

      {/* Qualification Groups Section */}
      <section className="space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Qualification groups
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Use &ldquo;any one&rdquo; for alternatives such as a degree or equivalent experience. Nested groups preserve combinations.
        </p>

        <div className="grid gap-3">
          {content.groups.map((group, index) => (
            <div
              key={group._key}
              className="space-y-3 rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Group {index + 1}
                  <select
                    className={inputStyle}
                    value={group.operator}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        groups: content.groups.map((g, i) =>
                          i === index
                            ? { ...g, operator: e.target.value as 'all' | 'any' }
                            : g,
                        ),
                      })
                    }
                  >
                    <option value="any">Any one alternative</option>
                    <option value="all">All required together</option>
                  </select>
                </label>

                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Inside another group
                  <select
                    className={inputStyle}
                    value={group.parentGroupId || ''}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        groups: content.groups.map((g, i) =>
                          i === index
                            ? { ...g, parentGroupId: e.target.value || undefined }
                            : g,
                        ),
                      })
                    }
                  >
                    <option value="">No parent group</option>
                    {content.groups.map((g, i) =>
                      g._key === group._key ? null : (
                        <option key={g._key} value={g._key}>
                          Group {i + 1}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              <div className="border-t border-slate-100 pt-2 text-right dark:border-slate-800">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 underline dark:text-rose-400"
                  onClick={() =>
                    onChange({
                      ...content,
                      groups: content.groups
                        .filter((g) => g._key !== group._key)
                        .map((g) =>
                          g.parentGroupId === group._key
                            ? { ...g, parentGroupId: undefined }
                            : g,
                        ),
                      requirements: content.requirements.map((r) =>
                        r.groupId === group._key ? { ...r, groupId: undefined } : r,
                      ),
                    })
                  }
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Remove group</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-indigo-500 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() =>
            onChange({
              ...content,
              groups: [
                ...content.groups,
                { _key: crypto.randomUUID(), operator: 'any' },
              ],
            })
          }
        >
          <Plus className="h-4 w-4 text-indigo-500" />
          <span>Add qualification group</span>
        </button>
      </section>
    </fieldset>
  )
}
