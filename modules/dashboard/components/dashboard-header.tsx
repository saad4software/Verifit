'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from '@/modules/auth/client'
import {
  Sparkles,
  FileText,
  Briefcase,
  Layers,
  User as UserIcon,
  LogOut,
  Shield,
  Menu,
  X,
} from 'lucide-react'

interface DashboardHeaderProps {
  user: {
    id: string
    name?: string | null
    email: string
    role?: string | null
    image?: string | null
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
    setIsMobileNavOpen(false)
    router.push('/')
    router.refresh()
  }

  const isCvsActive = pathname?.startsWith('/dashboard/cvs')
  const isJdsActive = pathname?.startsWith('/dashboard/jds')
  const isApplicationsActive = pathname?.startsWith('/dashboard/applications')

  return (
    <header
      data-testid="dashboard-header"
      className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/85 print:hidden"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/cvs"
            data-testid="dashboard-brand"
            className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 text-white shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/30">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Veri<span className="text-indigo-600 dark:text-indigo-400">fit</span>
                </span>
                <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  Dashboard
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Center Navigation Tabs: My Resumes, Job Descriptions, Applications */}
        <nav
          className="hidden md:flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-1 dark:border-slate-800/80 dark:bg-slate-900/60"
          aria-label="Dashboard views"
          data-testid="dashboard-nav"
        >
          <Link
            href="/dashboard/cvs"
            data-testid="dashboard-nav-cvs"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              isCvsActive
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FileText className={`h-4 w-4 ${isCvsActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
            <span>My Resumes</span>
          </Link>

          <Link
            href="/dashboard/jds"
            data-testid="dashboard-nav-jds"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              isJdsActive
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Briefcase className={`h-4 w-4 ${isJdsActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
            <span>Job Descriptions</span>
          </Link>

          <Link
            href="/dashboard/applications"
            data-testid="dashboard-nav-applications"
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-150 ${
              isApplicationsActive
                ? 'bg-white text-indigo-600 shadow-xs dark:bg-slate-800 dark:text-indigo-300'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Layers className={`h-4 w-4 ${isApplicationsActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
            <span>Applications</span>
          </Link>
        </nav>

        {/* Right side: User Dropdown & Mobile Toggle */}
        <div className="flex items-center gap-3">
          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              data-testid="dashboard-user-menu"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white/60 py-1.5 pl-2 pr-3 text-sm font-medium text-slate-700 shadow-xs transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name || 'User avatar'}
                  className="h-7 w-7 rounded-full object-cover ring-1 ring-indigo-500"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-xs font-semibold text-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              <span className="hidden sm:inline-block max-w-[120px] truncate font-medium">
                {user.name || user.email}
              </span>
              {user.role === 'admin' && (
                <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
            </button>

            {isMenuOpen && (
              <div
                data-testid="dashboard-user-dropdown"
                className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150 z-50"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>
                <Link
                  href="/account"
                  data-testid="dashboard-dropdown-account"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  <UserIcon className="h-4 w-4 text-indigo-500" />
                  Account Settings
                </Link>
                <button
                  type="button"
                  data-testid="dashboard-dropdown-signout"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            data-testid="dashboard-mobile-menu-toggle"
            onClick={() => setIsMobileNavOpen((prev) => !prev)}
            className="md:hidden flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            aria-label="Toggle navigation"
          >
            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {isMobileNavOpen && (
        <div
          data-testid="dashboard-mobile-nav"
          className="md:hidden border-t border-slate-200 bg-white/95 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/95 space-y-1 animate-in slide-in-from-top-2 duration-150"
        >
          <Link
            href="/dashboard/cvs"
            data-testid="dashboard-mobile-nav-cvs"
            onClick={() => setIsMobileNavOpen(false)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${
              isCvsActive
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>My Resumes</span>
          </Link>
          <Link
            href="/dashboard/jds"
            data-testid="dashboard-mobile-nav-jds"
            onClick={() => setIsMobileNavOpen(false)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${
              isJdsActive
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Job Descriptions</span>
          </Link>
          <Link
            href="/dashboard/applications"
            data-testid="dashboard-mobile-nav-applications"
            onClick={() => setIsMobileNavOpen(false)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold ${
              isApplicationsActive
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Applications</span>
          </Link>
        </div>
      )}
    </header>
  )
}
