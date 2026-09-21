import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DashboardHeader } from '@/modules/dashboard/components/dashboard-header'
import * as authClient from '@/modules/auth/client'

const mockPush = vi.fn()
const mockRefresh = vi.fn()
let mockCurrentPathname = '/dashboard/cvs'

const mockSignOut = vi.fn().mockResolvedValue({})

vi.mock('@/modules/auth/client', () => ({
  signOut: (...args: any[]) => mockSignOut(...args),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  usePathname: () => mockCurrentPathname,
}))

const mockUser = {
  id: 'u1',
  name: 'Alex Mercer',
  email: 'alex@example.com',
  role: 'admin',
  image: null,
}

describe('DashboardHeader Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCurrentPathname = '/dashboard/cvs'
  })

  it('renders dashboard brand and the three navigation tabs', () => {
    render(<DashboardHeader user={mockUser} />)

    expect(screen.getByTestId('dashboard-header')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-brand')).toHaveAttribute('href', '/dashboard/cvs')

    const cvsLink = screen.getByTestId('dashboard-nav-cvs')
    const jdsLink = screen.getByTestId('dashboard-nav-jds')
    const appsLink = screen.getByTestId('dashboard-nav-applications')

    expect(cvsLink).toBeInTheDocument()
    expect(cvsLink).toHaveAttribute('href', '/dashboard/cvs')
    expect(cvsLink).toHaveTextContent('My Resumes')

    expect(jdsLink).toBeInTheDocument()
    expect(jdsLink).toHaveAttribute('href', '/dashboard/jds')
    expect(jdsLink).toHaveTextContent('Job Descriptions')

    expect(appsLink).toBeInTheDocument()
    expect(appsLink).toHaveAttribute('href', '/dashboard/applications')
    expect(appsLink).toHaveTextContent('Applications')
  })

  it('highlights active tab based on pathname', () => {
    // When on /dashboard/cvs
    mockCurrentPathname = '/dashboard/cvs'
    const { rerender } = render(<DashboardHeader user={mockUser} />)

    expect(screen.getByTestId('dashboard-nav-cvs')).toHaveClass('bg-white')
    expect(screen.getByTestId('dashboard-nav-jds')).not.toHaveClass('bg-white')
    expect(screen.getByTestId('dashboard-nav-applications')).not.toHaveClass('bg-white')

    // When on /dashboard/jds
    mockCurrentPathname = '/dashboard/jds'
    rerender(<DashboardHeader user={mockUser} />)

    expect(screen.getByTestId('dashboard-nav-jds')).toHaveClass('bg-white')
    expect(screen.getByTestId('dashboard-nav-cvs')).not.toHaveClass('bg-white')

    // When on /dashboard/applications
    mockCurrentPathname = '/dashboard/applications'
    rerender(<DashboardHeader user={mockUser} />)

    expect(screen.getByTestId('dashboard-nav-applications')).toHaveClass('bg-white')
    expect(screen.getByTestId('dashboard-nav-jds')).not.toHaveClass('bg-white')
  })

  it('toggles user dropdown menu with settings and signout without external links', () => {
    render(<DashboardHeader user={mockUser} />)

    const userButton = screen.getByTestId('dashboard-user-menu')
    expect(userButton).toBeInTheDocument()
    expect(screen.getByText('Alex Mercer')).toBeInTheDocument()
    expect(screen.getByText(/Admin/i)).toBeInTheDocument()

    // Open dropdown
    fireEvent.click(userButton)

    expect(screen.getByTestId('dashboard-user-dropdown')).toBeInTheDocument()
    expect(screen.getByTestId('dashboard-dropdown-account')).toHaveAttribute('href', '/account')
    expect(screen.queryByTestId('dashboard-dropdown-home')).not.toBeInTheDocument()
    expect(screen.getByTestId('dashboard-dropdown-signout')).toBeInTheDocument()
  })

  it('signs out and navigates home when signout clicked', async () => {
    render(<DashboardHeader user={mockUser} />)

    fireEvent.click(screen.getByTestId('dashboard-user-menu'))
    fireEvent.click(screen.getByTestId('dashboard-dropdown-signout'))

    expect(mockSignOut).toHaveBeenCalled()
  })

  it('toggles mobile menu drawer', () => {
    render(<DashboardHeader user={mockUser} />)

    const toggleButton = screen.getByTestId('dashboard-mobile-menu-toggle')
    expect(screen.queryByTestId('dashboard-mobile-nav')).not.toBeInTheDocument()

    fireEvent.click(toggleButton)
    expect(screen.getByTestId('dashboard-mobile-nav')).toBeInTheDocument()

    const mobileCvs = screen.getByTestId('dashboard-mobile-nav-cvs')
    expect(mobileCvs).toHaveAttribute('href', '/dashboard/cvs')
    expect(mobileCvs).toHaveTextContent('My Resumes')

    const mobileJds = screen.getByTestId('dashboard-mobile-nav-jds')
    expect(mobileJds).toHaveAttribute('href', '/dashboard/jds')
    expect(mobileJds).toHaveTextContent('Job Descriptions')

    const mobileApps = screen.getByTestId('dashboard-mobile-nav-applications')
    expect(mobileApps).toHaveAttribute('href', '/dashboard/applications')
    expect(mobileApps).toHaveTextContent('Applications')

    fireEvent.click(toggleButton)
    expect(screen.queryByTestId('dashboard-mobile-nav')).not.toBeInTheDocument()
  })
})
