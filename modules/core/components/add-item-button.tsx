'use client'

import React from 'react'
import { Plus } from 'lucide-react'
import { buttonDashedClass } from '../styles'

export interface AddItemButtonProps {
  label: string
  onClick: () => void
  'data-testid'?: string
  className?: string
  disabled?: boolean
}

export function AddItemButton({
  label,
  onClick,
  'data-testid': testId,
  className,
  disabled,
}: AddItemButtonProps) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      disabled={disabled}
      className={className ? `${buttonDashedClass} ${className}` : buttonDashedClass}
    >
      <Plus className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  )
}
