import { describe, expect, it } from 'vitest'
import {
  extractRawTextFromBuffer,
  normalizeExtractedText,
  DocumentParseError,
} from '@/modules/cvs/parser'
import { MAX_FILE_SIZE_BYTES } from '@/modules/cvs/schemas'

describe('Document Parser & Normalization Unit Tests', () => {
  it('normalizes CRLF, trailing spaces, null bytes, and excessive newlines', () => {
    const dirty = 'Line 1   \r\n\0\r\nLine 2\r\n\r\n\r\n\r\nLine 3   '
    const clean = normalizeExtractedText(dirty)

    expect(clean).toBe('Line 1\n\nLine 2\n\nLine 3')
  })

  it('parses plain text buffers successfully', async () => {
    const rawText = 'John Doe\nSoftware Engineer\njohn@example.com'
    const buffer = Buffer.from(rawText, 'utf-8')

    const result = await extractRawTextFromBuffer(buffer, 'text/plain')
    expect(result).toBe(rawText)
  })

  it('rejects empty file buffers with DocumentParseError', async () => {
    const emptyBuffer = Buffer.alloc(0)

    await expect(
      extractRawTextFromBuffer(emptyBuffer, 'text/plain')
    ).rejects.toThrow(DocumentParseError)
  })

  it('rejects files that exceed the 5 MB limit', async () => {
    const oversizedBuffer = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1024)

    await expect(
      extractRawTextFromBuffer(oversizedBuffer, 'text/plain')
    ).rejects.toThrow(/exceeds the 5 MB limit/)
  })

  it('rejects unsupported MIME types', async () => {
    const buffer = Buffer.from('image content', 'utf-8')

    await expect(
      extractRawTextFromBuffer(buffer, 'image/png')
    ).rejects.toThrow(/Unsupported file type/)
  })

  it('infers MIME type from filename extension if MIME is octet-stream', async () => {
    const buffer = Buffer.from('Plain text in octet stream', 'utf-8')

    const result = await extractRawTextFromBuffer(
      buffer,
      'application/octet-stream',
      'resume.txt'
    )
    expect(result).toBe('Plain text in octet stream')
  })

  it('handles corrupt docx buffers with a clear DocumentParseError', async () => {
    const corruptBuffer = Buffer.from('PK\x03\x04corrupt-docx-data', 'utf-8')

    await expect(
      extractRawTextFromBuffer(
        corruptBuffer,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'resume.docx'
      )
    ).rejects.toThrow(DocumentParseError)
  })

  it('handles corrupt pdf buffers with a clear DocumentParseError', async () => {
    const corruptBuffer = Buffer.from('%PDF-1.4 corrupt pdf content', 'utf-8')

    await expect(
      extractRawTextFromBuffer(corruptBuffer, 'application/pdf', 'resume.pdf')
    ).rejects.toThrow(DocumentParseError)
  })
})
