import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireUser } from '@/modules/auth/session'
import { getCvById, CvNotFoundError } from '@/modules/cvs/service'
import { CvDetailView } from '@/modules/cvs/components/cv-detail-view'
import { CVDocument } from '@/modules/cvs/types'

export const metadata: Metadata = {
  title: 'CV Details — SanityCV',
  description: 'Inspect and edit your structured CV.',
}

export default async function CvDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const sessionData = await requireUser()
  const { id } = await params

  let cv: CVDocument
  try {
    cv = await getCvById(id, sessionData.user.id)
  } catch (err: unknown) {
    if (err instanceof CvNotFoundError) {
      notFound()
    }
    throw err
  }

  return (
    <div className="flex-1 py-6">
      <CvDetailView initialCv={cv} />
    </div>
  )
}
