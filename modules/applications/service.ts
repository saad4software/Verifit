import { getServerSanityClient } from '@/sanity/lib/server-client'
import { getCvById } from '@/modules/cvs/service'
import { getJd } from '@/modules/jds/service'
import { evaluateAndSaveMatch } from '@/modules/matching/service'
import type { CVDocument } from '@/modules/cvs/types'
import type { Jd } from '@/modules/jds/schema'
import type { MatchRecord } from '@/modules/matching/schema'
import {
  tailorCvWithAgent,
  generateCoverLetterWithAgent,
} from './agent'
import type {
  ApplicationDocument,
  PopulatedApplication,
  CreateApplicationInput,
  UpdateApplicationInput,
  GenerateCoverLetterInput,
  RequirementDelta,
  ScoreDelta,
} from './types'

export class ApplicationNotFoundError extends Error {
  constructor(message = 'Application not found or access unauthorized.') {
    super(message)
    this.name = 'ApplicationNotFoundError'
  }
}

export class ApplicationConflictError extends Error {
  constructor(message = 'Application conflict or protected dependency.') {
    super(message)
    this.name = 'ApplicationConflictError'
  }
}

/**
 * Calculates score delta and requirement deltas between baseline and tailored matches.
 */
export function computeDeltas(
  baselineMatch: MatchRecord | null,
  tailoredMatch: MatchRecord | null,
  jd: Jd | null
): { scoreDelta: ScoreDelta | null; requirementDeltas: RequirementDelta[] } {
  const oldScore = baselineMatch?.result?.score ?? null
  const newScore = tailoredMatch?.result?.score ?? null
  const scoreDiff =
    typeof oldScore === 'number' && typeof newScore === 'number'
      ? newScore - oldScore
      : null

  const requirements = jd?.content?.requirements || []
  let gapsClosed = 0

  const baselineAssessments = new Map(
    baselineMatch?.result?.assessments?.map((a) => [a.requirementId, a]) || []
  )
  const tailoredAssessments = new Map(
    tailoredMatch?.result?.assessments?.map((a) => [a.requirementId, a]) || []
  )

  const requirementDeltas: RequirementDelta[] = requirements.map((req, idx) => {
    const key = (req as { _key?: string })._key || String(idx)
    const baseAssessment = baselineAssessments.get(key)
    const tailoredAssessment = tailoredAssessments.get(key)

    const baseStatus = baseAssessment?.status || 'not_evidenced'
    const tailStatus = tailoredAssessment?.status || 'not_evidenced'

    const improved =
      (baseStatus === 'not_evidenced' ||
        baseStatus === 'partial' ||
        baseStatus === 'not_met') &&
      tailStatus === 'met'

    if (improved) gapsClosed++

    return {
      requirementId: key,
      text: req.text || 'Requirement',
      classification: req.classification || 'required',
      baselineStatus: baseStatus,
      tailoredStatus: tailStatus,
      improved,
    }
  })

  const scoreDelta: ScoreDelta | null =
    typeof oldScore === 'number' || typeof newScore === 'number'
      ? {
          oldScore,
          newScore,
          scoreDiff,
          gapsClosed,
          totalRequirements: requirements.length,
        }
      : null

  return { scoreDelta, requirementDeltas }
}

/**
 * Lists all applications for a user, fully populated with linked JD, CVs, and match score metrics.
 */
