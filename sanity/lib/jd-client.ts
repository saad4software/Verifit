import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

/** JD writes require Sanity's revision-checked patch interface. */
export function getJdClient() {
  const token =
    process.env.SANITY_API_TOKEN || process.env.SANITY_API_WRITE_TOKEN
  if (!token)
    throw new Error(
      'Configure a Sanity server write token for the private JD library.',
    )
  return createClient({ projectId, dataset, apiVersion, useCdn: false, token })
}
