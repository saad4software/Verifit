import { Metadata } from 'next'
import { requireUser } from '@/modules/auth/session'
import { listApplications } from '@/modules/applications/service'
import { ApplicationsDashboard } from '@/modules/applications/components/applications-dashboard'

export const metadata: Metadata = {
  title: 'Applications — Verifit Dashboard',
  description: 'Manage, tailor, and track your job applications on Verifit.',
}

export default async function DashboardApplicationsPage() {
  const { user } = await requireUser()
  const applications = await listApplications(user.id)

  return (
    <div className="flex-1" data-testid="dashboard-applications-page">
      <ApplicationsDashboard initialApplications={applications} />
    </div>
  )
}
