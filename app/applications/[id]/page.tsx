import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireUser } from '@/modules/auth/session'
import {
  getApplicationById,
  ApplicationNotFoundError,
} from '@/modules/applications/service'
import { ApplicationDetailView } from '@/modules/applications/components/application-detail-view'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { id } = await props.params
  try {
    const { user } = await requireUser()
    const app = await getApplicationById(id, user.id)
    return {
      title: `${app.title || 'Job Application'} — Verifit`,
      description: 'Track and tailor your job application materials on Verifit.',
    }
  } catch {
    return {
      title: 'Job Application — Verifit',
    }
  }
}

export default async function ApplicationDetailPage(props: PageProps) {
  const { id } = await props.params
  const { user } = await requireUser()

  let application
  try {
    application = await getApplicationById(id, user.id)
  } catch (err) {
    if (err instanceof ApplicationNotFoundError) {
      notFound()
    }
    throw err
  }

  return (
    <div className="flex-1 py-10">
      <ApplicationDetailView initialApplication={application} />
    </div>
  )
}
