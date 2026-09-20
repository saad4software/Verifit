import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireUser } from '@/modules/auth/session'
import { getJd } from '@/modules/jds/service'
import { JdError, type Jd } from '@/modules/jds/schema'
import { JdDetail } from '@/modules/jds/components/jd-detail'

export const metadata: Metadata = {
  title: 'Job Description Details — SanityCV',
  description: 'Inspect, review, and edit your structured job description.',
}

export default async function JdPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { user } = await requireUser()
  let jd: Jd
  try {
    jd = await getJd((await params).id, user.id)
  } catch (error) {
    if (error instanceof JdError && error.status === 404) notFound()
    throw error
  }
  return (
    <div className="flex-1 py-6 print:py-0">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 print:max-w-none print:px-0">
        <JdDetail initialJd={jd} />
      </div>
    </div>
  )
}
