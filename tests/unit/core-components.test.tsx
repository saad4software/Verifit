import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  FormField,
  FormTextarea,
  FormSelect,
  BulletListInput,
  TagListInput,
  SectionItemCard,
  AddItemButton,
  generateKey,
  splitLines,
  joinLines,
  splitComma,
  joinComma,
} from '@/modules/core'

describe('Core Module Components & Utilities', () => {
  describe('Utilities', () => {
    it('generateKey returns unique strings with given prefix', () => {
      const key1 = generateKey('test')
      const key2 = generateKey('test')
      expect(key1).toMatch(/^test_/)
      expect(key2).toMatch(/^test_/)
      expect(key1).not.toBe(key2)
    })

    it('splitLines and joinLines work predictably', () => {
      const lines = ['Bullet 1', 'Bullet 2']
      const joined = joinLines(lines)
      expect(joined).toBe('Bullet 1\nBullet 2')
      expect(splitLines('  Bullet 1 \n\n Bullet 2  \n')).toEqual(['Bullet 1', 'Bullet 2'])
    })

    it('splitComma and joinComma work predictably', () => {
      const tags = ['React', 'Next.js', 'Go']
      const joined = joinComma(tags)
      expect(joined).toBe('React, Next.js, Go')
      expect(splitComma('React, Next.js ,  Go,')).toEqual(['React', 'Next.js', 'Go'])
    })
  })

  describe('FormField', () => {
    it('renders label and input with correct values', () => {
      const handleChange = vi.fn()
      render(
        <FormField
          label="Test Label"
          data-testid="test-field"
          value="Initial"
          onChange={handleChange}
        />
      )

      expect(screen.getByText('Test Label')).toBeInTheDocument()
      const input = screen.getByTestId('test-field') as HTMLInputElement
      expect(input.value).toBe('Initial')

      fireEvent.change(input, { target: { value: 'New Value' } })
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('FormTextarea', () => {
    it('renders textarea and handles input', () => {
      const handleChange = vi.fn()
      render(
        <FormTextarea
          label="Bio"
          data-testid="test-bio"
          value="Hello World"
          onChange={handleChange}
        />
      )

      expect(screen.getByText('Bio')).toBeInTheDocument()
      const textarea = screen.getByTestId('test-bio') as HTMLTextAreaElement
      expect(textarea.value).toBe('Hello World')

      fireEvent.change(textarea, { target: { value: 'Updated Bio' } })
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('FormSelect', () => {
    it('renders select with options', () => {
      const handleChange = vi.fn()
      render(
        <FormSelect
          label="Role"
          data-testid="test-role"
          value="admin"
          options={[
            { label: 'User', value: 'user' },
            { label: 'Admin', value: 'admin' },
          ]}
          onChange={handleChange}
        />
      )

      const select = screen.getByTestId('test-role') as HTMLSelectElement
      expect(select.value).toBe('admin')

      fireEvent.change(select, { target: { value: 'user' } })
      expect(handleChange).toHaveBeenCalled()
    })
  })

  describe('BulletListInput', () => {
    it('manages newline bullet lists and calls onChange with parsed lines', () => {
      const handleChange = vi.fn()
      render(
        <BulletListInput
          data-testid="bullets-input"
          items={['Item 1', 'Item 2']}
          onChange={handleChange}
        />
      )

      const textarea = screen.getByTestId('bullets-input') as HTMLTextAreaElement
      expect(textarea.value).toBe('Item 1\nItem 2')

      fireEvent.change(textarea, { target: { value: 'Item 1\nItem 2\nItem 3' } })
      expect(handleChange).toHaveBeenCalledWith(['Item 1', 'Item 2', 'Item 3'])
    })
  })

  describe('TagListInput', () => {
    it('manages comma separated tags and calls onChange with parsed tags', () => {
      const handleChange = vi.fn()
      render(
        <TagListInput
          data-testid="tags-input"
          tags={['React', 'TypeScript']}
          onChange={handleChange}
        />
      )

      const input = screen.getByTestId('tags-input') as HTMLInputElement
      expect(input.value).toBe('React, TypeScript')

      fireEvent.change(input, { target: { value: 'React, TypeScript, Vitest' } })
      expect(handleChange).toHaveBeenCalledWith(['React', 'TypeScript', 'Vitest'])
    })
  })

  describe('SectionItemCard', () => {
    it('renders title and triggers onRemove when clicking delete button', () => {
      const handleRemove = vi.fn()
      render(
        <SectionItemCard
          testId="card-test"
          removeTestId="card-remove-btn"
          title="Job #1: Engineer"
          onRemove={handleRemove}
        >
          <div>Card Content</div>
        </SectionItemCard>
      )

      expect(screen.getByText('Job #1: Engineer')).toBeInTheDocument()
      expect(screen.getByText('Card Content')).toBeInTheDocument()

      const removeBtn = screen.getByTestId('card-remove-btn')
      fireEvent.click(removeBtn)
      expect(handleRemove).toHaveBeenCalledTimes(1)
    })
  })

  describe('AddItemButton', () => {
    it('renders button and responds to click', () => {
      const handleClick = vi.fn()
      render(
        <AddItemButton
          data-testid="add-btn"
          label="Add Experience"
          onClick={handleClick}
        />
      )

      const button = screen.getByTestId('add-btn')
      expect(button).toHaveTextContent('Add Experience')

      fireEvent.click(button)
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })
})
