import { withUser } from '@/modules/jds/http'
import { getJd, deleteJd } from '@/modules/jds/service'
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return withUser(async (userId) =>
    Response.json({ jd: await getJd((await context.params).id, userId) }),
  )
}
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return withUser(async (userId) => {
    await deleteJd((await context.params).id, userId)
    return Response.json({ success: true })
  })
}
