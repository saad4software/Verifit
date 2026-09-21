import React from 'react'
import { describe, expect, it, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { JdsDashboard } from '@/modules/jds/components/jds-dashboard'
import { JdCard } from '@/modules/jds/components/jd-card'
import { JdViewer } from '@/modules/jds/components/jd-viewer'
import type { Jd } from '@/modules/jds/schema'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

const mockJd: Jd = {
  _id: 'jd-123',
  _rev: 'rev-1',
  _type: 'jd',
  userId: 'user-1',
  source: {
    id: 'src-1',
    text: 'Senior Full Stack Engineer needed with React and Node experience.',
    origin: 'fetched',
    url: 'https://example.com/jobs/lead-engineer',
  },
  content: {
    fields: [
      {
        _key: 'f-title',
        category: 'title',
        text: 'Senior Full Stack Engineer',
        evidence: ['Senior Full Stack Engineer needed'],
      },
      {
        _key: 'f-company',
        category: 'company',
        text: 'Acme Technologies',
        evidence: ['Acme Technologies'],
      },
      {
        _key: 'f-location',
        category: 'location',
        text: 'Remote / Berlin',
        evidence: ['Remote / Berlin'],
      },
      {
        _key: 'f-resp',
        category: 'responsibilities',
        text: 'Lead architecture of core services',
        evidence: ['Lead architecture of core services'],
      },
    ],
    requirements: [
      {
        _key: 'r-1',
        category: 'skills',
        classification: 'required',
        text: '5+ years experience with React',
        evidence: ['React and Node experience'],
      },
      {
        _key: 'r-2',
        category: 'skills',
        classification: 'preferred',
        text: 'Familiarity with GraphQL',
        evidence: ['GraphQL'],
      },
    ],
    groups: [
      {
        _key: 'g-1',
        operator: 'any',
      },
    ],
  },
  warnings: [],
  findings: [],
  error: null,
  processing: null,
  readiness: 'ready',
  replacement: null,
  attempts: 1,
}

describe('JDs Dashboard and Card Components', () => {
  it('renders JdsDashboard with empty state when no JDs are present', () => {
    render(<JdsDashboard initialJds={[]} />)

    expect(screen.getByTestId('jds-dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('empty-jds-state')).toBeInTheDocument()
    expect(screen.getByText(/No job descriptions imported yet/i)).toBeInTheDocument()
    expect(screen.getByTestId('empty-state-import-button')).toHaveAttribute(
      'href',
      '/dashboard/jds/import',
    )
  })

  it('renders JdsDashboard with search filtering and job cards', () => {
    render(<JdsDashboard initialJds={[mockJd]} />)

    expect(screen.getByTestId('jds-dashboard')).toBeInTheDocument()
    expect(screen.getByText('Senior Full Stack Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Technologies')).toBeInTheDocument()

    // Test search filter
    const searchInput = screen.getByTestId('search-jds-input')
    fireEvent.change(searchInput, { target: { value: 'Nonexistent' } })

    expect(
      screen.getByText(/No job descriptions matched/i),
    ).toBeInTheDocument()

    // Clear search
    fireEvent.change(searchInput, { target: { value: 'Acme' } })
    expect(screen.getByText('Senior Full Stack Engineer')).toBeInTheDocument()
  })

  it('renders JdCard with status badge, details, and delete confirmation', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ success: true }))
    vi.stubGlobal('fetch', fetcher)

    render(<JdCard jd={mockJd} />)

    expect(screen.getByTestId(`jd-card-${mockJd._id}`)).toBeInTheDocument()
    expect(screen.getByTestId('status-ready')).toHaveTextContent('Ready')
    expect(screen.getByText(/1 Details/i)).toBeInTheDocument()
    expect(screen.getByText(/2 Qualifications/i)).toBeInTheDocument()

    // Open button
    expect(screen.getByTestId('open-jd-button')).toHaveAttribute(
      'href',
      `/dashboard/jds/${mockJd._id}`,
    )

    // Delete toggle
    const deleteBtn = screen.getByTestId('delete-jd-button')
    fireEvent.click(deleteBtn)

    const confirmBtn = screen.getByTestId('confirm-delete-button')
    expect(confirmBtn).toBeInTheDocument()
    fireEvent.click(confirmBtn)

    expect(fetcher).toHaveBeenCalledWith(`/api/jds/${mockJd._id}`, {
      method: 'DELETE',
    })
  })

  it('renders JdViewer with ATS formatted sections and evidence excerpts', () => {
    render(<JdViewer content={mockJd.content!} />)

    expect(screen.getByTestId('jd-viewer')).toBeInTheDocument()
    expect(screen.getByText('Senior Full Stack Engineer')).toBeInTheDocument()
    expect(screen.getByText('Acme Technologies')).toBeInTheDocument()
    expect(screen.getByText(/Required Qualifications/i)).toBeInTheDocument()
    expect(screen.getByText('5+ years experience with React')).toBeInTheDocument()
    expect(screen.getByText(/Preferred \/ Nice to Have/i)).toBeInTheDocument()
    expect(screen.getByText('Familiarity with GraphQL')).toBeInTheDocument()
    expect(screen.getByText(/Qualification Groups/i)).toBeInTheDocument()
  })
})
