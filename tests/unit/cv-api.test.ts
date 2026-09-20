import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as importHandler } from '@/app/api/cvs/import/route'
import { GET as statusHandler } from '@/app/api/cvs/[id]/status/route'
import { GET as listHandler } from '@/app/api/cvs/route'
import { DELETE as deleteHandler } from '@/app/api/cvs/[id]/route'
import { resetMockSanityClient } from '@/sanity/lib/server-client'

vi.mock('@/sanity/lib/agent-client', () => ({
  getSanityAgentClient: () => ({
    agent: { action: { generate: vi.fn().mockResolvedValue({
      personalInfo: { fullName: 'Tester User' }, summary: '', sections: [],
    }) } },
  }),
}))

// Mock session state
let mockSessionUser: { id: string; email: string; name: string } | null = null

vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}))

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>()
  return {
    ...actual,
    after: vi.fn((cb: () => Promise<void> | void) => {
      Promise.resolve().then(() => {
        try {
          cb()
        } catch {}
      })
    }),
  }
})

vi.mock('@/modules/auth/server', () => ({
  auth: {
    api: {
      getSession: vi.fn().mockImplementation(() => {
        if (!mockSessionUser) return Promise.resolve(null)
        return Promise.resolve({
          user: mockSessionUser,
          session: { id: 'sess_123', userId: mockSessionUser.id },
        })
      }),
    },
  },
}))

describe('CVs API Route Integration Tests', () => {
  beforeEach(() => {
    resetMockSanityClient()
    vi.stubEnv('SANITY_AGENT_SCHEMA_ID', 'test-schema')
    mockSessionUser = {
      id: 'user_tester_99',
      email: 'test@example.com',
      name: 'Tester User',
    }
  })

  afterEach(() => vi.unstubAllEnvs())

  it('rejects unauthenticated import requests with 401', async () => {
    mockSessionUser = null

    const req = new NextRequest('http://localhost:3000/api/cvs/import', {
      method: 'POST',
      body: JSON.stringify({ rawText: 'Sample text' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await importHandler(req)
    expect(res.status).toBe(401)
  })

  it('creates CV from JSON rawText import and returns 201 with status extracting', async () => {
    const req = new NextRequest('http://localhost:3000/api/cvs/import', {
      method: 'POST',
      body: JSON.stringify({
        title: 'API Test CV',
        rawText: 'Alice Developer\nalice@test.com',
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await importHandler(req)
    expect(res.status).toBe(201)

    const json = await res.json()
    expect(json.cvId).toBeDefined()
    expect(json.status).toBe('extracting')
    expect(json.isPrimary).toBe(true)
    expect(json.title).toBe('API Test CV')
  })

  it('rejects import requests with empty body with 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/cvs/import', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await importHandler(req)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toMatch(/provide either a document file or raw text/)
  })

  it('polls status for created CV', async () => {
    // 1. Create CV
    const importReq = new NextRequest('http://localhost:3000/api/cvs/import', {
      method: 'POST',
      body: JSON.stringify({ rawText: 'Status Test\nstatus@test.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const importRes = await importHandler(importReq)
    const { cvId } = await importRes.json()

    // 2. Poll status
    const statusReq = new NextRequest(
      `http://localhost:3000/api/cvs/${cvId}/status`
    )
    const statusRes = await statusHandler(statusReq, {
      params: Promise.resolve({ id: cvId }),
    })

    expect(statusRes.status).toBe(200)
    const statusJson = await statusRes.json()
    expect(statusJson._id).toBe(cvId)
    expect(['extracting', 'structuring', 'ready']).toContain(
      statusJson.ingestionStatus
    )
  })

  it('lists user CVs at GET /api/cvs', async () => {
    // Create two CVs
    await importHandler(
      new NextRequest('http://localhost:3000/api/cvs/import', {
        method: 'POST',
        body: JSON.stringify({ rawText: 'First CV' }),
        headers: { 'Content-Type': 'application/json' },
      })
    )
    await importHandler(
      new NextRequest('http://localhost:3000/api/cvs/import', {
        method: 'POST',
        body: JSON.stringify({ rawText: 'Second CV' }),
        headers: { 'Content-Type': 'application/json' },
      })
    )

    const listRes = await listHandler()
    expect(listRes.status).toBe(200)

    const json = await listRes.json()
    expect(json.cvs.length).toBe(2)
  })

  it('deletes user CV at DELETE /api/cvs/[id]', async () => {
    const importReq = new NextRequest('http://localhost:3000/api/cvs/import', {
      method: 'POST',
      body: JSON.stringify({ rawText: 'CV to be deleted' }),
      headers: { 'Content-Type': 'application/json' },
    })
    const importRes = await importHandler(importReq)
    const { cvId } = await importRes.json()

    const delReq = new NextRequest(`http://localhost:3000/api/cvs/${cvId}`, {
      method: 'DELETE',
    })
    const delRes = await deleteHandler(delReq, {
      params: Promise.resolve({ id: cvId }),
    })
    expect(delRes.status).toBe(200)

    // Subsequent status check returns 404
    const statusRes = await statusHandler(
      new NextRequest(`http://localhost:3000/api/cvs/${cvId}/status`),
      { params: Promise.resolve({ id: cvId }) }
    )
    expect(statusRes.status).toBe(404)
  })
})
