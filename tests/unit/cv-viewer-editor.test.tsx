import React from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CvViewer } from '@/modules/cvs/components/cv-viewer'
import { CvEditor } from '@/modules/cvs/components/cv-editor'
import { CVDocument } from '@/modules/cvs/types'

const sampleCv: CVDocument = {
  _id: 'cv_sample_1',
  _type: 'cv',
  title: 'Fullstack Architect 2026',
  userId: 'user_123',
  isPrimary: true,
  ingestionStatus: 'ready',
  summary: 'Senior developer with extensive cloud experience.',
  personalInfo: {
    fullName: 'Jane Doe',
    headline: 'Principal Engineer',
    email: 'jane.doe@example.com',
    phone: '+1 555-0199',
    location: 'San Francisco, CA',
  },
  sections: [
    {
      _type: 'workExperienceSection',
      _key: 'sec_1',
      sectionTitle: 'Work Experience',
      items: [
        {
          company: 'Acme Systems',
          role: 'Lead Architect',
          startDate: '2021',
          endDate: 'Present',
          isCurrent: true,
          highlights: ['Architected distributed microservices in Go and Next.js.'],
        },
      ],
    },
    {
      _type: 'educationSection',
      _key: 'sec_2',
      sectionTitle: 'Education',
      items: [
        {
          institution: 'MIT',
          degree: 'B.S.',
          fieldOfStudy: 'Computer Science',
        },
      ],
    },
  ],
}

describe('CvViewer Component Tests', () => {
  it('renders personal info and professional summary', () => {
    render(<CvViewer cv={sampleCv} />)

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Principal Engineer')).toBeInTheDocument()
    expect(screen.getByText('jane.doe@example.com')).toBeInTheDocument()
    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument()
    expect(
      screen.getByText(/Senior developer with extensive cloud experience/i)
    ).toBeInTheDocument()
  })

  it('renders work experience and education sections', () => {
    render(<CvViewer cv={sampleCv} />)

    expect(screen.getByText(/Lead Architect/i)).toBeInTheDocument()
    expect(screen.getByText(/Acme Systems/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Architected distributed microservices/i)
    ).toBeInTheDocument()
    expect(screen.getByText('MIT')).toBeInTheDocument()
  })
})

describe('CvEditor Component Tests', () => {
  it('allows editing title and personal info fields', () => {
    render(<CvEditor cv={sampleCv} />)

    const titleInput = screen.getByTestId('edit-title-input') as HTMLInputElement
    expect(titleInput.value).toBe('Fullstack Architect 2026')

    fireEvent.change(titleInput, { target: { value: 'Updated Title' } })
    expect(titleInput.value).toBe('Updated Title')

    const fullNameInput = screen.getByTestId('edit-fullname-input') as HTMLInputElement
    expect(fullNameInput.value).toBe('Jane Doe')

    fireEvent.change(fullNameInput, { target: { value: 'Jane Smith' } })
    expect(fullNameInput.value).toBe('Jane Smith')
  })

  it('reorders sections when clicking move down/up buttons', () => {
    render(<CvEditor cv={sampleCv} />)

    // Move first section down
    const moveDownBtn = screen.getByTestId('move-down-section-0')
    fireEvent.click(moveDownBtn)

    // Verify sections have reordered
    const section0 = screen.getByTestId('editor-section-0')
    expect(section0).toHaveTextContent(/Education/i)
  })
})
