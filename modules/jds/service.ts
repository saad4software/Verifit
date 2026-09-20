import { normalizeUrl, retrieveText } from './retrieval'
import { randomUUID } from 'node:crypto'
import { getJdClient } from '@/sanity/lib/jd-client'
import { structureJd, validateSupport } from './agent'
import {
  JdError,
  TextSchema,
  ContentSchema,
  evidenceFindings,
  type Jd,
} from './schema'

export async function listJds(userId: string): Promise<Jd[]> {
  return getJdClient().fetch(
    '*[_type == "jd" && userId == $userId] | order(_createdAt desc)',
    { userId },
  )
}
export async function getJd(id: string, userId: string): Promise<Jd> {
  const jd = await getJdClient().fetch<Jd | null>(
    '*[_type == "jd" && _id == $id && userId == $userId][0]',
    { id, userId },
  )
  if (!jd) throw new JdError('JD not found.', 404)
  const expired = (processing: Jd['processing']) =>
    processing && Date.now() - Date.parse(processing.startedAt) >= 5 * 60_000
  if (expired(jd.processing))
    return writeJd(jd, {
      processing: null,
      error: 'Processing was interrupted. Retry the retained source.',
    })
  if (expired(jd.replacement?.processing ?? null) && jd.replacement)
    return writeJd(jd, {
      replacement: {
        ...jd.replacement,
        processing: null,
        error:
          'Replacement processing was interrupted. Reject it and try again.',
      },
    })
  return jd
}
export async function writeJd(jd: Jd, fields: Partial<Jd>): Promise<Jd> {
  try {
    return await getJdClient()
      .patch(jd._id)
      .ifRevisionId(jd._rev)
      .set(fields)
      .commit<Jd>()
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'statusCode' in error &&
      error.statusCode === 409
    )
      throw new JdError(
        'This JD changed. Reload and review before trying again.',
        409,
      )
    throw error
  }
}
export async function importJd(
  userId: string,
  input: { text?: string; url?: string },
): Promise<Jd> {
  const text = input.text === undefined ? '' : TextSchema.parse(input.text)
  const url = input.url === undefined ? undefined : normalizeUrl(input.url)
  return getJdClient().create({
    _id: randomUUID(),
    _type: 'jd',
    userId,
    source: {
      id: randomUUID(),
      text,
      origin: url ? 'fetched' : 'pasted',
      ...(url ? { url } : {}),
    },
    content: null,
    warnings: [],
    findings: [],
    readiness: 'needs_review',
    replacement: null,
    attempts: 1,
    error: null,
    processing: {
      id: randomUUID(),
      startedAt: new Date().toISOString(),
      stage: url ? 'extracting' : 'structuring',
      attempt: 1,
    },
  }) as Promise<Jd>
}
export async function processJd(jd: Jd, replacement = false) {
  let version = replacement ? jd.replacement : jd
  if (!version?.processing) return
  const update = async (fields: Partial<import('./schema').Version>) => {
    if (
      version?.processing &&
      Date.now() - Date.parse(version.processing.startedAt) >= 5 * 60_000
    )
      fields = {
        processing: null,
        error: 'Processing was interrupted. Retry the retained source.',
      }
    const next = { ...version!, ...fields }
    jd = await writeJd(jd, replacement ? { replacement: next } : fields)
    version = replacement ? jd.replacement! : jd
  }
  try {
    if (Date.now() - Date.parse(version.processing.startedAt) >= 5 * 60_000) {
      await update({
        processing: null,
        error: 'Processing was interrupted. Retry the retained source.',
      })
      return
    }
    if (version.processing.stage === 'extracting') {
      const text = await retrieveText(version.source.url!)
      await update({
        source: { ...version.source, text },
        processing: { ...version.processing, stage: 'structuring' },
      })
    }
    if (!version.processing) return
    const result = await structureJd(version.source.text)
    if (result.assessment !== 'single')
      throw new JdError(
        result.assessment === 'multiple'
          ? 'Paste one specific job ad instead of multiple jobs.'
          : 'This does not describe a job. Paste a job ad.',
      )
    await update({
      content: result.content,
      warnings: result.warnings,
      findings: evidenceFindings(result.content, version.source),
      processing: null,
      error: null,
    })
  } catch (error) {
    try {
      await update({
        processing: null,
        error:
          error instanceof Error
            ? error.message
            : 'Processing failed. Please retry.',
      })
    } catch {
      /* Deleted or superseded attempts must never recreate or overwrite a JD. */
    }
  }
}
export async function reviewJd(
  id: string,
  userId: string,
  input: {
    action: string
    revision: string
    content?: unknown
    replacement?: boolean
  },
): Promise<Jd> {
  const jd = await getJd(id, userId)
  if (jd._rev !== input.revision)
    throw new JdError(
      'This JD changed. Reload and review before trying again.',
      409,
    )
  const version = input.replacement ? jd.replacement : jd
  if (!version || version.processing || !version.content)
    throw new JdError('Wait for successful processing before reviewing.', 409)
  const content =
    input.action === 'confirm'
      ? version.content
      : ContentSchema.parse(input.content)
  let findings = evidenceFindings(content, version.source)
  if (input.action !== 'confirm') {
    try {
      findings = [
        ...findings,
        ...(await validateSupport(version.source.text, content)),
      ]
    } catch {
      throw new JdError(
        'Support validation is unavailable. Keep your edits and retry.',
        503,
      )
    }
  } else findings = [...findings, ...version.findings]
  const confirm = input.action !== 'save'
  if (confirm && findings.length) throw new JdError(findings.join(' '), 422)
  if (input.replacement)
    return writeJd(jd, { replacement: { ...version, content, findings } })
  return writeJd(jd, {
    content,
    findings,
    readiness: confirm ? 'ready' : 'needs_review',
  })
}

