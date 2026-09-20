// @vitest-environment node
import { EventEmitter } from 'node:events'
import { PassThrough } from 'node:stream'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
import { POST as importJd } from '@/app/api/jds/import/route'
import { POST as action } from '@/app/api/jds/[id]/actions/route'
import { GET as detail, DELETE as deleteJd } from '@/app/api/jds/[id]/route'

const state = vi.hoisted(() => ({
  user: 'user-a' as string | null,
  jobs: [] as (() => Promise<void>)[],
  generate: vi.fn(),
  docs: new Map<string, Record<string, unknown>>(),
  revision: 0,
  address: '93.184.216.34',
  pages: [] as { status?: number; location?: string; body: string }[],
}))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('@/modules/auth/server', () => ({
  auth: {
    api: {
      getSession: async () =>
        state.user ? { user: { id: state.user } } : null,
    },
  },
}))
vi.mock('next/server', async (original) => ({
  ...(await original<typeof import('next/server')>()),
  after: (job: () => Promise<void>) => state.jobs.push(job),
}))
vi.mock('@/sanity/lib/agent-client', () => ({
  getSanityAgentClient: () => ({
    agent: { action: { generate: state.generate } },
  }),
}))
vi.mock('@/sanity/lib/jd-client', () => ({
  getJdClient: () => ({
    fetch: async (_query: string, params: Record<string, string>) => {
      const docs = [...state.docs.values()].filter(
        (d) =>
          d.userId === params.userId &&
          (!params.id || d._id === params.id) &&
          (!params.url || (d.source as { url?: string }).url === params.url),
      )
      return params.id
        ? structuredClone(docs[0] ?? null)
        : structuredClone(docs)
    },
    create: async (doc: Record<string, unknown>) => {
      const saved = { ...doc, _rev: String(++state.revision) }
      state.docs.set(String(doc._id), saved)
      return structuredClone(saved)
    },
    patch: (id: string) => {
      let revision = ''
      let fields = {}
      const patch = {
        ifRevisionId: (rev: string) => {
          revision = rev
          return patch
        },
        set: (value: object) => {
          fields = value
          return patch
        },
        commit: async () => {
          const old = state.docs.get(id)
          if (!old || old._rev !== revision)
            throw Object.assign(new Error('Conflict'), { statusCode: 409 })
          const saved = { ...old, ...fields, _rev: String(++state.revision) }
          state.docs.set(id, saved)
          return structuredClone(saved)
        },
      }
      return patch
    },
    delete: async (id: string) => {
      state.docs.delete(id)
    },
  }),
}))
vi.mock('node:dns/promises', () => ({
  lookup: async () => [{ address: state.address, family: 4 }],
}))
vi.mock('node:https', () => ({
  request: (
    _url: URL,
    _options: unknown,
    callback: (response: PassThrough) => void,
  ) => {
    const req = new EventEmitter() as EventEmitter & {
      end: () => void
      destroy: (error?: Error) => void
    }
    req.destroy = (error) => {
      if (error) req.emit('error', error)
    }
    req.end = () => {
      const page = state.pages.shift() ?? { body: '', status: 403 }
      const response = Object.assign(new PassThrough(), {
        statusCode: page.status ?? 200,
        headers: { 'content-type': 'text/html', location: page.location },
      })
      callback(response)
      response.end(page.body)
    }
    return req
  },
}))
const source =
  'React developer. React required. Degree or equivalent experience. Five years overall including two in React.'
