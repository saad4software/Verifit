'use client'

import React, { useState, useEffect } from 'react'
import { inputClass, labelClass } from '../styles'
import { joinLines, splitLines } from '../utils/text'

export interface BulletListInputProps {
  label?: string
  items?: string[]
  onChange: (items: string[]) => void
  rows?: number
  placeholder?: string
  containerClassName?: string
  id?: string
  'data-testid'?: string
}

export function BulletListInput({
  label = 'Highlights & Bullet Points (one per line)',
  items = [],
  onChange,
  rows = 3,
  placeholder,
  containerClassName,
  id,
  'data-testid': testId,
}: BulletListInputProps) {
  const generatedId = React.useId()
  const fieldId = id || generatedId
  const [rawText, setRawText] = useState(() => joinLines(items))

  useEffect(() => {
    const currentJoined = splitLines(rawText).join('\n')
    const incomingJoined = (items || []).join('\n')
    if (currentJoined !== incomingJoined) {
      setRawText(incomingJoined)
    }
  }, [items])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setRawText(val)
    onChange(splitLines(val))
  }

  return (
    <div className={containerClassName}>
      <label htmlFor={fieldId} className={labelClass}>
        {label}
      </label>
      <textarea
        id={fieldId}
        rows={rows}
        data-testid={testId}
        value={rawText}
        onChange={handleChange}
        placeholder={placeholder}
        className={inputClass}
      />
    </div>
  )
}