export async function listApplications(
  userId: string
): Promise<PopulatedApplication[]> {
  const client = getServerSanityClient()
  const query = `*[_type == "application" && userId == $userId] | order(_createdAt desc)`
  const applications = await client.fetch<ApplicationDocument[]>(query, { userId })

  if (!applications || !applications.length) return []

  // Populate references in parallel
  const populated = await Promise.all(
    applications.map(async (app) => {
      try {
        const [jd, baseCv, tailoredCv, baselineMatch, tailoredMatch] =
          await Promise.all([
            app.jd?._ref
              ? client.fetch<Jd | null>(
                  '*[_type == "jd" && _id == $id && userId == $userId][0]',
                  { id: app.jd._ref, userId }
                )
              : null,
            app.baseCv?._ref
              ? client.fetch<CVDocument | null>(
                  '*[_type == "cv" && _id == $id && userId == $userId][0]',
                  { id: app.baseCv._ref, userId }
                )
              : null,
            app.tailoredCv?._ref
              ? client.fetch<CVDocument | null>(
                  '*[_type == "cv" && _id == $id && userId == $userId][0]',
                  { id: app.tailoredCv._ref, userId }
                )
              : null,
            app.baselineMatch?._ref
              ? client.fetch<MatchRecord | null>(
                  '*[_type == "cvMatch" && _id == $id && userId == $userId][0]',
                  { id: app.baselineMatch._ref, userId }
                )
              : null,
            app.tailoredMatch?._ref
              ? client.fetch<MatchRecord | null>(
                  '*[_type == "cvMatch" && _id == $id && userId == $userId][0]',
                  { id: app.tailoredMatch._ref, userId }
                )
              : null,
          ])

        const { scoreDelta, requirementDeltas } = computeDeltas(
          baselineMatch,
          tailoredMatch,
          jd
        )

        return {
          ...app,
          jdData: jd,
          baseCvData: baseCv,
          tailoredCvData: tailoredCv,
          baselineMatchData: baselineMatch,
          tailoredMatchData: tailoredMatch,
          scoreDelta,
          requirementDeltas,
        }
      } catch {
        return app
      }
    })
  )

  return populated
}

/**
 * Retrieves a single application by ID, verifying user ownership and populating dependencies.
 */
export async function getApplicationById(
  applicationId: string,
  userId: string
): Promise<PopulatedApplication> {
  const client = getServerSanityClient()
  const query = `*[_type == "application" && _id == $id && userId == $userId][0]`
  const app = await client.fetch<ApplicationDocument | null>(query, {
    id: applicationId,
    userId,
  })

  if (!app) {
    throw new ApplicationNotFoundError(
      `Application with ID ${applicationId} not found.`
    )
  }

  const [jd, baseCv, tailoredCv, baselineMatch, tailoredMatch] =
    await Promise.all([
      app.jd?._ref
        ? client.fetch<Jd | null>(
            '*[_type == "jd" && _id == $id && userId == $userId][0]',
            { id: app.jd._ref, userId }
          )
        : null,
      app.baseCv?._ref
        ? client.fetch<CVDocument | null>(
            '*[_type == "cv" && _id == $id && userId == $userId][0]',
            { id: app.baseCv._ref, userId }
          )
        : null,
      app.tailoredCv?._ref
        ? client.fetch<CVDocument | null>(
            '*[_type == "cv" && _id == $id && userId == $userId][0]',
            { id: app.tailoredCv._ref, userId }
          )
        : null,
      app.baselineMatch?._ref
        ? client.fetch<MatchRecord | null>(
            '*[_type == "cvMatch" && _id == $id && userId == $userId][0]',
            { id: app.baselineMatch._ref, userId }
          )
        : null,
      app.tailoredMatch?._ref
        ? client.fetch<MatchRecord | null>(
            '*[_type == "cvMatch" && _id == $id && userId == $userId][0]',
            { id: app.tailoredMatch._ref, userId }
          )
        : null,
    ])

  const { scoreDelta, requirementDeltas } = computeDeltas(
    baselineMatch,
    tailoredMatch,
    jd
  )

  return {
    ...app,
    jdData: jd,
    baseCvData: baseCv,
    tailoredCvData: tailoredCv,
    baselineMatchData: baselineMatch,
    tailoredMatchData: tailoredMatch,
    scoreDelta,
    requirementDeltas,
  }
}

/**
 * Creates a new Application referencing a valid JD and ready Base CV,
 * establishing the baseline match score.
 */
export async function createApplication(
  userId: string,
  input: CreateApplicationInput
): Promise<PopulatedApplication> {
  const client = getServerSanityClient()

  // Verify Base CV tenancy and readiness
  const baseCv = await getCvById(input.cvId, userId)
  if (baseCv.ingestionStatus !== 'ready') {
    throw new Error('Base CV must be in "ready" status to create an application.')
  }

  // Verify JD tenancy
  const jd = await getJd(input.jdId, userId)

  const jdTitle = jd.content?.fields?.find((f) => f.category === 'title')?.text
  const jdCompany = jd.content?.fields?.find((f) => f.category === 'company')?.text

  const defaultTitle =
    input.title ||
    (jdTitle && jdCompany
      ? `${jdTitle} at ${jdCompany}`
      : jdTitle || jdCompany || 'Job Application')

  // Create Sanity application document
  const created = await client.create({
    _type: 'application',
    userId,
    title: defaultTitle,
    status: input.status || 'draft',
    tailoringStatus: 'idle',
    jd: { _type: 'reference', _ref: jd._id },
    baseCv: { _type: 'reference', _ref: baseCv._id },
    notes: input.notes || '',
  })

  // Attempt to evaluate or retrieve baseline match
  let baselineMatchRecord: MatchRecord | null = null
  try {
    baselineMatchRecord = await evaluateAndSaveMatch(jd, baseCv, userId)
    if (baselineMatchRecord?._id) {
      await client
        .patch(created._id)
        .set({
          baselineMatch: {
            _type: 'reference',
            _ref: baselineMatchRecord._id,
          },
        })
        .commit()
    }
  } catch (err) {
    console.error('Failed to compute initial baseline match:', err)
  }

  return getApplicationById(created._id, userId)
}

