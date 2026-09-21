import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireUser } from '@/modules/auth/session'
import { JdImport } from '@/modules/jds/components/jd-import'

export const metadata: Metadata = {
  title: 'Import Job Description — Verifit',
  description: 'Import and structure a job description using Sanity AI.',
}

export default async function ImportJdPage() {
  await requireUser()

  return (
    <div className="flex-1 py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard/jds"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition dark:text-slate-400 dark:hover:text-indigo-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Job Descriptions</span>
        </Link>

        <JdImport />
      </div>
    </div>
  )
}
