'use client'

import React from 'react'
import { inputClass, labelClass } from '../styles'

export interface OptionItem {
  label: string
  value: string
}

export interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: OptionItem[]
  containerClassName?: string
  'data-testid'?: string
}

export function FormSelect({
  label,
  options,
  className,
  containerClassName,
  id,
  'data-testid': testId,
  ...props
}: FormSelectProps) {
  const generatedId = React.useId()
  const fieldId = id || generatedId

  return (
    <div className={containerClassName}>
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <select
        id={fieldId}
        data-testid={testId}
        className={className ? `${inputClass} ${className}` : inputClass}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
