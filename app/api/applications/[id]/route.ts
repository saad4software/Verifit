import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/modules/auth/server'
import {
  getApplicationById,
  updateApplication,
  deleteApplication,
  ApplicationNotFoundError,
} from '@/modules/applications/service'
import { UpdateApplicationSchema } from '@/modules/applications/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_req: Request, context: RouteContext) {
  const { id } = await context.params
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const application = await getApplicationById(id, session.user.id)
    return NextResponse.json({ application })
  } catch (err: unknown) {
    if (err instanceof ApplicationNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    const message =
      err instanceof Error ? err.message : 'Failed to retrieve application'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request, context: RouteContext) {
  const { id } = await context.params
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = UpdateApplicationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const application = await updateApplication(id, session.user.id, parsed.data)
    return NextResponse.json({ application })
  } catch (err: unknown) {
    if (err instanceof ApplicationNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    const message =
      err instanceof Error ? err.message : 'Failed to update application'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    await deleteApplication(id, session.user.id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    if (err instanceof ApplicationNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    const message =
      err instanceof Error ? err.message : 'Failed to delete application'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
