import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImportForm } from '@/modules/cvs/components/import-form'
import { ProgressStepper } from '@/modules/cvs/components/progress-stepper'
import { MAX_FILE_SIZE_BYTES } from '@/modules/cvs/schemas'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('CVs UI Components Tests', () => {
  it('renders ImportForm and switches tabs between File Upload and Plain Text', () => {
    render(<ImportForm />)

    // Default tab is upload
    expect(screen.getByTestId('tab-upload')).toBeInTheDocument()
    expect(screen.getByTestId('tab-text')).toBeInTheDocument()
    expect(screen.getByTestId('file-dropzone')).toBeInTheDocument()

    // Switch to text tab
    fireEvent.click(screen.getByTestId('tab-text'))
    expect(screen.getByTestId('raw-text-input')).toBeInTheDocument()
    expect(screen.queryByTestId('file-dropzone')).not.toBeInTheDocument()
  })

  it('shows validation error when file exceeds 5 MB limit', () => {
    render(<ImportForm />)

    const fileInput = screen.getByTestId('file-input')
    const oversizedFile = new File(['x'.repeat(MAX_FILE_SIZE_BYTES + 100)], 'huge.pdf', {
      type: 'application/pdf',
    })

    Object.defineProperty(fileInput, 'files', {
      value: [oversizedFile],
    })
    fireEvent.change(fileInput)

    expect(screen.getByTestId('import-error-banner')).toHaveTextContent(
      /exceeds 5 MB limit/i
    )
  })

  it('shows validation error when attempting to submit with no input', () => {
    render(<ImportForm />)

    fireEvent.click(screen.getByTestId('import-submit-button'))
    expect(screen.getByTestId('import-error-banner')).toHaveTextContent(
      /Please select or drop a PDF or DOCX file/i
    )
  })

  it('renders ProgressStepper with active and completed states', () => {
    const { rerender } = render(
      <ProgressStepper cvId="cv_123" status="extracting" />
    )

    expect(screen.getByTestId('progress-stepper')).toBeInTheDocument()
    expect(screen.getByTestId('step-extracting')).toBeInTheDocument()
    expect(screen.getByTestId('step-structuring')).toBeInTheDocument()
    expect(screen.getByTestId('step-ready')).toBeInTheDocument()

    // Rerender as ready
    rerender(<ProgressStepper cvId="cv_123" status="ready" />)
    expect(screen.getByText(/Your CV is fully structured/i)).toBeInTheDocument()
  })

  it('renders failure banner and retry button when status is failed', () => {
    render(
      <ProgressStepper
        cvId="cv_failed_1"
        status="failed"
        errorMessage="AI timeout during parsing"
      />
    )

    expect(screen.getByTestId('stepper-error-banner')).toBeInTheDocument()
    expect(screen.getByText(/AI timeout during parsing/i)).toBeInTheDocument()
    expect(screen.getByTestId('retry-structuring-button')).toBeInTheDocument()
  })
})