/**
 * Updates application editable properties (status, notes, coverLetter, appliedAt).
 */
export async function updateApplication(
  applicationId: string,
  userId: string,
  patch: UpdateApplicationInput
): Promise<PopulatedApplication> {
  await getApplicationById(applicationId, userId)
  const client = getServerSanityClient()

  const safePatch: Record<string, unknown> = {}
  if (patch.title !== undefined) safePatch.title = patch.title
  if (patch.status !== undefined) safePatch.status = patch.status
  if (patch.coverLetter !== undefined) safePatch.coverLetter = patch.coverLetter
  if (patch.coverLetterTone !== undefined) safePatch.coverLetterTone = patch.coverLetterTone
  if (patch.notes !== undefined) safePatch.notes = patch.notes
  if (patch.appliedAt !== undefined) safePatch.appliedAt = patch.appliedAt

  await client.patch(applicationId).set(safePatch).commit()
  return getApplicationById(applicationId, userId)
}

/**
 * Performs cascade deletion of an Application, removing its scoped tailored CV and match documents.
 */
export async function deleteApplication(
  applicationId: string,
  userId: string
): Promise<void> {
  const app = await getApplicationById(applicationId, userId)
  const client = getServerSanityClient()

  // 1. If tailored CV exists, delete its matches and the document itself
  if (app.tailoredCv?._ref) {
    const tailoredCvId = app.tailoredCv._ref
    await client.delete({
      query: '*[_type == "cvMatch" && userId == $userId && cv._ref == $cvId]',
      params: { userId, cvId: tailoredCvId },
    })
    await client.delete(tailoredCvId).catch(() => null)
  }

  // 2. Delete the application document
  await client.delete(applicationId)
}

/**
 * Checks if a CV is referenced by any active application as base or tailored CV.
 */
export async function checkCvDeletable(
  cvId: string,
  userId: string
): Promise<{ deletable: boolean; reason?: string }> {
  const client = getServerSanityClient()
  const query = `*[_type == "application" && userId == $userId && (baseCv._ref == $cvId || tailoredCv._ref == $cvId)][0]`
  const referenced = await client.fetch<ApplicationDocument | null>(query, {
    cvId,
    userId,
  })

  if (referenced) {
    return {
      deletable: false,
      reason: `This CV is linked to application "${referenced.title || 'Job Application'}". Delete or unlink the application first.`,
    }
  }

  return { deletable: true }
}

/**
 * Checks if a JD is referenced by any active application.
 */
export async function checkJdDeletable(
  jdId: string,
  userId: string
): Promise<{ deletable: boolean; reason?: string }> {
  const client = getServerSanityClient()
  const query = `*[_type == "application" && userId == $userId && jd._ref == $jdId][0]`
  const referenced = await client.fetch<ApplicationDocument | null>(query, {
    jdId,
    userId,
  })

  if (referenced) {
    return {
      deletable: false,
      reason: `This Job Description is linked to application "${referenced.title || 'Job Application'}". Delete or unlink the application first.`,
    }
  }

  return { deletable: true }
}

/**
 * Orchestrates the full async CV tailoring pipeline:
 * 1. Validates base CV and JD.
 * 2. Runs AI tailoring agent with anti-hallucination guardrails.
 * 3. Creates application-scoped tailored CV in Sanity.
 * 4. Runs matching engine on tailored CV to compute new score.
 * 5. Updates application status and references.
 */
