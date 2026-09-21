import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/modules/auth/server'
import {
  rescoreApplication,
  ApplicationNotFoundError,
} from '@/modules/applications/service'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_req: Request, context: RouteContext) {
  const { id } = await context.params
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const application = await rescoreApplication(id, session.user.id)
    return NextResponse.json({ application })
  } catch (err: unknown) {
    if (err instanceof ApplicationNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    const message =
      err instanceof Error ? err.message : 'Failed to re-score application'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
