import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/modules/auth/server'
import {
  listApplications,
  createApplication,
} from '@/modules/applications/service'
import { CreateApplicationSchema } from '@/modules/applications/types'

export async function GET() {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const applications = await listApplications(session.user.id)
    return NextResponse.json({ applications })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to list applications'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const parsed = CreateApplicationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const application = await createApplication(session.user.id, parsed.data)
    return NextResponse.json({ application }, { status: 201 })
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to create application'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
