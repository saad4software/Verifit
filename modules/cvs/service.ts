import { getServerSanityClient } from '@/sanity/lib/server-client'
import { extractRawTextFromBuffer } from './parser'
import { executeCvStructuringAgent } from './agent'
import { CVDocument, IngestionStatus } from './types'

export class CvNotFoundError extends Error {
  constructor(message = 'CV not found or access unauthorized.') {
    super(message)
    this.name = 'CvNotFoundError'
  }
}

export class CvAuthorizationError extends Error {
  constructor(message = 'You do not have permission to access this CV.') {
    super(message)
    this.name = 'CvAuthorizationError'
  }
}

/**
 * Lists all CVs belonging to a user, ordered by creation date descending.
 */
export async function listUserCvs(userId: string): Promise<CVDocument[]> {
  const client = getServerSanityClient()
  const query = `*[_type == "cv" && userId == $userId] | order(_createdAt desc)`
  const cvs = await client.fetch<CVDocument[]>(query, { userId })
  return cvs || []
}

/**
 * Retrieves a single CV by ID, verifying user ownership.
 */
export async function getCvById(
  cvId: string,
  userId: string
): Promise<CVDocument> {
  const client = getServerSanityClient()
  const query = `*[_type == "cv" && _id == $cvId && userId == $userId][0]`
  const cv = await client.fetch<CVDocument | null>(query, { cvId, userId })

  if (!cv) {
    throw new CvNotFoundError(`CV with ID ${cvId} not found for this user.`)
  }

  return cv
}

export interface CreateCvImportInput {
  title?: string
  rawText?: string
  buffer?: Buffer
  mimeType?: string
  fileName?: string
}

/**
 * Creates a new CV document from raw text or uploaded document buffer.
 * Automatically marks the first CV as primary.
 */
export async function createCvFromImport(
  userId: string,
  input: CreateCvImportInput
): Promise<CVDocument> {
  const client = getServerSanityClient()

  // 1. Resolve raw text
  let extractedText = input.rawText || ''
  if (input.buffer && input.mimeType) {
    extractedText = await extractRawTextFromBuffer(
      input.buffer,
      input.mimeType,
      input.fileName
    )
  }

  if (!extractedText.trim()) {
    throw new Error('No text content could be extracted or provided.')
  }

  // 2. Check existing CV count to assign isPrimary
  const existingCvs = await listUserCvs(userId)
  const isFirstCv = existingCvs.length === 0

  const defaultTitle =
    input.title ||
    `My CV - ${new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}`

  // 3. Create document in Sanity with status 'extracting'
  const newCv = await client.create({
    _type: 'cv',
    userId,
    title: defaultTitle,
    isPrimary: isFirstCv,
    ingestionStatus: 'extracting' as IngestionStatus,
    rawText: extractedText,
    errorMessage: null,
  })

  return newCv as unknown as CVDocument
}

/**
 * Background worker task to execute the AI structuring pipeline.
 */
export async function processCvBackground(
  cvId: string,
  rawText: string
): Promise<CVDocument> {
  return await executeCvStructuringAgent(cvId, rawText)
}

/**
 * Polls the ingestion status for a given CV.
 */
export async function pollCvStatus(
  cvId: string,
  userId: string
): Promise<{
  _id: string
  title: string
  isPrimary: boolean
  ingestionStatus: IngestionStatus
  errorMessage?: string
}> {
  const cv = await getCvById(cvId, userId)
  return {
    _id: cv._id,
    title: cv.title,
    isPrimary: cv.isPrimary,
    ingestionStatus: cv.ingestionStatus,
    errorMessage: cv.errorMessage,
  }
}

/**
 * Retries structuring a failed CV using its retained rawText.
 */
export async function retryCvStructuring(
  cvId: string,
  userId: string
): Promise<CVDocument> {
  const cv = await getCvById(cvId, userId)

  if (!cv.rawText) {
    throw new Error('This CV has no retained raw text to re-structure.')
  }

  const client = getServerSanityClient()
  await client
    .patch(cvId)
    .set({
      ingestionStatus: 'extracting' as IngestionStatus,
      errorMessage: null,
    })
    .commit()

  // Run structuring
  return await processCvBackground(cvId, cv.rawText)
}

/**
 * Sets the specified CV as primary, clearing primary status from all other CVs for this user.
 */
export async function setPrimaryCv(
  cvId: string,
  userId: string
): Promise<CVDocument> {
  await getCvById(cvId, userId)
  const allUserCvs = await listUserCvs(userId)
  const client = getServerSanityClient()

  // Unset primary from all other CVs
  for (const cv of allUserCvs) {
    if (cv._id !== cvId && cv.isPrimary) {
      await client.patch(cv._id).set({ isPrimary: false }).commit()
    }
  }

  // Set target as primary
  const updated = await client.patch(cvId).set({ isPrimary: true }).commit()
  return updated as unknown as CVDocument
}

/**
 * Updates editable fields of an existing CV.
 */
export async function updateCv(
  cvId: string,
  userId: string,
  patch: Partial<CVDocument>
): Promise<CVDocument> {
  await getCvById(cvId, userId) // Tenancy check
  const client = getServerSanityClient()

  // Disallow overwriting tenancy or type
  const safePatch: Record<string, unknown> = { ...patch }
  delete safePatch.userId
  delete safePatch._type
  delete safePatch._id

  const updated = await client.patch(cvId).set(safePatch).commit()
  return updated as unknown as CVDocument
}

/**
 * Deletes a CV document after verifying tenancy.
 */
export async function deleteCv(cvId: string, userId: string): Promise<void> {
  await getCvById(cvId, userId) // Tenancy check
  const client = getServerSanityClient()
  await client.delete(cvId)
}