const content = {
  fields: [
    {
      _key: 'title',
      category: 'title',
      text: 'React developer',
      evidence: ['React developer'],
    },
  ],
  requirements: [
    {
      _key: 'react',
      category: 'skills',
      text: 'React',
      classification: 'required',
      evidence: ['React required'],
      groupId: undefined,
    },
  ],
  groups: [],
}
const result = { assessment: 'single', warnings: [], content }
const request = (body: unknown, method = 'POST') =>
  new Request('http://localhost/api/jds', {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
const context = (id: string) => ({ params: Promise.resolve({ id }) })
async function read(id: string) {
  return detail(new Request('http://localhost'), context(id))
}
async function drain() {
  for (const job of state.jobs.splice(0)) await job()
}
beforeEach(() => {
  state.address = '93.184.216.34'
  state.pages = []
  state.user = 'user-a'
  state.docs.clear()
  state.jobs = []
  state.generate.mockReset().mockResolvedValue(result)
  vi.stubEnv('SANITY_JD_AGENT_SCHEMA_ID', 'deployed-jd-schema')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.useRealTimers()
})
it('imports text, retains exact evidence and requires human review', async () => {
  const response = await importJd(request({ text: source }))
  expect(response.status).toBe(201)
  const { jd } = await response.json()
  expect(jd.processing.stage).toBe('structuring')
  await drain()
  const saved = (await (await read(jd._id)).json()).jd
  expect(saved.source.text).toBe(source)
  expect(saved.content.fields[0].text).toBe('React developer')
  expect(saved.readiness).toBe('needs_review')
  expect(saved.processing).toBeNull()
})
it('validates input and isolates every private read', async () => {
  for (const text of ['', ' ', 'x'.repeat(50001)])
    expect((await importJd(request({ text }))).status).toBe(400)
  expect((await importJd(request({ text: 'x'.repeat(50000) }))).status).toBe(
    201,
  )
  const { jd } = await (await importJd(request({ text: source }))).json()
  state.user = 'user-b'
  expect((await read(jd._id)).status).toBe(404)
  state.user = null
  expect((await read(jd._id)).status).toBe(401)
  expect((await importJd(request({ text: source }))).status).toBe(401)
})
it.each(['multiple', 'unrelated', 'malformed'])(
  'rejects %s agent results without losing source',
  async (assessment) => {
    state.generate.mockResolvedValue(
      assessment === 'malformed' ? { content: {} } : { ...result, assessment },
    )
    const { jd } = await (await importJd(request({ text: source }))).json()
    await drain()
    const saved = (await (await read(jd._id)).json()).jd
    expect(saved.content).toBeNull()
    expect(saved.source.text).toBe(source)
    expect(saved.error).toBeTruthy()
  },
)

async function act(id: string, body: unknown) {
  return action(request(body), context(id))
}
async function imported() {
  const { jd } = await (await importJd(request({ text: source }))).json()
  await drain()
  return (await (await read(jd._id)).json()).jd
}
it('confirms review, invalidates readiness on edits, and rejects unsupported or stale confirmation', async () => {
  let jd = await imported()
  let response = await act(jd._id, { action: 'confirm', revision: jd._rev })
  expect(response.status).toBe(200)
  jd = (await response.json()).jd
  expect(jd.readiness).toBe('ready')
  const oldRevision = jd._rev
  state.generate.mockResolvedValue({
    findings: ['title: The source does not support Chief Executive.'],
  })
  const edited = {
    ...content,
    fields: [{ ...content.fields[0], text: 'Chief Executive' }],
  }
  response = await act(jd._id, {
    action: 'save',
    revision: jd._rev,
    content: edited,
  })
  expect(response.status).toBe(200)
  jd = (await response.json()).jd
  expect(jd.readiness).toBe('needs_review')
  expect(jd.findings[0]).toContain('Chief Executive')
  expect(
    (await act(jd._id, { action: 'confirm', revision: jd._rev })).status,
  ).toBe(422)
  expect(
    (await act(jd._id, { action: 'save', revision: oldRevision, content }))
      .status,
  ).toBe(409)
  state.generate.mockResolvedValue({ findings: [] })
  response = await act(jd._id, {
    action: 'saveConfirm',
    revision: jd._rev,
    content,
  })
  expect((await response.json()).jd.readiness).toBe('ready')
})
it('expires interrupted attempts and retries retained text without allowing late writes', async () => {
  vi.useFakeTimers()
  const { jd } = await (await importJd(request({ text: source }))).json()
  const staleJob = state.jobs.shift()!
  vi.advanceTimersByTime(6 * 60_000)
  const expired = (await (await read(jd._id)).json()).jd
  expect(expired.processing).toBeNull()
  expect(expired.error).toMatch(/interrupted/i)
  expect(
    (await act(jd._id, { action: 'retry', revision: expired._rev })).status,
  ).toBe(200)
  await drain()
  state.generate.mockResolvedValue({
    ...result,
    content: { ...content, fields: [] },
  })
  await staleJob()
  const saved = (await (await read(jd._id)).json()).jd
  expect(saved.content.fields[0].text).toBe('React developer')
  expect(saved.source.text).toBe(source)
})

it('extracts a JobPosting URL and recovers blocked URLs by pasting into the same import', async () => {
  state.pages.push({
    body:
      '<script type="application/ld+json">' +
      JSON.stringify({
        '@type': 'JobPosting',
        title: 'React developer',
        description: '<p>React required</p>',
      }) +
      '</script>',
  })
  const response = await importJd(request({ url: 'https://jobs.example/role' }))
  expect(response.status).toBe(201)
  const { jd } = await response.json()
  await drain()
  let saved = (await (await read(jd._id)).json()).jd
  expect(saved.source.text).toContain('React required')
  expect(saved.source.origin).toBe('fetched')
  const failed = (
    await (
      await importJd(request({ url: 'https://jobs.example/blocked' }))
    ).json()
  ).jd
  await drain()
  saved = (await (await read(failed._id)).json()).jd
  expect(saved.error).toBeTruthy()
  const fallback = await act(saved._id, {
    action: 'paste',
    revision: saved._rev,
    text: source,
  })
  expect(fallback.status).toBe(200)
  await drain()
  saved = (await (await read(failed._id)).json()).jd
  expect(saved.source.origin).toBe('pasted')
  expect(saved.source.url).toBe('https://jobs.example/blocked')
  expect(saved.content).not.toBeNull()
})
it('warns about duplicate URLs only within the current library and creates independent copies', async () => {
  const first = (
    await (
      await importJd(request({ url: 'https://jobs.example/role?job=1#top' }))
    ).json()
  ).jd
  const duplicate = await importJd(
    request({ url: 'https://jobs.example/role?job=1' }),
  )
  expect(duplicate.status).toBe(409)
  expect((await duplicate.json()).existingId).toBe(first._id)
  const copy = await importJd(
    request({ url: 'https://jobs.example/role?job=1', allowDuplicate: true }),
  )
  expect(copy.status).toBe(201)
  expect((await copy.json()).jd._id).not.toBe(first._id)
  expect(
    (await importJd(request({ url: 'https://jobs.example/role?job=2' })))
      .status,
  ).toBe(201)
  state.user = 'other-user'
  expect(
    (await importJd(request({ url: 'https://jobs.example/role?job=1' })))
      .status,
  ).toBe(201)
})
it('keeps ready work usable while a replacement is reviewed, then switches source and content together', async () => {
  let jd = await imported()
  jd = (
    await (await act(jd._id, { action: 'confirm', revision: jd._rev })).json()
  ).jd
  const currentSource = jd.source.id
  let response = await act(jd._id, { action: 'reprocess', revision: jd._rev })
  expect(response.status).toBe(200)
  jd = (await response.json()).jd
  expect(jd.readiness).toBe('ready')
  expect(jd.source.id).toBe(currentSource)
  expect(
    (await act(jd._id, { action: 'reprocess', revision: jd._rev })).status,
  ).toBe(409)
  await drain()
  jd = (await (await read(jd._id)).json()).jd
  const replacementSource = jd.replacement.source.id
  expect(jd.replacement.content).not.toBeNull()
  response = await act(jd._id, { action: 'accept', revision: jd._rev })
  jd = (await response.json()).jd
  expect(jd.readiness).toBe('ready')
  expect(jd.source.id).toBe(replacementSource)
  expect(jd.replacement).toBeNull()
})

it('deletes all retained content and cannot be recreated by late processing', async () => {
  const { jd } = await (await importJd(request({ text: source }))).json()
  state.user = 'other'
  expect(
    (
      await deleteJd(
        new Request('http://localhost', { method: 'DELETE' }),
        context(jd._id),
      )
    ).status,
  ).toBe(404)
  state.user = 'user-a'
  expect(
    (
      await deleteJd(
        new Request('http://localhost', { method: 'DELETE' }),
        context(jd._id),
      )
    ).status,
  ).toBe(200)
  await drain()
  expect((await read(jd._id)).status).toBe(404)
})
it('does not publish an expired attempt even before a status poll expires it', async () => {
  vi.useFakeTimers()
  const { jd } = await (await importJd(request({ text: source }))).json()
  vi.advanceTimersByTime(6 * 60_000)
  await drain()
  const saved = (await (await read(jd._id)).json()).jd
  expect(saved.content).toBeNull()
  expect(saved.error).toMatch(/interrupted/i)
})
it.each([
  '127.0.0.1',
  '10.0.0.1',
  '169.254.169.254',
  '192.168.1.2',
  '::1',
  '::ffff:127.0.0.1',
  'fc00::1',
])('blocks private resolved address %s', async (address) => {
  state.address = address
  const { jd } = await (
    await importJd(request({ url: 'https://jobs.example/private' }))
  ).json()
  await drain()
  const saved = (await (await read(jd._id)).json()).jd
  expect(saved.error).toMatch(/public internet/i)
  expect(saved.content).toBeNull()
})
it('checks redirect destinations and limits redirect chains', async () => {
  state.pages.push({
    status: 302,
    location: 'http://127.0.0.1/private',
    body: '',
  })
  const { jd } = await (
    await importJd(request({ url: 'https://jobs.example/redirect' }))
  ).json()
  await drain()
  expect((await (await read(jd._id)).json()).jd.error).toMatch(
    /public internet/i,
  )
  for (let i = 0; i < 5; i++)
    state.pages.push({
      status: 302,
      location: 'https://jobs.example/loop',
      body: '',
    })
  const loop = (
    await (await importJd(request({ url: 'https://jobs.example/loop' }))).json()
  ).jd
  await drain()
  expect((await (await read(loop._id)).json()).jd.error).toMatch(/redirects/i)
})
it('uses readable page content when no JobPosting exists and never executes scripts', async () => {
  state.pages.push({
    body:
      '<html><title>React developer</title><body><article><h1>React developer</h1><p>' +
      'React required. Develop applications with our team. '.repeat(20) +
      '</p></article><script>throw new Error("Do not execute")</script></body></html>',
  })
  const { jd } = await (
    await importJd(request({ url: 'https://jobs.example/article' }))
  ).json()
  await drain()
  const saved = (await (await read(jd._id)).json()).jd
  expect(saved.source.text).toContain('Develop applications')
  expect(saved.source.text).not.toContain('Do not execute')
  expect(saved.content).not.toBeNull()
})
it.each([
  [
    'multiple embedded jobs',
    '<script type="application/ld+json">' +
      JSON.stringify([
        { '@type': 'JobPosting', title: 'A', description: 'First role' },
        { '@type': 'JobPosting', title: 'B', description: 'Second role' },
      ]) +
      '</script>',
    /multiple jobs/i,
  ],
  [
    'oversized extracted text',
    '<script type="application/ld+json">' +
      JSON.stringify({
        '@type': 'JobPosting',
        description: 'x'.repeat(50001),
      }) +
      '</script>',
    /50,000/,
  ],
  ['oversized page', 'x'.repeat(2_000_001), /2 MB/],
  [
    'script-dependent page',
    '<html><body><script>renderJob()</script></body></html>',
    /Paste/,
  ],
])('rejects %s without a confirmable JD', async (_name, html, message) => {
  state.pages.push({ body: html })
  const { jd } = await (
    await importJd(request({ url: 'https://jobs.example/test' }))
  ).json()
  await drain()
  const saved = (await (await read(jd._id)).json()).jd
  expect(saved.content).toBeNull()
  expect(saved.error).toMatch(message)
})
it('preserves alternatives, nested experience, classifications, and non-English wording while dropping injected metadata', async () => {
  const rich = {
    fields: [],
    groups: [{ _key: 'alternative', operator: 'any' }],
    requirements: [
      {
        _key: 'degree',
        category: 'education',
        text: 'Degree',
        classification: 'preferred',
        evidence: ['Degree or equivalent experience'],
        groupId: 'alternative',
      },
      {
        _key: 'equivalent',
        category: 'experience',
        text: 'equivalent experience',
        classification: 'preferred',
        evidence: ['Degree or equivalent experience'],
        groupId: 'alternative',
      },
      {
        _key: 'overall',
        category: 'experience',
        text: 'Five years overall',
        classification: 'required',
        evidence: ['Five years overall including two in React'],
      },
      {
        _key: 'nested',
        category: 'experience',
        text: 'two in React',
        classification: 'required',
        evidence: ['Five years overall including two in React'],
        withinRequirementId: 'overall',
      },
      {
        _key: 'german',
        category: 'languages',
        text: 'Deutsch',
        classification: 'unspecified',
        evidence: ['Deutsch'],
      },
    ],
  }
  state.generate.mockResolvedValue({
    assessment: 'single',
    warnings: ['Company not stated'],
    content: rich,
    userId: 'attacker',
    readiness: 'ready',
    source: { text: 'injected' },
  })
  const { jd } = await (
    await importJd(request({ text: source + ' Deutsch' }))
  ).json()
  await drain()
  const saved = (await (await read(jd._id)).json()).jd
  expect(saved.content).toEqual(rich)
  expect(saved.userId).toBe('user-a')
  expect(saved.readiness).toBe('needs_review')
  expect(saved.source.text).toBe(source + ' Deutsch')
  expect(
    (await act(jd._id, { action: 'confirm', revision: saved._rev })).status,
  ).toBe(200)
})
it('blocks evidence mismatch and invalid relationship cycles', async () => {
  state.generate.mockResolvedValue({
    ...result,
    content: {
      ...content,
      fields: [{ ...content.fields[0], evidence: ['not in source'] }],
    },
  })
  let jd = await imported()
  expect(
    (await act(jd._id, { action: 'confirm', revision: jd._rev })).status,
  ).toBe(422)
  state.generate.mockResolvedValue(result)
  jd = await imported()
  expect(
    (
      await act(jd._id, {
        action: 'saveConfirm',
        revision: jd._rev,
        content: {
          ...content,
          groups: [{ _key: 'cycle', operator: 'any', parentGroupId: 'cycle' }],
        },
      })
    ).status,
  ).toBe(400)
})
it.each([
  'save',
  'confirm',
  'saveConfirm',
  'retry',
  'paste',
  'reprocess',
  'refetch',
  'accept',
  'reject',
])('protects %s from unauthenticated and foreign users', async (actionName) => {
  const jd = await imported()
  const body = { action: actionName, revision: jd._rev, content, text: source }
  state.user = 'other'
  expect((await act(jd._id, body)).status).toBe(404)
  expect((await act('missing-id', body)).status).toBe(404)
  state.user = null
  expect((await act(jd._id, body)).status).toBe(401)
})
it('preserves current ready work across failed replacement and rejection', async () => {
  let jd = await imported()
  jd = (
    await (await act(jd._id, { action: 'confirm', revision: jd._rev })).json()
  ).jd
  const previous = { source: jd.source, content: jd.content }
  await act(jd._id, { action: 'reprocess', revision: jd._rev })
  state.generate.mockRejectedValue(new Error('Agent unavailable'))
  await drain()
  jd = (await (await read(jd._id)).json()).jd
  expect(jd.readiness).toBe('ready')
  expect({ source: jd.source, content: jd.content }).toEqual(previous)
  expect(jd.replacement.error).toContain('Agent unavailable')
  jd = (
    await (await act(jd._id, { action: 'reject', revision: jd._rev })).json()
  ).jd
  expect(jd.replacement).toBeNull()
  expect(jd.readiness).toBe('ready')
})
it('refetches only when explicitly requested and atomically accepts the new source', async () => {
  const page = (text: string) => ({
    body:
      '<script type="application/ld+json">' +
      JSON.stringify({ '@type': 'JobPosting', description: text }) +
      '</script>',
  })
  state.pages.push(page(source))
  let jd = (
    await (
      await importJd(request({ url: 'https://jobs.example/fresh' }))
    ).json()
  ).jd
  await drain()
  jd = (await (await read(jd._id)).json()).jd
  const oldText = jd.source.text
  await act(jd._id, { action: 'reprocess', revision: jd._rev })
  await drain()
  jd = (await (await read(jd._id)).json()).jd
  expect(jd.replacement.source.text).toBe(oldText)
  jd = (
    await (await act(jd._id, { action: 'reject', revision: jd._rev })).json()
  ).jd
  state.pages.push(page(source + ' Updated ad.'))
  await act(jd._id, { action: 'refetch', revision: jd._rev })
  await drain()
  jd = (await (await read(jd._id)).json()).jd
  expect(jd.source.text).toBe(oldText)
  expect(jd.replacement.source.text).toContain('Updated ad.')
  jd = (
    await (await act(jd._id, { action: 'accept', revision: jd._rev })).json()
  ).jd
  expect(jd.source.text).toContain('Updated ad.')
  expect(jd.readiness).toBe('ready')
})
it('rejects stale replacement acceptance after concurrent current-content edits', async () => {
  let jd = await imported()
  await act(jd._id, { action: 'reprocess', revision: jd._rev })
  await drain()
  jd = (await (await read(jd._id)).json()).jd
  const oldRevision = jd._rev
  state.generate.mockResolvedValue({ findings: [] })
  const updated = (
    await (
      await act(jd._id, { action: 'save', revision: jd._rev, content })
    ).json()
  ).jd
  expect(
    (await act(jd._id, { action: 'accept', revision: oldRevision })).status,
  ).toBe(409)
  expect((await (await read(jd._id)).json()).jd._rev).toBe(updated._rev)
})
it('retains fetched text when structuring fails and retries without retrieval', async () => {
  state.pages.push({
    body:
      '<script type="application/ld+json">' +
      JSON.stringify({ '@type': 'JobPosting', description: source }) +
      '</script>',
  })
  state.generate.mockRejectedValue(new Error('Temporary failure'))
  const { jd } = await (
    await importJd(request({ url: 'https://jobs.example/retry' }))
  ).json()
  await drain()
  let saved = (await (await read(jd._id)).json()).jd
  expect(saved.source.text).toContain(source)
  state.generate.mockResolvedValue(result)
  await act(jd._id, { action: 'retry', revision: saved._rev })
  await drain()
  saved = (await (await read(jd._id)).json()).jd
  expect(saved.content).not.toBeNull()
  expect(saved.readiness).toBe('needs_review')
})
it('deleting a JD with an in-flight replacement removes it permanently', async () => {
  const jd = await imported()
  await act(jd._id, { action: 'reprocess', revision: jd._rev })
  expect(
    (
      await deleteJd(
        new Request('http://localhost', { method: 'DELETE' }),
        context(jd._id),
      )
    ).status,
  ).toBe(200)
  await drain()
  expect((await read(jd._id)).status).toBe(404)
})
