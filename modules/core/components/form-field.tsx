'use client'

import React from 'react'
import { inputClass, labelClass } from '../styles'

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  className?: string
  containerClassName?: string
  'data-testid'?: string
}

export function FormField({
  label,
  className,
  containerClassName,
  id,
  'data-testid': testId,
  ...props
}: FormFieldProps) {
  const generatedId = React.useId()
  const fieldId = id || generatedId

  return (
    <div className={containerClassName}>
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <input
        id={fieldId}
        data-testid={testId}
        className={className ? `${inputClass} ${className}` : inputClass}
        {...props}
      />
    </div>
  )
}
