import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { requireUser } from '@/modules/auth/session'
import { ImportForm } from '@/modules/cvs/components/import-form'

export const metadata: Metadata = {
  title: 'Import CV — SanityCV',
  description: 'Import your existing resume or CV for automated structuring with Sanity AI.',
}

export default async function ImportCvPage() {
  await requireUser()

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl mb-6">
        <Link
          href="/cvs"
          data-testid="back-to-cvs-link"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition dark:text-slate-400 dark:hover:text-indigo-400"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to My CVs</span>
        </Link>
      </div>

      <ImportForm />
    </div>
  )
}
