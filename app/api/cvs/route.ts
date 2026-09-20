import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/modules/auth/server'
import { listUserCvs } from '@/modules/cvs/service'

export async function GET(_request?: NextRequest) {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    const cvs = await listUserCvs(session.user.id)
    return NextResponse.json({ cvs })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list CVs'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
