import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createCvFromImport,
  deleteCv,
  getCvById,
  pollCvStatus,
  processCvBackground,
  retryCvStructuring,
  setPrimaryCv,
  updateCv,
  CvNotFoundError,
} from '@/modules/cvs/service'
import { resetMockSanityClient } from '@/sanity/lib/server-client'

const { generate } = vi.hoisted(() => ({ generate: vi.fn() }))
vi.mock('@/sanity/lib/agent-client', () => ({
  getSanityAgentClient: () => ({ agent: { action: { generate } } }),
}))

describe('CVs Service & Multi-Tenancy Tests', () => {
  beforeEach(() => {
    resetMockSanityClient()
    vi.stubEnv('SANITY_AGENT_SCHEMA_ID', 'test-schema')
    generate.mockReset()
    generate.mockResolvedValue({
      personalInfo: { fullName: 'Jane Doe', email: 'jane@example.com' },
      summary: '',
      sections: [{ _key: 'skills', _type: 'skillsSection', groups: [] }],
    })
  })

  afterEach(() => vi.unstubAllEnvs())

  const userA = 'user_alice_123'
  const userB = 'user_bob_456'

  it('creates CV from raw text and assigns isPrimary: true to the first CV', async () => {
    const rawText = 'Alice Smith\nFullstack Engineer\nalice@example.com\n\nExperience\nSoftware Engineer at Tech Corp\n• Built Next.js app'
    const cv = await createCvFromImport(userA, {
      title: 'Alice First CV',
      rawText,
    })

    expect(cv._id).toBeDefined()
    expect(cv.title).toBe('Alice First CV')
    expect(cv.userId).toBe(userA)
    expect(cv.isPrimary).toBe(true)
    expect(cv.ingestionStatus).toBe('extracting')
    expect(cv.rawText).toBe(rawText)
  })

  it('assigns isPrimary: false to subsequent CVs for the same user', async () => {
    await createCvFromImport(userA, {
      title: 'First CV',
      rawText: 'Alice Smith\nFirst CV Text',
    })

    const secondCv = await createCvFromImport(userA, {
      title: 'Second CV',
      rawText: 'Alice Smith\nSecond CV Text',
    })

    expect(secondCv.isPrimary).toBe(false)
  })

  it('enforces multi-tenancy: User A cannot read or mutate User B CV', async () => {
    const bobCv = await createCvFromImport(userB, {
      title: 'Bob Secret CV',
      rawText: 'Bob Builder\nArchitect\nbob@example.com',
    })

    // User A trying to get Bob's CV should fail
    await expect(getCvById(bobCv._id, userA)).rejects.toThrow(CvNotFoundError)

    // User A trying to delete Bob's CV should fail
    await expect(deleteCv(bobCv._id, userA)).rejects.toThrow(CvNotFoundError)

    // User A trying to update Bob's CV should fail
    await expect(
      updateCv(bobCv._id, userA, { title: 'Hacked' })
    ).rejects.toThrow(CvNotFoundError)
  })

  it('processes structuring in background: transitions from extracting -> structuring -> ready', async () => {
    const rawText = `Jane Doe
Senior Product Designer
jane@example.com

Summary
Passionate design leader with 8+ years experience.

Experience
Lead Designer at Acme Studio
• Redesigned web app and increased conversions

Education
Stanford University
• B.S. in Design

Skills
Figma, Design Systems, User Research`

    const cv = await createCvFromImport(userA, {
      title: 'Jane CV',
      rawText,
    })

    const processed = await processCvBackground(cv._id, rawText)

    expect(processed.ingestionStatus).toBe('ready')
    expect(processed.personalInfo?.fullName).toBe('Jane Doe')
    expect(processed.personalInfo?.email).toBe('jane@example.com')
    expect(processed.sections?.length).toBeGreaterThan(0)

    // Polling status returns ready
    const status = await pollCvStatus(cv._id, userA)
    expect(status.ingestionStatus).toBe('ready')
  })

  it('limits generation to content and prevents returned metadata from overwriting ownership', async () => {
    const cv = await createCvFromImport(userA, { rawText: 'Jane Doe', title: 'Original' })
    generate.mockResolvedValueOnce({
      personalInfo: { fullName: 'Jane Doe' }, summary: '', sections: [],
      userId: userB, title: 'Changed', rawText: 'Changed', isPrimary: false,
    })
    const result = await processCvBackground(cv._id, 'Jane Doe')
    expect(generate).toHaveBeenCalledWith(expect.objectContaining({
      schemaId: 'test-schema', noWrite: true,
      targetDocument: { operation: 'create', _type: 'cv' },
      instructionParams: { rawText: { type: 'constant', value: 'Jane Doe' } },
      target: [
        { path: 'personalInfo', operation: 'set' },
        { path: 'summary', operation: 'set' },
        { path: 'sections', operation: 'set', maxPathDepth: 8 },
      ],
    }))
    expect(result).toMatchObject({ userId: userA, title: 'Original', rawText: 'Jane Doe', isPrimary: true })
  })

  it.each([
    ['API failure', () => generate.mockRejectedValueOnce(new Error('Agent unavailable'))],
    ['malformed content', () => generate.mockResolvedValueOnce({ personalInfo: {}, summary: '', sections: [{ _type: 'unknown' }] })],
    ['missing nested items', () => generate.mockResolvedValueOnce({ personalInfo: {}, summary: '', sections: [{ _key: 'work', _type: 'workExperienceSection' }] })],
    ['missing schema', () => vi.stubEnv('SANITY_AGENT_SCHEMA_ID', '')],
  ])('preserves raw text and marks failed on %s', async (_label, setup) => {
    const cv = await createCvFromImport(userA, { rawText: 'Jane Doe' })
    setup()
    await expect(processCvBackground(cv._id, 'Jane Doe')).rejects.toThrow()
    const failed = await getCvById(cv._id, userA)
    expect(failed).toMatchObject({ ingestionStatus: 'failed', rawText: 'Jane Doe' })
    expect(failed.errorMessage).toBeTruthy()
    expect(failed.personalInfo).toBeUndefined()
  })

  it('recovers from an Agent Action failure using retained source text', async () => {
    const cv = await createCvFromImport(userA, { rawText: 'Jane Doe' })
    generate.mockRejectedValueOnce(new Error('Agent unavailable'))
    await expect(processCvBackground(cv._id, 'Jane Doe')).rejects.toThrow('Agent unavailable')
    const retried = await retryCvStructuring(cv._id, userA)
    expect(retried).toMatchObject({ ingestionStatus: 'ready', errorMessage: null, rawText: 'Jane Doe' })
    expect(generate).toHaveBeenCalledTimes(2)
  })

  it('switches Primary CV cleanly across user documents', async () => {
    const cv1 = await createCvFromImport(userA, {
      title: 'CV 1',
      rawText: 'Text 1',
    })
    const cv2 = await createCvFromImport(userA, {
      title: 'CV 2',
      rawText: 'Text 2',
    })

    expect(cv1.isPrimary).toBe(true)
    expect(cv2.isPrimary).toBe(false)

    // Switch primary to CV 2
    await setPrimaryCv(cv2._id, userA)

    const updatedCv1 = await getCvById(cv1._id, userA)
    const updatedCv2 = await getCvById(cv2._id, userA)

    expect(updatedCv1.isPrimary).toBe(false)
    expect(updatedCv2.isPrimary).toBe(true)
  })

  it('retries structuring using retained rawText', async () => {
    const cv = await createCvFromImport(userA, {
      title: 'Failing then Recovering CV',
      rawText: 'Charlie Brown\nSoftware Engineer\ncharlie@example.com',
    })

    generate.mockResolvedValueOnce({ personalInfo: { fullName: 'Charlie Brown' }, summary: '', sections: [] })
    const retried = await retryCvStructuring(cv._id, userA)
    expect(retried.ingestionStatus).toBe('ready')
    expect(retried.personalInfo?.fullName).toBe('Charlie Brown')
  })

  it('deletes a user CV successfully', async () => {
    const cv = await createCvFromImport(userA, {
      title: 'Temporary CV',
      rawText: 'Temp text',
    })

    await deleteCv(cv._id, userA)
    await expect(getCvById(cv._id, userA)).rejects.toThrow(CvNotFoundError)
  })
})
