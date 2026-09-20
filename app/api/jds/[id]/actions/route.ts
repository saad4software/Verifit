import { z } from 'zod'
import { withUser } from '@/modules/jds/http'
import {
  reviewJd,
  retryJd,
  pasteFallback,
  replacementJd,
} from '@/modules/jds/service'
import { scheduleJd } from '@/modules/jds/scheduling'
import { scheduleMatching } from '@/modules/matching/scheduling'
const Input = z
  .object({
    action: z.enum([
      'save',
      'confirm',
      'saveConfirm',
      'retry',
      'paste',
      'reprocess',
      'refetch',
      'accept',
      'reject',
    ]),
    revision: z.string(),
    text: z.string().optional(),
    content: z.unknown().optional(),
    replacement: z.boolean().optional(),
  })
  .strict()
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return withUser(async (userId) => {
    const input = Input.parse(await request.json())
    const { id } = await context.params
    if (input.action === 'retry' || input.action === 'paste') {
      const jd =
        input.action === 'paste'
          ? await pasteFallback(id, userId, input.revision, input.text)
          : await retryJd(id, userId, input.revision)
      return Response.json({ jd: await scheduleJd(jd) })
    }
    if (
      input.action === 'reprocess' ||
      input.action === 'refetch' ||
      input.action === 'accept' ||
      input.action === 'reject'
    ) {
      const jd = await replacementJd(id, userId, input.revision, input.action)
      if (input.action === 'accept') scheduleMatching(userId, id)
      return Response.json({
        jd:
          input.action === 'reprocess' || input.action === 'refetch'
            ? await scheduleJd(jd, true)
            : jd,
      })
    }
    const jd = await reviewJd(id, userId, input)
    if (jd.readiness === 'ready') scheduleMatching(userId, id)
    return Response.json({ jd })
  })
}

export const maxDuration = 300
