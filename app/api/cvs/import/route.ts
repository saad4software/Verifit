import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { after } from 'next/server'
import { auth } from '@/modules/auth/server'
import {
  createCvFromImport,
  processCvBackground,
} from '@/modules/cvs/service'
import { MAX_FILE_SIZE_BYTES } from '@/modules/cvs/schemas'
import { DocumentParseError } from '@/modules/cvs/parser'

export async function POST(request: NextRequest) {
  const reqHeaders = await headers()
  const session = await auth.api.getSession({ headers: reqHeaders })

  if (!session || !session.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const contentType = request.headers.get('content-type') || ''

  try {
    let title: string | undefined
    let rawText: string | undefined
    let buffer: Buffer | undefined
    let mimeType: string | undefined
    let fileName: string | undefined

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      title = (formData.get('title') as string) || undefined
      rawText = (formData.get('rawText') as string) || undefined

      const file = formData.get('file') as File | null
      if (file && file.size > 0) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json(
            {
              error: `File exceeds 5 MB limit (received ${(file.size / (1024 * 1024)).toFixed(2)} MB)`,
            },
            { status: 413 }
          )
        }
        const arrayBuffer = await file.arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
        mimeType = file.type
        fileName = file.name
      }
    } else {
      const body = await request.json()
      title = body.title
      rawText = body.rawText
    }

    if (!rawText && !buffer) {
      return NextResponse.json(
        { error: 'Please provide either a document file or raw text to import.' },
        { status: 400 }
      )
    }

    const newCv = await createCvFromImport(session.user.id, {
      title,
      rawText,
      buffer,
      mimeType,
      fileName,
    })

    // Asynchronous structuring execution hook
    if (newCv.rawText) {
      const cvId = newCv._id
      const extracted = newCv.rawText
      try {
        after(async () => {
          try {
            await processCvBackground(cvId, extracted)
          } catch (err) {
            console.error(`Background CV structuring failed for ${cvId}:`, err)
          }
        })
      } catch {
        // In environments without after() lifecycle support, run in background
        processCvBackground(cvId, extracted).catch(() => {})
      }
    }

    return NextResponse.json(
      {
        cvId: newCv._id,
        status: newCv.ingestionStatus,
        isPrimary: newCv.isPrimary,
        title: newCv.title,
      },
      { status: 201 }
    )
  } catch (err: unknown) {
    if (err instanceof DocumentParseError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    const message =
      err instanceof Error ? err.message : 'Internal error during CV ingestion.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
