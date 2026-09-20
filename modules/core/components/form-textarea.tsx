'use client'

import React from 'react'
import { inputClass, labelClass } from '../styles'

export interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  containerClassName?: string
  'data-testid'?: string
}

export function FormTextarea({
  label,
  className,
  containerClassName,
  id,
  rows = 3,
  'data-testid': testId,
  ...props
}: FormTextareaProps) {
  const generatedId = React.useId()
  const fieldId = id || generatedId

  return (
    <div className={containerClassName}>
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        data-testid={testId}
        className={className ? `${inputClass} ${className}` : inputClass}
        {...props}
      />
    </div>
  )
}