export async function retryJd(
  id: string,
  userId: string,
  revision: string,
): Promise<Jd> {
  const jd = await getJd(id, userId)
  if (jd._rev !== revision)
    throw new JdError('This JD changed. Reload before retrying.', 409)
  if (jd.processing || jd.content)
    throw new JdError('This import is not eligible for retry.', 409)
  if (jd.attempts >= 5)
    throw new JdError(
      'Five processing attempts failed. Create a new import with corrected input.',
    )
  TextSchema.parse(jd.source.text)
  return writeJd(jd, {
    error: null,
    attempts: jd.attempts + 1,
    processing: {
      id: randomUUID(),
      startedAt: new Date().toISOString(),
      stage: 'structuring',
      attempt: jd.attempts + 1,
    },
  })
}

export async function pasteFallback(
  id: string,
  userId: string,
  revision: string,
  text: unknown,
): Promise<Jd> {
  const jd = await getJd(id, userId)
  if (jd._rev !== revision)
    throw new JdError('This JD changed. Reload before pasting.', 409)
  if (jd.processing || jd.content || !jd.source.url || jd.source.text)
    throw new JdError(
      'Pasted fallback is only available for failed URL extraction.',
      409,
    )
  return writeJd(jd, {
    source: {
      ...jd.source,
      id: randomUUID(),
      text: TextSchema.parse(text),
      origin: 'pasted',
    },
    error: null,
    attempts: 1,
    processing: {
      id: randomUUID(),
      startedAt: new Date().toISOString(),
      stage: 'structuring',
      attempt: 1,
    },
  })
}

export async function duplicateJd(
  userId: string,
  input: string,
): Promise<string | undefined> {
  const matches = await getJdClient().fetch<Jd[]>(
    '*[_type == "jd" && userId == $userId && source.url == $url]',
    { userId, url: normalizeUrl(input) },
  )
  return matches[0]?._id
}

export async function replacementJd(
  id: string,
  userId: string,
  revision: string,
  action: 'reprocess' | 'refetch' | 'accept' | 'reject',
): Promise<Jd> {
  const jd = await getJd(id, userId)
  if (jd._rev !== revision)
    throw new JdError(
      'This JD changed. Reload and review before continuing.',
      409,
    )
  if (action === 'reject') {
    if (!jd.replacement) throw new JdError('No replacement to reject.', 409)
    return writeJd(jd, { replacement: null })
  }
  if (action === 'accept') {
    const version = jd.replacement
    if (!version?.content || version.processing || version.error)
      throw new JdError('The replacement is not ready for review.', 409)
    const findings = [
      ...version.findings,
      ...evidenceFindings(version.content, version.source),
    ]
    if (findings.length) throw new JdError(findings.join(' '), 422)
    return writeJd(jd, { ...version, readiness: 'ready', replacement: null })
  }
  if (!jd.content || jd.processing || jd.replacement)
    throw new JdError(
      'Review or reject the existing replacement before starting another.',
      409,
    )
  if (action === 'refetch' && !jd.source.url)
    throw new JdError('This JD has no URL to refresh.')
  return writeJd(jd, {
    replacement: {
      source: {
        ...jd.source,
        id: randomUUID(),
        ...(action === 'refetch'
          ? { text: '', origin: 'fetched' as const }
          : {}),
      },
      content: null,
      warnings: [],
      findings: [],
      error: null,
      processing: {
        id: randomUUID(),
        startedAt: new Date().toISOString(),
        stage: action === 'refetch' ? 'extracting' : 'structuring',
        attempt: 1,
      },
    },
  })
}
export async function deleteJd(id: string, userId: string): Promise<void> {
  await getJd(id, userId)
  const client = getJdClient()
  await client.delete({
    query: '*[userId == $userId && ((_type == "cvMatch" && jd._ref == $id) || (_type == "matchJob" && jdId == $id))]',
    params: { userId, id },
  })
  await client.delete(id)
}
