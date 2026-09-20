'use client'

import React from 'react'
import { Trash2 } from 'lucide-react'
import { cardClass } from '../styles'

export interface SectionItemCardProps {
  title: React.ReactNode
  onRemove: () => void
  removeTestId?: string
  removeTitle?: string
  testId?: string
  className?: string
  children: React.ReactNode
}

export function SectionItemCard({
  title,
  onRemove,
  removeTestId,
  removeTitle = 'Remove item',
  testId,
  className,
  children,
}: SectionItemCardProps) {
  return (
    <div
      data-testid={testId}
      className={className ? `${cardClass} ${className}` : cardClass}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {title}
        </span>
        <button
          type="button"
          data-testid={removeTestId}
          onClick={onRemove}
          className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition"
          title={removeTitle}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {children}
    </div>
  )
}
