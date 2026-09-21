import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

export interface MockSanityDocument {
  _id: string
  _type: string
  _createdAt?: string
  _updatedAt?: string
  [key: string]: unknown
}

export interface CvSanityClient {
  fetch<T = unknown>(query: string, params?: Record<string, unknown>): Promise<T>
  create<T extends Record<string, unknown>>(
    doc: T
  ): Promise<T & { _id: string; _createdAt: string }>
  patch(id: string): {
    set: (fields: Record<string, unknown>) => {
      set: (f: Record<string, unknown>) => unknown
      unset: (f: string[]) => unknown
      commit: (options?: unknown) => Promise<unknown>
    }
    unset: (fields: string[]) => unknown
    commit: (options?: unknown) => Promise<unknown>
  }
  delete(id: string | { query: string; params: Record<string, string> }, options?: unknown): Promise<unknown>
}

/**
 * In-memory Mock Sanity Client for automated tests and offline development.
 */
export class MockSanityClient implements CvSanityClient {
  public documents: Map<string, MockSanityDocument> = new Map()

  async fetch<T = unknown>(query: string, params: Record<string, unknown> = {}): Promise<T> {
    const docs = Array.from(this.documents.values())

    // Filter by type and params
    let result = docs.filter((d) => {
      if (query.includes('_type == "cv"') && d._type !== 'cv') return false
      if (query.includes('_type == "jd"') && d._type !== 'jd') return false
      if (query.includes('_type == "application"') && d._type !== 'application') return false
      if (query.includes('_type == "cvMatch"') && d._type !== 'cvMatch') return false
      if (params.userId && d.userId !== params.userId) return false
      if (d._type === 'cv' && params.cvId && d._id !== params.cvId) return false
      if (d._type === 'application' && params.cvId) {
        const baseRef = (d.baseCv as { _ref?: string } | undefined)?._ref
        const tailRef = (d.tailoredCv as { _ref?: string } | undefined)?._ref
        if (baseRef !== params.cvId && tailRef !== params.cvId) return false
      }
      if (d._type === 'application' && params.jdId) {
        const jdRef = (d.jd as { _ref?: string } | undefined)?._ref
        if (jdRef !== params.jdId) return false
      }
      if (params.id && d._id !== params.id) return false
      if (query.includes('isTailored == false') && d.isTailored) return false
      return true
    })

    // Sorting by createdAt desc if specified in query
    if (query.includes('order(_createdAt desc)')) {
      result = result.sort((a, b) => {
        const dateA = (a._createdAt as string) || ''
        const dateB = (b._createdAt as string) || ''
        return dateB.localeCompare(dateA)
      })
    }

    if (query.includes('][0]') || query.endsWith('[0]')) {
      return (result[0] as unknown as T) || (null as unknown as T)
    }

    return result as unknown as T
  }

  async create<T extends Record<string, unknown>>(
    doc: T
  ): Promise<T & { _id: string; _createdAt: string }> {
    const _id = (doc._id as string) || `cv_${Math.random().toString(36).substring(2, 10)}`
    const now = new Date().toISOString()
    const storedDoc = {
      ...doc,
      _id,
      _createdAt: now,
      _updatedAt: now,
    }
    this.documents.set(_id, storedDoc as unknown as MockSanityDocument)
    return storedDoc as T & { _id: string; _createdAt: string }
  }

  patch(id: string) {
    let pendingSets: Record<string, unknown> = {}
    let pendingUnsets: string[] = []

    return {
      set: (fields: Record<string, unknown>) => {
        pendingSets = { ...pendingSets, ...fields }
        return {
          set: (f: Record<string, unknown>) => {
            pendingSets = { ...pendingSets, ...f }
            return this.patch(id)
          },
          unset: (f: string[]) => {
            pendingUnsets = [...pendingUnsets, ...f]
            return this.patch(id)
          },
          commit: async (_options?: unknown): Promise<MockSanityDocument> => {
            const doc = this.documents.get(id)
            if (!doc) {
              throw new Error(`Document not found: ${id}`)
            }
            for (const field of pendingUnsets) {
              delete doc[field]
            }
            Object.assign(doc, pendingSets, { _updatedAt: new Date().toISOString() })
            this.documents.set(id, doc)
            return doc
          },
        }
      },
      unset: (fields: string[]) => {
        pendingUnsets = [...pendingUnsets, ...fields]
        return this.patch(id)
      },
      commit: async (_options?: unknown): Promise<MockSanityDocument> => {
        const doc = this.documents.get(id)
        if (!doc) {
          throw new Error(`Document not found: ${id}`)
        }
        for (const field of pendingUnsets) {
          delete doc[field]
        }
        Object.assign(doc, pendingSets, { _updatedAt: new Date().toISOString() })
        this.documents.set(id, doc)
        return doc
      },
    }
  }

  async delete(selection: string | { query: string; params: Record<string, string> }, _options?: unknown): Promise<{ results: { id: string }[] }> {
    const ids = typeof selection === 'string' ? [selection] : [...this.documents.values()]
      .filter(doc => doc._type === 'cvMatch' && doc.userId === selection.params.userId &&
        (doc.cv as { _ref?: string } | undefined)?._ref === (selection.params.cvId || selection.params.id))
      .map(doc => doc._id)
    ids.forEach(id => this.documents.delete(id))
    return { results: ids.map(id => ({ id })) }
  }

  async createIfNotExists<T extends Record<string, unknown>>(
    doc: T
  ): Promise<T & { _id: string; _createdAt: string }> {
    const existing = doc._id ? this.documents.get(doc._id as string) : null
    if (existing) return existing as unknown as T & { _id: string; _createdAt: string }
    return this.create(doc)
  }
}

let mockClientInstance: MockSanityClient | null = null

export function getMockSanityClient(): MockSanityClient {
  if (!mockClientInstance) {
    mockClientInstance = new MockSanityClient()
  }
  return mockClientInstance
}

export function resetMockSanityClient(): void {
  if (mockClientInstance) {
    mockClientInstance.documents.clear()
  }
}

/**
 * Returns either a live authenticated server client with write token,
 * or the mock client if explicitly in test mode.
 */
export function getServerSanityClient(): CvSanityClient {
  if (process.env.NODE_ENV === 'test' || process.env.MOCK_SANITY === 'true') {
    return getMockSanityClient()
  }

  const token = process.env.SANITY_API_TOKEN || process.env.SANITY_API_WRITE_TOKEN

  if (!token) {
    throw new Error('SANITY_API_TOKEN is required for CV storage.')
  }

  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token,
  }) as unknown as CvSanityClient
}
