import { after } from 'next/server'
import { processJd, writeJd } from './service'
import type { Jd } from './schema'
export async function scheduleJd(jd: Jd, replacement = false): Promise<Jd> {
  try {
    after(() => processJd(jd, replacement))
    return jd
  } catch {
    const failure = {
      processing: null,
      error: 'Unable to schedule processing. Please retry.',
    }
    return writeJd(
      jd,
      replacement && jd.replacement
        ? { replacement: { ...jd.replacement, ...failure } }
        : failure,
    )
  }
}
