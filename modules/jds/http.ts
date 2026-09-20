import { headers } from 'next/headers'
import { auth } from '@/modules/auth/server'
import { ZodError } from 'zod'
import { JdError } from './schema'
export async function withUser(
  run: (userId: string) => Promise<Response>,
): Promise<Response> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user)
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    return await run(session.user.id)
  } catch (error) {
    if (error instanceof ZodError)
      return Response.json(
        { error: error.issues.map((i) => i.message).join(' ') },
        { status: 400 },
      )
    if (error instanceof SyntaxError)
      return Response.json({ error: 'Invalid request body.' }, { status: 400 })
    return Response.json(
      {
        error:
          error instanceof JdError
            ? error.message
            : 'Unable to complete this request. Please try again.',
      },
      { status: error instanceof JdError ? error.status : 500 },
    )
  }
}
