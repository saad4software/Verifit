'use client'

import React, { useState, useEffect } from 'react'
import { inputClass, labelClass } from '../styles'
import { joinComma, splitComma } from '../utils/text'

export interface TagListInputProps {
  label?: string
  tags?: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  containerClassName?: string
  id?: string
  'data-testid'?: string
}

export function TagListInput({
  label = 'Technologies / Skills (comma-separated)',
  tags = [],
  onChange,
  placeholder,
  containerClassName,
  id,
  'data-testid': testId,
}: TagListInputProps) {
  const generatedId = React.useId()
  const fieldId = id || generatedId
  const [rawText, setRawText] = useState(() => joinComma(tags))

  useEffect(() => {
    const currentJoined = splitComma(rawText).join(', ')
    const incomingJoined = (tags || []).join(', ')
    if (currentJoined !== incomingJoined) {
      setRawText(incomingJoined)
    }
  }, [tags])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setRawText(val)
    onChange(splitComma(val))
  }

  return (
    <div className={containerClassName}>
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <input
        type="text"
        id={fieldId}
        data-testid={testId}
        value={rawText}
        onChange={handleChange}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  )
}
