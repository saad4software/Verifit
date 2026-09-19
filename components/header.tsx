"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "@/modules/auth/client";
import { Sparkles, User as UserIcon, LogOut, Shield } from "lucide-react";
import { useState } from "react";

export function Header() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header
      data-testid="header"
      className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link
          href="/"
          data-testid="header-brand"
          className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 text-white shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Sanity<span className="text-indigo-600 dark:text-indigo-400">CV</span>
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 -mt-1 tracking-wider uppercase">
              Intelligent Tailoring
            </span>
          </div>
        </Link>

        {/* Center navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/#features"
            className="text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
          >
            Features
          </Link>
          <Link
            href="/#how-it-works"
            className="text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400"
          >
            How it Works
          </Link>
          <Link
            href="/studio"
            className="text-sm font-medium text-slate-600 transition hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 flex items-center gap-1.5"
          >
            Sanity Studio
          </Link>
        </nav>

        {/* Right side auth buttons or user menu */}
        <div className="flex items-center gap-3">
          {isPending ? (
            <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ) : session?.user ? (
            <div className="relative">
              <button
                type="button"
                data-testid="user-menu"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white/50 py-1.5 pl-2 pr-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User avatar"}
                    className="h-7 w-7 rounded-full object-cover ring-1 ring-indigo-500"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-xs font-semibold text-white">
                    {session.user.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <span className="hidden sm:inline-block max-w-[120px] truncate font-medium">
                  {session.user.name || session.user.email}
                </span>
                {session.user.role === "admin" && (
                  <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                )}
              </button>

              {isMenuOpen && (
                <div
                  data-testid="user-dropdown"
                  className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {session.user.name || "User"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {session.user.email}
                    </p>
                  </div>
                  <Link
                    href="/account"
                    data-testid="nav-account"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <UserIcon className="h-4 w-4 text-indigo-500" />
                    Account Settings
                  </Link>
                  <button
                    type="button"
                    data-testid="nav-signout"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                data-testid="nav-login"
                className="rounded-xl px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-indigo-600 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-indigo-400"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                data-testid="nav-register"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/20 transition hover:from-indigo-500 hover:to-blue-500 hover:shadow-indigo-500/30"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
