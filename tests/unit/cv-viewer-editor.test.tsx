import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
          _key: 'work_1',
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
          _key: 'edu_1',
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

  it('allows editing section titles and work experience fields', () => {
    render(<CvEditor cv={sampleCv} />)

    // Section title
    const sectionTitleInput = screen.getByTestId('section-title-input-0') as HTMLInputElement
    expect(sectionTitleInput.value).toBe('Work Experience')
    fireEvent.change(sectionTitleInput, { target: { value: 'Professional Career' } })
    expect(sectionTitleInput.value).toBe('Professional Career')

    // Work item company & role
    const companyInput = screen.getByTestId('work-company-0-0') as HTMLInputElement
    expect(companyInput.value).toBe('Acme Systems')
    fireEvent.change(companyInput, { target: { value: 'Global Tech' } })
    expect(companyInput.value).toBe('Global Tech')

    const roleInput = screen.getByTestId('work-role-0-0') as HTMLInputElement
    expect(roleInput.value).toBe('Lead Architect')
    fireEvent.change(roleInput, { target: { value: 'Principal Solutions Architect' } })
    expect(roleInput.value).toBe('Principal Solutions Architect')

    // Highlights
    const highlightsInput = screen.getByTestId('work-highlights-0-0') as HTMLTextAreaElement
    fireEvent.change(highlightsInput, { target: { value: 'Line 1\nLine 2' } })
    expect(highlightsInput.value).toBe('Line 1\nLine 2')
  })

  it('allows adding and removing items within a section', () => {
    render(<CvEditor cv={sampleCv} />)

    // Add another experience item
    const addExpBtn = screen.getByTestId('add-item-to-section-0')
    fireEvent.click(addExpBtn)

    // Now there should be item 1
    const newCompanyInput = screen.getByTestId('work-company-0-1') as HTMLInputElement
    expect(newCompanyInput).toBeInTheDocument()
    fireEvent.change(newCompanyInput, { target: { value: 'Second Company' } })
    expect(newCompanyInput.value).toBe('Second Company')

    // Remove the first item
    const removeBtn = screen.getByTestId('remove-item-0-0')
    fireEvent.click(removeBtn)

    // The remaining item should now be at index 0 and have company 'Second Company'
    const remainingCompany = screen.getByTestId('work-company-0-0') as HTMLInputElement
    expect(remainingCompany.value).toBe('Second Company')
  })

  it('allows adding a new section from the dropdown and editing it', () => {
    render(<CvEditor cv={sampleCv} />)

    // Select 'skillsSection' from the dropdown
    const addSectionSelect = screen.getByTestId('add-section-select') as HTMLSelectElement
    fireEvent.change(addSectionSelect, { target: { value: 'skillsSection' } })

    // Click Add Section
    const addSectionBtn = screen.getByTestId('add-section-button')
    fireEvent.click(addSectionBtn)

    // New section is at index 2
    const section2 = screen.getByTestId('editor-section-2')
    expect(section2).toBeInTheDocument()

    // Add a skill group
    const addSkillGroupBtn = screen.getByTestId('add-item-to-section-2')
    fireEvent.click(addSkillGroupBtn)

    // Set category name and skills
    const categoryInput = screen.getByTestId('skill-category-2-0') as HTMLInputElement
    fireEvent.change(categoryInput, { target: { value: 'Backend' } })
    expect(categoryInput.value).toBe('Backend')

    const skillListInput = screen.getByTestId('skill-list-2-0') as HTMLInputElement
    fireEvent.change(skillListInput, { target: { value: 'Go, Node.js, PostgreSQL' } })
    expect(skillListInput.value).toBe('Go, Node.js, PostgreSQL')
  })

  it('saves CV changes via PATCH request', async () => {
    const mockUpdatedCv = { ...sampleCv, title: 'Updated Title' }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ cv: mockUpdatedCv }),
    })
    global.fetch = fetchMock

    const onSaveSuccess = vi.fn()
    render(<CvEditor cv={sampleCv} onSaveSuccess={onSaveSuccess} />)

    const saveButton = screen.getByTestId('save-cv-button')
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        `/api/cvs/${sampleCv._id}`,
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    expect(onSaveSuccess).toHaveBeenCalledWith(mockUpdatedCv)
  })
})
