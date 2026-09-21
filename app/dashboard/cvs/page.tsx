import { Metadata } from 'next'
import { requireUser } from '@/modules/auth/session'
import { listUserCvs } from '@/modules/cvs/service'
import { CvsDashboard } from '@/modules/cvs/components/cvs-dashboard'

export const metadata: Metadata = {
  title: 'My Resumes — Verifit Dashboard',
  description: 'Manage and tailor your professional CVs and resumes on Verifit.',
}

export default async function DashboardCvsPage() {
  const sessionData = await requireUser()
  const cvs = await listUserCvs(sessionData.user.id)

  return (
    <div className="flex-1" data-testid="dashboard-cvs-page">
      <CvsDashboard initialCvs={cvs} />
    </div>
  )
}
