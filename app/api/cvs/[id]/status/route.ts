import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/modules/auth/server'
import { pollCvStatus, CvNotFoundError } from '@/modules/cvs/service'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { id } = await params

  try {
    const status = await pollCvStatus(id, session.user.id)
    return NextResponse.json(status)
  } catch (err: unknown) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    const message = err instanceof Error ? err.message : 'Failed to poll CV status'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
