import { lookup } from 'node:dns/promises'
import { request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { isIP } from 'node:net'
import ipaddr from 'ipaddr.js'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import { JdError, TextSchema } from './schema'

export function normalizeUrl(input: string): string {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new JdError('Enter a valid public HTTP(S) URL.')
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    (url.port && !['80', '443'].includes(url.port))
  )
    throw new JdError(
      'Use a public HTTP(S) URL without credentials or custom ports.',
    )
  url.hash = ''
  return url.href
}
function publicAddress(address: string): boolean {
  try {
    return ipaddr.process(address).range() === 'unicast'
  } catch {
    return false
  }
}
async function page(
  url: URL,
  signal: AbortSignal,
): Promise<{ status: number; location?: string; html: string }> {
  signal.throwIfAborted()
  const hostname = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = isIP(hostname)
    ? [{ address: hostname, family: isIP(hostname) }]
    : await Promise.race([
        lookup(hostname, { all: true }),
        new Promise<never>((_, reject) =>
          signal.addEventListener(
            'abort',
            () => reject(new Error('URL retrieval timed out.')),
            { once: true },
          ),
        ),
      ])
  signal.throwIfAborted()
  if (
    !addresses.length ||
    addresses.some(({ address }) => !publicAddress(address))
  )
    throw new JdError(
      'Only public internet destinations are allowed. Paste the ad instead.',
    )
  // Pin the validated address for this connection so DNS rebinding cannot change the destination.
  const address = addresses[0]
  return new Promise((resolve, reject) => {
    const req = (url.protocol === 'https:' ? httpsRequest : httpRequest)(
      url,
      {
        signal,
        agent: false,
        headers: {
          Accept: 'text/html, application/xhtml+xml',
          'Accept-Encoding': 'identity',
          'User-Agent': 'Verifit/1.0',
        },
        lookup: (_hostname, options, callback) => {
          const cb = typeof options === 'function' ? options : callback
          const opts = typeof options === 'object' ? options : null
          if (opts?.all) {
            cb(null, [{ address: address.address, family: address.family }])
          } else {
            cb(null, address.address, address.family)
          }
        },
      },
      (response) => {
        const status = response.statusCode ?? 0
        if (status >= 300 && status < 400) {
          response.resume()
          resolve({ status, location: response.headers.location, html: '' })
          return
        }
        if (
          status !== 200 ||
          !/text\/html|application\/xhtml\+xml/i.test(
            String(response.headers['content-type']),
          )
        ) {
          response.resume()
          reject(
            new JdError(
              'This page cannot be retrieved. Paste the job ad to continue.',
            ),
          )
          return
        }
        let bytes = 0
        const chunks: Buffer[] = []
        response.on('data', (chunk: Buffer) => {
          bytes += chunk.length
          if (bytes > 2_000_000) {
            response.destroy()
            reject(
              new JdError(
                'The page exceeds the 2 MB retrieval limit. Paste the job ad.',
              ),
            )
            return
          }
          chunks.push(Buffer.from(chunk))
        })
        response.on('error', reject)
        response.on('end', () =>
          resolve({ status, html: Buffer.concat(chunks).toString('utf8') }),
        )
      },
    )
    req.on('error', reject)
    req.end()
  })
}
function embeddedJobs(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) return value.flatMap(embeddedJobs)
  if (!value || typeof value !== 'object') return []
  const object = value as Record<string, unknown>
  const types = Array.isArray(object['@type'])
    ? object['@type']
    : [object['@type']]
  return types.includes('JobPosting')
    ? [object]
    : Object.values(object).flatMap(embeddedJobs)
}
function readableValue(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number')
    return String(value)
  if (Array.isArray(value))
    return value.map(readableValue).filter(Boolean).join('\n')
  if (!value || typeof value !== 'object') return ''
  return Object.entries(value)
    .filter(([key]) => !key.startsWith('@'))
    .map(([key, item]) => `${key}: ${readableValue(item)}`)
    .join('\n')
}
export async function retrieveText(input: string): Promise<string> {
  const signal = AbortSignal.timeout(15_000)
  let url = new URL(normalizeUrl(input))
  for (let redirects = 0; redirects <= 4; redirects++) {
    const result = await page(url, signal)
    if (result.status >= 300 && result.status < 400) {
      if (!result.location || redirects === 4)
        throw new JdError('Too many redirects. Paste the job ad.')
      url = new URL(normalizeUrl(new URL(result.location, url).href))
      continue
    }
    const dom = new JSDOM(result.html, { url: url.href })
    try {
      const jobs = [
        ...dom.window.document.querySelectorAll(
          'script[type="application/ld+json"]',
        ),
      ].flatMap((script) => {
        try {
          return embeddedJobs(JSON.parse(script.textContent ?? ''))
        } catch {
          return []
        }
      })
      const distinct = [
        ...new Map(jobs.map((job) => [JSON.stringify(job), job])).values(),
      ]
      if (distinct.length > 1)
        throw new JdError(
          'This page describes multiple jobs. Paste one specific ad.',
        )
      let text: string
      if (distinct.length === 1) {
        const allowed = [
          'title',
          'description',
          'hiringOrganization',
          'responsibilities',
          'qualifications',
          'skills',
          'experienceRequirements',
          'educationRequirements',
          'jobLocation',
          'jobLocationType',
          'applicantLocationRequirements',
          'employmentType',
          'baseSalary',
          'estimatedSalary',
          'incentiveCompensation',
          'industry',
          'occupationalCategory',
          'eligibilityToWorkRequirement',
          'securityClearanceRequirement',
          'jobBenefits',
        ]
        const markup = allowed
          .filter((key) => distinct[0][key] !== undefined)
          .map((key) => `${key}: ${readableValue(distinct[0][key])}`)
          .join('\n')
        const fragment = new JSDOM(`<body>${markup}</body>`)
        try {
          fragment.window.document
            .querySelectorAll('script, style')
            .forEach((node) => node.remove())
          fragment.window.document
            .querySelectorAll('p, br, li, div')
            .forEach((node) => node.append('\n'))
          text = fragment.window.document.body.textContent ?? ''
        } finally {
          fragment.window.close()
        }
      } else {
        text = new Readability(dom.window.document).parse()?.textContent ?? ''
      }
      return TextSchema.parse(text)
    } finally {
      dom.window.close()
    }
  }
  throw new JdError('Unable to retrieve this URL. Paste the job ad.')
}