export async function tailorApplication(
  applicationId: string,
  userId: string
): Promise<PopulatedApplication> {
  const app = await getApplicationById(applicationId, userId)
  const client = getServerSanityClient()

  if (!app.baseCvData || !app.jdData) {
    throw new Error('Application lacks valid base CV or JD references.')
  }

  // Mark tailoring in progress
  await client
    .patch(applicationId)
    .set({
      tailoringStatus: 'running',
      tailoringError: null,
    })
    .commit()

  try {
    // 1. Ensure baseline match
    let baselineMatch = app.baselineMatchData
    if (!baselineMatch) {
      baselineMatch = await evaluateAndSaveMatch(app.jdData, app.baseCvData, userId)
      await client
        .patch(applicationId)
        .set({
          baselineMatch: { _type: 'reference', _ref: baselineMatch._id },
        })
        .commit()
    }

    // 2. Call Tailoring Agent
    const tailoredStructure = await tailorCvWithAgent(
      app.baseCvData,
      app.jdData,
      baselineMatch
    )

    const jdTitle = app.jdData.content?.fields?.find((f) => f.category === 'title')?.text
    const tailoredCvTitle = `${app.baseCvData.title} (Tailored for ${jdTitle || 'Target Role'})`

    // 3. Create or update tailored CV document in Sanity
    let tailoredCvDoc: CVDocument
    if (app.tailoredCv?._ref) {
      // Update existing tailored CV
      tailoredCvDoc = (await client
        .patch(app.tailoredCv._ref)
        .set({
          summary: tailoredStructure.summary,
          sections: tailoredStructure.sections,
          ingestionStatus: 'ready',
        })
        .commit()) as unknown as CVDocument
    } else {
      // Create new application-scoped tailored CV
      tailoredCvDoc = (await client.create({
        _type: 'cv',
        userId,
        title: tailoredCvTitle,
        isPrimary: false,
        isTailored: true,
        applicationId,
        sourceCvId: app.baseCvData._id,
        ingestionStatus: 'ready',
        personalInfo: app.baseCvData.personalInfo,
        summary: tailoredStructure.summary,
        sections: tailoredStructure.sections,
        rawText: app.baseCvData.rawText || '',
      })) as unknown as CVDocument
    }

    // 4. Run matching on the tailored CV
    const tailoredMatch = await evaluateAndSaveMatch(
      app.jdData,
      tailoredCvDoc,
      userId
    )

    // 5. Update application with new tailored CV and match references
    await client
      .patch(applicationId)
      .set({
        tailoredCv: { _type: 'reference', _ref: tailoredCvDoc._id },
        tailoredMatch: { _type: 'reference', _ref: tailoredMatch._id },
        tailoringStatus: 'completed',
        tailoringError: null,
      })
      .commit()

    return getApplicationById(applicationId, userId)
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : 'Tailoring failed unexpectedly.'
    await client
      .patch(applicationId)
      .set({
        tailoringStatus: 'failed',
        tailoringError: errorMsg,
      })
      .commit()
    throw err
  }
}

/**
 * Re-scores an edited tailored CV against the target JD.
 */
export async function rescoreApplication(
  applicationId: string,
  userId: string
): Promise<PopulatedApplication> {
  const app = await getApplicationById(applicationId, userId)
  const client = getServerSanityClient()

  if (!app.tailoredCvData || !app.jdData) {
    throw new Error('Application has no tailored CV to re-score.')
  }

  const newMatch = await evaluateAndSaveMatch(
    app.jdData,
    app.tailoredCvData,
    userId
  )

  await client
    .patch(applicationId)
    .set({
      tailoredMatch: { _type: 'reference', _ref: newMatch._id },
    })
    .commit()

  return getApplicationById(applicationId, userId)
}

/**
 * Generates an on-demand bespoke cover letter.
 */
export async function generateCoverLetter(
  applicationId: string,
  userId: string,
  input: GenerateCoverLetterInput
): Promise<PopulatedApplication> {
  const app = await getApplicationById(applicationId, userId)
  const client = getServerSanityClient()

  if (!app.jdData) {
    throw new Error('Application lacks valid JD information.')
  }

  const candidateCv = app.tailoredCvData || app.baseCvData
  if (!candidateCv) {
    throw new Error('Application lacks candidate CV information.')
  }

  const letterText = await generateCoverLetterWithAgent(
    candidateCv,
    app.jdData,
    input.tone,
    input.notes
  )

  await client
    .patch(applicationId)
    .set({
      coverLetter: letterText,
      coverLetterTone: input.tone,
    })
    .commit()

  return getApplicationById(applicationId, userId)
}
