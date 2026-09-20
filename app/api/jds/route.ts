import { withUser } from '@/modules/jds/http'
import { listJds } from '@/modules/jds/service'
export async function GET() {
  return withUser(async (userId) =>
    Response.json({ jds: await listJds(userId) }),
  )
}
