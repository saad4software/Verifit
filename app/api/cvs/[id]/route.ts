import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/modules/auth/server'
import {
  getCvById,
  updateCv,
  setPrimaryCv,
  deleteCv,
  CvNotFoundError,
} from '@/modules/cvs/service'
import { UpdateCvInputSchema } from '@/modules/cvs/schemas'
import { CVDocument } from '@/modules/cvs/types'

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
    const cv = await getCvById(id, session.user.id)
    return NextResponse.json({ cv })
  } catch (err: unknown) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    const message = err instanceof Error ? err.message : 'Failed to fetch CV'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const { id } = await params

  try {
    const json = await request.json()
    const parsed = UpdateCvInputSchema.parse(json)

    if (parsed.isPrimary === true) {
      await setPrimaryCv(id, session.user.id)
    }

    const updated = await updateCv(
      id,
      session.user.id,
      parsed as unknown as Partial<CVDocument>
    )
    return NextResponse.json({ cv: updated })
  } catch (err: unknown) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    const message = err instanceof Error ? err.message : 'Failed to update CV'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(
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
    await deleteCv(id, session.user.id)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    const message = err instanceof Error ? err.message : 'Failed to delete CV'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const maxDuration = 300
