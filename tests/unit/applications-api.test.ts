// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET as listHandler, POST as createHandler } from '@/app/api/applications/route'
import {
  GET as getHandler,
  PATCH as updateHandler,
  DELETE as deleteHandler,
} from '@/app/api/applications/[id]/route'
import { POST as tailorHandler } from '@/app/api/applications/[id]/tailor/route'
import { POST as coverLetterHandler } from '@/app/api/applications/[id]/cover-letter/route'
import { POST as rescoreHandler } from '@/app/api/applications/[id]/rescore/route'
import {
  getMockSanityClient,
  resetMockSanityClient,
} from '@/sanity/lib/server-client'

const { generate } = vi.hoisted(() => ({ generate: vi.fn() }))
vi.mock('@/sanity/lib/agent-client', () => ({
  getSanityAgentClient: () => ({ agent: { action: { generate } } }),
}))

let mockSessionUser: { id: string; email: string; name: string } | null = null

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('@/modules/auth/server', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockImplementation(() => {
        if (!mockSessionUser) return Promise.resolve(null)
        return Promise.resolve({
          user: mockSessionUser,
          session: { id: 'sess_1', userId: mockSessionUser.id },
        })
      }),
    },
  },
}))

describe('Applications API Routes', () => {
  const userId = 'user_api_tester'

  beforeEach(() => {
    resetMockSanityClient()
    vi.stubEnv('SANITY_AGENT_SCHEMA_ID', 'test-schema')
    mockSessionUser = {
      id: userId,
      email: 'tester@example.com',
      name: 'API Tester',
    }
    generate.mockReset()
    generate.mockResolvedValue({
      personalInfo: { fullName: 'API Tester' },
      summary: 'Tailored Summary',
      sections: [],
      coverLetter: 'Dear Hiring Manager,\n\nGenerated letter.',
    })
  })

  afterEach(() => vi.unstubAllEnvs())

  it('rejects unauthenticated requests with 401', async () => {
    mockSessionUser = null
    const res = await listHandler()
    expect(res.status).toBe(401)
  })

  it('creates an application and returns 201', async () => {
    const client = getMockSanityClient()
    const jd = await client.create({
      _type: 'jd',
      userId,
      readiness: 'ready',
      source: { text: 'Role text', origin: 'pasted' },
      content: {
        fields: [
          { category: 'title', text: 'Software Engineer' },
          { category: 'company', text: 'Global Corp' },
        ],
        requirements: [],
      },
    })
    const cv = await client.create({
      _type: 'cv',
      userId,
      title: 'Baseline CV',
      ingestionStatus: 'ready',
      personalInfo: {},
      sections: [],
    })

    const req = new Request('http://localhost/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jdId: jd._id,
        cvId: cv._id,
      }),
    })

    const res = await createHandler(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.application._id).toBeDefined()
    expect(data.application.title).toBe('Software Engineer at Global Corp')

    // Retrieve via GET detail route
    const getReq = new Request(`http://localhost/api/applications/${data.application._id}`)
    const getRes = await getHandler(getReq, {
      params: Promise.resolve({ id: data.application._id }),
    })
    expect(getRes.status).toBe(200)
    const getData = await getRes.json()
    expect(getData.application._id).toBe(data.application._id)

    // Update via PATCH route
    const patchReq = new Request(`http://localhost/api/applications/${data.application._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'interviewing' }),
    })
    const patchRes = await updateHandler(patchReq, {
      params: Promise.resolve({ id: data.application._id }),
    })
    expect(patchRes.status).toBe(200)
    const patchData = await patchRes.json()
    expect(patchData.application.status).toBe('interviewing')

    // Generate Cover Letter via route
    const coverReq = new Request(
      `http://localhost/api/applications/${data.application._id}/cover-letter`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone: 'executive' }),
      }
    )
    const coverRes = await coverLetterHandler(coverReq, {
      params: Promise.resolve({ id: data.application._id }),
    })
    expect(coverRes.status).toBe(200)
    const coverData = await coverRes.json()
    expect(coverData.application.coverLetter).toContain('Dear Hiring Manager')

    // Tailor CV via route
    const tailorReq = new Request(
      `http://localhost/api/applications/${data.application._id}/tailor`,
      { method: 'POST' }
    )
    const tailorRes = await tailorHandler(tailorReq, {
      params: Promise.resolve({ id: data.application._id }),
    })
    expect(tailorRes.status).toBe(200)
    const tailorData = await tailorRes.json()
    expect(tailorData.application.tailoringStatus).toBe('completed')

    // Rescore CV via route
    const rescoreReq = new Request(
      `http://localhost/api/applications/${data.application._id}/rescore`,
      { method: 'POST' }
    )
    const rescoreRes = await rescoreHandler(rescoreReq, {
      params: Promise.resolve({ id: data.application._id }),
    })
    expect(rescoreRes.status).toBe(200)

    // Delete via DELETE route
    const delReq = new Request(`http://localhost/api/applications/${data.application._id}`, {
      method: 'DELETE',
    })
    const delRes = await deleteHandler(delReq, {
      params: Promise.resolve({ id: data.application._id }),
    })
    expect(delRes.status).toBe(200)
  })
})
