import { scheduleJd } from '@/modules/jds/scheduling'
import { z } from 'zod'
import { withUser } from '@/modules/jds/http'
import { duplicateJd, importJd } from '@/modules/jds/service'
export async function POST(request: Request) {
  return withUser(async (userId) => {
    const body = z
      .object({
        text: z.string().optional(),
        url: z.string().optional(),
        allowDuplicate: z.boolean().optional(),
      })
      .strict()
      .refine(
        (value) => (value.text !== undefined) !== (value.url !== undefined),
        'Provide exactly one of text or URL.',
      )
      .parse(await request.json())
    if (body.url && !body.allowDuplicate) {
      const existingId = await duplicateJd(userId, body.url)
      if (existingId)
        return Response.json(
          { error: 'This URL is already in your library.', existingId },
          { status: 409 },
        )
    }
    const jd = await scheduleJd(await importJd(userId, body))
    return Response.json({ jd }, { status: 201 })
  })
}

export const maxDuration = 300
