import { Metadata } from 'next'
import { requireUser } from '@/modules/auth/session'
import { listJds } from '@/modules/jds/service'
import { JdsDashboard } from '@/modules/jds/components/jds-dashboard'

export const metadata: Metadata = {
  title: 'Job Descriptions — Verifit',
  description: 'Manage and review your target job opportunities and requirements on Verifit.',
}

export default async function JdsPage() {
  const { user } = await requireUser()
  const jds = await listJds(user.id)

  return (
    <div className="flex-1 py-10">
      <JdsDashboard initialJds={jds} />
    </div>
  )
}
