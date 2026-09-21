// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeDeltas,
  createApplication,
  listApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  checkCvDeletable,
  checkJdDeletable,
  tailorApplication,
  generateCoverLetter,
  rescoreApplication,
  ApplicationNotFoundError,
} from '@/modules/applications/service'
import {
  getMockSanityClient,
  resetMockSanityClient,
} from '@/sanity/lib/server-client'
import type { MatchRecord } from '@/modules/matching/schema'
import type { Jd } from '@/modules/jds/schema'

const { generate } = vi.hoisted(() => ({ generate: vi.fn() }))
vi.mock('@/sanity/lib/agent-client', () => ({
  getSanityAgentClient: () => ({ agent: { action: { generate } } }),
}))

describe('Applications Service & Calculations', () => {
  const userId = 'user_test_app_1'

  beforeEach(() => {
    resetMockSanityClient()
    vi.stubEnv('SANITY_AGENT_SCHEMA_ID', 'test-agent-schema')
    generate.mockReset()
    generate.mockResolvedValue({
      personalInfo: { fullName: 'Jane Doe', email: 'jane@example.com' },
      summary: 'Tailored executive summary matching JD requirements.',
      sections: [
        {
          _key: 'work',
          _type: 'workExperienceSection',
          items: [
            {
              _key: 'w1',
              company: 'Acme Corp',
              role: 'Senior Engineer',
              highlights: ['Led high-concurrency Node.js microservices migration'],
            },
          ],
        },
      ],
      coverLetter: 'Dear Hiring Manager,\n\nI am thrilled to apply for the position...',
    })
  })

  afterEach(() => vi.unstubAllEnvs())

  describe('computeDeltas calculation', () => {
    it('correctly calculates score improvement and closed gaps', () => {
      const jd: Jd = {
        _id: 'jd1',
        _rev: 'rev1',
        _type: 'jd',
        userId,
        attempts: 1,
        readiness: 'ready',
        source: { id: 's1', text: 'Senior Engineer', origin: 'pasted' },
        warnings: [],
        findings: [],
        processing: null,
        error: null,
        replacement: null,
        content: {
          fields: [
            {
              _key: 'f1',
              category: 'title',
              text: 'Senior Engineer',
              evidence: [],
            },
          ],
          requirements: [
            {
              _key: 'req1',
              category: 'skills',
              text: 'Node.js',
              classification: 'required',
              evidence: [],
            },
            {
              _key: 'req2',
              category: 'skills',
              text: 'React',
              classification: 'required',
              evidence: [],
            },
          ],
          groups: [],
        },
      }

      const baselineMatch: MatchRecord = {
        _id: 'match1',
        _rev: 'rev1',
        _type: 'cvMatch',
        userId,
        jd: { _type: 'reference', _ref: 'jd1' },
        cv: { _type: 'reference', _ref: 'cv1' },
        fingerprint: 'fp1',
        scoringVersion: 'requirements-v1',
        status: 'complete',
        result: {
          score: 50,
          earned: 1,
          possible: 2,
          evidenceCoverage: 50,
          requiredGaps: ['req2'],
          assessments: [
            {
              requirementId: 'req1',
              status: 'met',
              text: 'Node.js',
              classification: 'required',
              explanation: 'Good',
              jdEvidence: [],
              evidence: [],
            },
            {
              requirementId: 'req2',
              status: 'not_evidenced',
              text: 'React',
              classification: 'required',
              explanation: 'Missing',
              jdEvidence: [],
              evidence: [],
            },
          ],
          units: [],
        },
        error: null,
        completedAt: new Date().toISOString(),
      }

      const tailoredMatch: MatchRecord = {
        ...baselineMatch,
        _id: 'match2',
        result: {
          ...baselineMatch.result!,
          score: 100,
          earned: 2,
          requiredGaps: [],
          assessments: [
            {
              requirementId: 'req1',
              status: 'met',
              text: 'Node.js',
              classification: 'required',
              explanation: 'Good',
              jdEvidence: [],
              evidence: [],
            },
            {
              requirementId: 'req2',
              status: 'met',
              text: 'React',
              classification: 'required',
              explanation: 'Evidenced in tailored CV',
              jdEvidence: [],
              evidence: [],
            },
          ],
        },
      }

      const { scoreDelta, requirementDeltas } = computeDeltas(
        baselineMatch,
        tailoredMatch,
        jd
      )

      expect(scoreDelta).toBeDefined()
      expect(scoreDelta?.oldScore).toBe(50)
      expect(scoreDelta?.newScore).toBe(100)
      expect(scoreDelta?.scoreDiff).toBe(50)
      expect(scoreDelta?.gapsClosed).toBe(1)
      expect(scoreDelta?.totalRequirements).toBe(2)

      expect(requirementDeltas).toHaveLength(2)
      expect(requirementDeltas[0].improved).toBe(false)
      expect(requirementDeltas[1].improved).toBe(true)
      expect(requirementDeltas[1].baselineStatus).toBe('not_evidenced')
      expect(requirementDeltas[1].tailoredStatus).toBe('met')
    })
  })

  describe('CRUD & Lifecycle', () => {
    it('creates, lists, retrieves, updates, and deletes an application', async () => {
      const client = getMockSanityClient()

      // Seed mock JD
      const jd = await client.create({
        _type: 'jd',
        userId,
        readiness: 'ready',
        source: { text: 'Fullstack role', origin: 'pasted' },
        content: {
          fields: [
            { category: 'title', text: 'Fullstack Dev' },
            { category: 'company', text: 'Tech Inc' },
          ],
          requirements: [{ text: 'TypeScript', classification: 'required' }],
        },
      })

      // Seed mock CV
      const cv = await client.create({
        _type: 'cv',
        userId,
        title: 'Master CV',
        isPrimary: true,
        ingestionStatus: 'ready',
        personalInfo: { fullName: 'Jane Doe' },
        sections: [],
      })

      // 1. Create Application
      const created = await createApplication(userId, {
        jdId: jd._id,
        cvId: cv._id,
      })

      expect(created._id).toBeDefined()
      expect(created.title).toBe('Fullstack Dev at Tech Inc')
      expect(created.status).toBe('draft')
      expect(created.tailoringStatus).toBe('idle')

      // 2. List Applications
      const list = await listApplications(userId)
      expect(list).toHaveLength(1)
      expect(list[0]._id).toBe(created._id)

      // 3. Update Application Status
      const updated = await updateApplication(created._id, userId, {
        status: 'applied',
        notes: 'Applied via company careers portal',
      })
      expect(updated.status).toBe('applied')
      expect(updated.notes).toBe('Applied via company careers portal')

      // 4. Tailor Application with Agent
      const tailored = await tailorApplication(created._id, userId)
      expect(tailored.tailoringStatus).toBe('completed')
      expect(tailored.tailoredCv?._ref).toBeDefined()

      // 5. Generate Cover Letter
      const withCover = await generateCoverLetter(created._id, userId, {
        tone: 'professional',
        notes: 'Great culture fit',
      })
      expect(withCover.coverLetter).toBeDefined()

      // 6. Rescore Application
      const rescored = await rescoreApplication(created._id, userId)
      expect(rescored._id).toBe(created._id)

      // 7. Parent Deletion Protection Checks
      const cvCheck = await checkCvDeletable(cv._id, userId)
      expect(cvCheck.deletable).toBe(false)

      const jdCheck = await checkJdDeletable(jd._id, userId)
      expect(jdCheck.deletable).toBe(false)

      // 5. Delete Application
      await deleteApplication(created._id, userId)
      await expect(getApplicationById(created._id, userId)).rejects.toThrow(
        ApplicationNotFoundError
      )

      // 6. Parents now deletable
      const cvCheckAfter = await checkCvDeletable(cv._id, userId)
      expect(cvCheckAfter.deletable).toBe(true)
    })

    it('performs cascade deletion of tailored CV when application is deleted', async () => {
      const client = getMockSanityClient()

      const jd = await client.create({
        _type: 'jd',
        userId,
        readiness: 'ready',
        source: { text: 'Role', origin: 'pasted' },
        content: { fields: [], requirements: [] },
      })

      const baseCv = await client.create({
        _type: 'cv',
        userId,
        title: 'Base',
        ingestionStatus: 'ready',
        personalInfo: {},
        sections: [],
      })

      const tailoredCv = await client.create({
        _type: 'cv',
        userId,
        title: 'Tailored CV',
        isTailored: true,
        ingestionStatus: 'ready',
      })

      const app = await client.create({
        _type: 'application',
        userId,
        status: 'draft',
        tailoringStatus: 'completed',
        jd: { _type: 'reference', _ref: jd._id },
        baseCv: { _type: 'reference', _ref: baseCv._id },
        tailoredCv: { _type: 'reference', _ref: tailoredCv._id },
      })

      // Delete application
      await deleteApplication(app._id, userId)

      // Tailored CV document should be removed
      const remainingTailored = await client.fetch(
        '*[_type == "cv" && _id == $id][0]',
        { id: tailoredCv._id }
      )
      expect(remainingTailored).toBeNull()

      // Base CV must remain
      const remainingBase = await client.fetch(
        '*[_type == "cv" && _id == $id][0]',
        { id: baseCv._id }
      )
      expect(remainingBase).not.toBeNull()
    })
  })
})
