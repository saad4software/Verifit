import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { redirect } from 'next/navigation'
import DashboardIndexPage from '@/app/dashboard/page'
import DashboardCvsPage from '@/app/dashboard/cvs/page'
import DashboardJdsPage from '@/app/dashboard/jds/page'
import DashboardApplicationsPage from '@/app/dashboard/applications/page'
import DashboardLayout from '@/app/dashboard/layout'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/dashboard/cvs',
}))

vi.mock('@/modules/auth/session', () => ({
  requireUser: vi.fn().mockResolvedValue({
    user: {
      id: 'user-1',
      name: 'Alex Mercer',
      email: 'alex@example.com',
      role: 'user',
      image: null,
    },
    session: { id: 's1', userId: 'user-1', token: 'tok_1' },
  }),
}))

vi.mock('@/modules/cvs/service', () => ({
  listUserCvs: vi.fn().mockResolvedValue([
    {
      _id: 'cv-1',
      _type: 'cv',
      userId: 'user-1',
      title: 'Senior Full Stack Engineer',
      isPrimary: true,
      ingestionStatus: 'ready',
      sections: [],
    },
  ]),
}))

vi.mock('@/modules/jds/service', () => ({
  listJds: vi.fn().mockResolvedValue([
    {
      _id: 'jd-1',
      _rev: 'rev-1',
      _type: 'jd',
      userId: 'user-1',
      source: {
        id: 'src-1',
        text: 'React Engineer',
        origin: 'pasted',
      },
      content: {
        fields: [],
        requirements: [],
        groups: [],
      },
      warnings: [],
      findings: [],
      error: null,
      processing: null,
      readiness: 'ready',
      replacement: null,
      attempts: 0,
    },
  ]),
}))

vi.mock('@/modules/applications/service', () => ({
  listApplications: vi.fn().mockResolvedValue([
    {
      _id: 'app-1',
      _type: 'application',
      userId: 'user-1',
      title: 'Senior React Dev',
      status: 'interviewing',
      tailoringStatus: 'completed',
      baseCv: { _type: 'reference', _ref: 'cv-1' },
      jd: { _type: 'reference', _ref: 'jd-1' },
      notes: '',
      scoreDelta: null,
    },
  ]),
}))

describe('Dashboard Routing and Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects /dashboard root to /dashboard/cvs', () => {
    DashboardIndexPage()
    expect(redirect).toHaveBeenCalledWith('/dashboard/cvs')
  })

  it('renders DashboardCvsPage with CVs content', async () => {
    const jsx = await DashboardCvsPage()
    render(jsx)

    expect(screen.getByTestId('dashboard-cvs-page')).toBeInTheDocument()
    expect(screen.getByTestId('cvs-dashboard')).toBeInTheDocument()
  })

  it('renders DashboardJdsPage with JDs content', async () => {
    const jsx = await DashboardJdsPage()
    render(jsx)

    expect(screen.getByTestId('dashboard-jds-page')).toBeInTheDocument()
    expect(screen.getByTestId('jds-dashboard')).toBeInTheDocument()
  })

  it('renders DashboardApplicationsPage with Applications content', async () => {
    const jsx = await DashboardApplicationsPage()
    render(jsx)

    expect(screen.getByTestId('dashboard-applications-page')).toBeInTheDocument()
    expect(screen.getByText('Job Applications')).toBeInTheDocument()
  })

  it('renders DashboardLayout with DashboardHeader and children', async () => {
    const jsx = await DashboardLayout({
      children: <div data-testid="test-child-content">Child Page Content</div>,
    })
    render(jsx)

    expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
    expect(screen.getByTestId('test-child-content')).toBeInTheDocument()
  })
})
