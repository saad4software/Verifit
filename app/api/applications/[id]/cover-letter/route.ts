import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/modules/auth/server'
import {
  generateCoverLetter,
  ApplicationNotFoundError,
} from '@/modules/applications/service'
import { GenerateCoverLetterSchema } from '@/modules/applications/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(req: Request, context: RouteContext) {
  const { id } = await context.params
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const parsed = GenerateCoverLetterSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.format() },
        { status: 400 }
      )
    }

    const application = await generateCoverLetter(
      id,
      session.user.id,
      parsed.data
    )
    return NextResponse.json({ application })
  } catch (err: unknown) {
    if (err instanceof ApplicationNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    const message =
      err instanceof Error ? err.message : 'Failed to generate cover letter'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
