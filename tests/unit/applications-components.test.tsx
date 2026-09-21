import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ScoreDeltaCard } from '@/modules/applications/components/score-delta-card'
import { RequirementDeltaTable } from '@/modules/applications/components/requirement-delta-table'
import { KanbanBoard } from '@/modules/applications/components/kanban-board'
import { ApplicationPackageDrawer } from '@/modules/applications/components/application-package-drawer'
import type { PopulatedApplication, RequirementDelta, ScoreDelta } from '@/modules/applications/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('Applications Components', () => {
  describe('ScoreDeltaCard', () => {
    it('renders empty pending state when no scores exist', () => {
      render(<ScoreDeltaCard scoreDelta={null} tailoringStatus="idle" />)
      expect(screen.getByText(/Fit Assessment Pending/i)).toBeInTheDocument()
    })

    it('renders baseline score, tailored score, and points improvement', () => {
      const scoreDelta: ScoreDelta = {
        oldScore: 60,
        newScore: 88,
        scoreDiff: 28,
        gapsClosed: 3,
        totalRequirements: 8,
      }
      render(<ScoreDeltaCard scoreDelta={scoreDelta} tailoringStatus="completed" />)

      expect(screen.getByText('60')).toBeInTheDocument()
      expect(screen.getByText('88')).toBeInTheDocument()
      expect(screen.getByText(/\+28 points improvement/i)).toBeInTheDocument()
      expect(screen.getByText(/3 Gaps Closed/i)).toBeInTheDocument()
    })
  })

  describe('RequirementDeltaTable', () => {
    it('renders requirement rows with statuses and gap closed tags', () => {
      const deltas: RequirementDelta[] = [
        {
          requirementId: 'r1',
          text: '5+ years Node.js experience',
          classification: 'required',
          baselineStatus: 'met',
          tailoredStatus: 'met',
          improved: false,
        },
        {
          requirementId: 'r2',
          text: 'Docker & Kubernetes orchestration',
          classification: 'preferred',
          baselineStatus: 'not_evidenced',
          tailoredStatus: 'met',
          improved: true,
        },
      ]

      render(<RequirementDeltaTable deltas={deltas} />)

      expect(screen.getByText('5+ years Node.js experience')).toBeInTheDocument()
      expect(screen.getByText('Docker & Kubernetes orchestration')).toBeInTheDocument()
      expect(screen.getByText('Gap Closed')).toBeInTheDocument()
      expect(screen.getByText('Unchanged')).toBeInTheDocument()
    })
  })

  describe('KanbanBoard', () => {
    it('renders column headers and cards', () => {
      const mockApp: PopulatedApplication = {
        _id: 'app_1',
        _type: 'application',
        userId: 'u1',
        title: 'Fullstack Engineer at Vercel',
        status: 'draft',
        tailoringStatus: 'completed',
        jd: { _type: 'reference', _ref: 'jd_1' },
        baseCv: { _type: 'reference', _ref: 'cv_1' },
        scoreDelta: {
          oldScore: 50,
          newScore: 85,
          scoreDiff: 35,
          gapsClosed: 2,
          totalRequirements: 5,
        },
      }

      render(<KanbanBoard initialApplications={[mockApp]} />)

      expect(screen.getByText('Draft')).toBeInTheDocument()
      expect(screen.getByText('Applied')).toBeInTheDocument()
      expect(screen.getByText('Interviewing')).toBeInTheDocument()
      expect(screen.getByText('Fullstack Engineer at Vercel')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
      expect(screen.getByText('85%')).toBeInTheDocument()
    })
  })

  describe('ApplicationPackageDrawer', () => {
    it('renders tailored CV download and cover letter copy options', () => {
      const mockApp: PopulatedApplication = {
        _id: 'app_2',
        _type: 'application',
        userId: 'u1',
        title: 'Backend Dev at Stripe',
        status: 'applied',
        tailoringStatus: 'completed',
        jd: { _type: 'reference', _ref: 'jd_2' },
        baseCv: { _type: 'reference', _ref: 'cv_2' },
        tailoredCv: { _type: 'reference', _ref: 'cv_tailored_2' },
        coverLetter: 'Dear Stripe Team,\n\nI am thrilled to apply...',
      }

      render(
        <ApplicationPackageDrawer
          application={mockApp}
          isOpen={true}
          onClose={vi.fn()}
        />
      )

      expect(screen.getByText('Application Package')).toBeInTheDocument()
      expect(screen.getByText('View & Print PDF')).toBeInTheDocument()
      expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument()
    })
  })
})
