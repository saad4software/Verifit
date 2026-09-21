import { Metadata } from 'next'
import { requireUser } from '@/modules/auth/session'
import { listJds } from '@/modules/jds/service'
import { JdsDashboard } from '@/modules/jds/components/jds-dashboard'

export const metadata: Metadata = {
  title: 'Job Descriptions — Verifit Dashboard',
  description: 'Manage and review your target job opportunities on Verifit.',
}

export default async function DashboardJdsPage() {
  const { user } = await requireUser()
  const jds = await listJds(user.id)

  return (
    <div className="flex-1" data-testid="dashboard-jds-page">
      <JdsDashboard initialJds={jds} />
    </div>
  )
}
