import { requireUser } from '@/modules/auth/session'
import { DashboardHeader } from '@/modules/dashboard/components/dashboard-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const sessionData = await requireUser()

  return (
    <div
      className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 font-sans print:min-h-0 print:bg-white print:block"
      data-testid="dashboard-layout"
    >
      <DashboardHeader user={sessionData.user} />
      <div className="flex-1 flex flex-col py-8 print:py-0 print:block">{children}</div>
    </div>
  )
}
