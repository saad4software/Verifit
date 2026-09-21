import { Metadata } from 'next'
import { requireUser } from '@/modules/auth/session'
import { listUserCvs } from '@/modules/cvs/service'
import { CvsDashboard } from '@/modules/cvs/components/cvs-dashboard'

export const metadata: Metadata = {
  title: 'My Resumes — Verifit',
  description: 'Manage and tailor your professional CVs and resumes on Verifit.',
}

export default async function CvsPage() {
  const sessionData = await requireUser()
  const cvs = await listUserCvs(sessionData.user.id)

  return (
    <div className="flex-1 py-10">
      <CvsDashboard initialCvs={cvs} />
    </div>
  )
}
