import { extractText } from 'unpdf'
import mammoth from 'mammoth'
import { MAX_FILE_SIZE_BYTES, SUPPORTED_MIME_TYPES } from './schemas'

export class DocumentParseError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = 'DocumentParseError'
  }
}

/**
 * Normalizes extracted text:
 * - Replaces Windows CRLF with UNIX LF
 * - Trims trailing whitespace on lines
 * - Compresses more than 2 consecutive blank lines into 2
 * - Removes null characters
 */
export function normalizeExtractedText(raw: string): string {
  if (!raw) return ''

  return raw
    .replace(/\0/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Parses in-memory file buffers (PDF, DOCX, TXT) and returns clean text.
 */
export async function extractRawTextFromBuffer(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<string> {
  if (!buffer || buffer.length === 0) {
    throw new DocumentParseError('The uploaded file buffer is empty.')
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new DocumentParseError(
      `File exceeds the 5 MB limit (received ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`
    )
  }

  // Detect mime type or fallback to file extension
  let resolvedMime = mimeType
  if (!resolvedMime || resolvedMime === 'application/octet-stream') {
    if (fileName?.toLowerCase().endsWith('.pdf')) {
      resolvedMime = 'application/pdf'
    } else if (fileName?.toLowerCase().endsWith('.docx')) {
      resolvedMime =
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    } else if (fileName?.toLowerCase().endsWith('.txt')) {
      resolvedMime = 'text/plain'
    }
  }

  if (
    !SUPPORTED_MIME_TYPES.includes(
      resolvedMime as (typeof SUPPORTED_MIME_TYPES)[number]
    )
  ) {
    throw new DocumentParseError(
      `Unsupported file type: ${resolvedMime || 'unknown'}. Please upload a PDF, DOCX, or TXT file.`
    )
  }

  try {
    if (resolvedMime === 'text/plain') {
      return normalizeExtractedText(buffer.toString('utf-8'))
    }

    if (resolvedMime === 'application/pdf') {
      const uint8 = new Uint8Array(buffer)
      const { text } = await extractText(uint8)
      const joined = Array.isArray(text) ? text.join('\n') : (text as string) || ''
      if (!joined.trim()) {
        throw new DocumentParseError(
          'Could not extract text from this PDF. It may be scanned or image-only without selectable text.'
        )
      }
      return normalizeExtractedText(joined)
    }

    if (
      resolvedMime ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer })
      const extracted = result.value || ''
      if (!extracted.trim()) {
        throw new DocumentParseError(
          'Could not extract text from this DOCX document.'
        )
      }
      return normalizeExtractedText(extracted)
    }

    throw new DocumentParseError(`Unhandled MIME type: ${resolvedMime}`)
  } catch (error: unknown) {
    if (error instanceof DocumentParseError) {
      throw error
    }
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new DocumentParseError(
      `Failed to parse document content: ${message}`,
      error
    )
  }
}
