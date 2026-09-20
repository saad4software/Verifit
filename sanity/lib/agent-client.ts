import { createClient } from 'next-sanity'
import { dataset, projectId } from '../env'

/** Agent Actions require the experimental API version; regular CRUD stays pinned. */
export function getSanityAgentClient() {
  const token = process.env.SANITY_API_TOKEN || process.env.SANITY_API_WRITE_TOKEN
  if (!token) throw new Error('SANITY_API_TOKEN is required for Sanity Agent Actions.')
  if (process.env.MOCK_SANITY === 'true') {
    throw new Error('Disable MOCK_SANITY to generate CVs with Sanity Agent Actions.')
  }
  return createClient({ projectId, dataset, apiVersion: 'vX', useCdn: false, token })
}
