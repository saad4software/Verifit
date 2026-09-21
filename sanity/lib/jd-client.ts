import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'
import { getServerSanityClient } from './server-client'

/** JD writes require Sanity's revision-checked patch interface. */
export function getJdClient() {
  if (process.env.NODE_ENV === 'test' || process.env.MOCK_SANITY === 'true') {
    return getServerSanityClient() as ReturnType<typeof createClient>
  }
  const token =
    process.env.SANITY_API_TOKEN || process.env.SANITY_API_WRITE_TOKEN
  if (!token)
    throw new Error(
      'Configure a Sanity server write token for the private JD library.',
    )
  return createClient({ projectId, dataset, apiVersion, useCdn: false, token })
}
