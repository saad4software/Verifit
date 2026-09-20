import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { auth } from '@/modules/auth/server'
import {
  getCvById,
  processCvBackground,
  CvNotFoundError,
} from '@/modules/cvs/service'
import { getServerSanityClient } from '@/sanity/lib/server-client'

export async function POST(
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
    if (!cv.rawText) {
      return NextResponse.json(
        { error: 'No raw text available to re-run structuring.' },
        { status: 400 }
      )
    }

    // Set to extracting
    const client = getServerSanityClient()
    await client
      .patch(id)
      .set({
        ingestionStatus: 'extracting',
        errorMessage: null,
      })
      .commit()

    // Trigger async structuring
    const rawText = cv.rawText
    try {
      after(async () => {
        try {
          await processCvBackground(id, rawText)
        } catch (err) {
          console.error(`Retry structuring failed for ${id}:`, err)
        }
      })
    } catch {
      processCvBackground(id, rawText).catch(() => {})
    }

    return NextResponse.json({ success: true, cvId: id, status: 'extracting' })
  } catch (err: unknown) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    const message = err instanceof Error ? err.message : 'Failed to retry CV structuring'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export const maxDuration = 300
