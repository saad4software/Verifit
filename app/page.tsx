import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  FileCheck2,
  Lock,
  Cpu,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Section */}
      <section
        data-testid="hero"
        className="relative overflow-hidden pt-20 pb-28 md:pt-28 md:pb-36"
      >
        {/* Background ambient lighting */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-500/20 via-blue-500/20 to-purple-500/10 blur-3xl opacity-70" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/60 px-3.5 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur-md dark:border-indigo-900/60 dark:bg-indigo-950/40 dark:text-indigo-300 mb-8">
              <Sparkles className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Intelligent CV Tailoring Powered by Sanity CMS</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              Craft resumes that win interviews,{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
                tailored in seconds.
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
              Manage your career history once with structured headless Sanity CMS
              content, and generate targeted, ATS-optimized CVs for any job offer
              instantly.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                data-testid="hero-cta-register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:from-indigo-500 hover:to-blue-500 hover:shadow-indigo-500/35 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Start Tailoring Free</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                data-testid="hero-cta-login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Sign In
              </Link>
            </div>

            {/* Trust highlights */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Zero vendor lock-in</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>LibSQL local persistence</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Sanity Studio headless schemas</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Showcase / Preview */}
      <section className="relative px-4 sm:px-6 lg:px-8 -mt-8 mb-24">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200/80 bg-white/60 p-3 shadow-2xl shadow-slate-300/40 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 dark:shadow-black/50">
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-slate-900 text-slate-100 p-6 sm:p-10 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Live Tailoring Preview
                  </span>
                </div>
                <h3 className="text-xl font-bold mt-1 text-white">
                  Senior Staff Engineer — Distributed Systems
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-indigo-500/20 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/30">
                  98% Match Score
                </span>
                <span className="rounded-lg bg-blue-500/20 px-3 py-1 text-xs font-medium text-blue-300 border border-blue-500/30">
                  Sanity Sync Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Targeted Keywords
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {["Kubernetes", "Next.js", "Drizzle", "High Throughput", "LibSQL", "Go", "TypeScript"].map((k) => (
                    <span key={k} className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300 border border-slate-700">
                      {k}
                    </span>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Dynamically Tailored Highlights
                </h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>
                      Architected zero-latency SQLite persistence pipeline handling 10,000 req/sec using Drizzle ORM.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>
                      Streamlined headless content synchronization across multiple career variants via Sanity Studio schemas.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        id="features"
        data-testid="features-section"
        className="py-20 bg-white dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Engineered for Modern Careers
            </h2>
            <p className="mt-4 text-base text-slate-600 dark:text-slate-300">
              Verifit pairs a battle-tested Next.js App Router architecture with
              headless Sanity CMS and lightweight SQLite persistence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-7 transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mb-5">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Headless Sanity CMS
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Structure skills, work experiences, education, and credentials cleanly in Sanity Studio without mixing presentation and data.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-7 transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 mb-5">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Intelligent Tailoring
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Highlight relevant achievements and keywords based on specific job descriptions to pass ATS filters effortlessly.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-7 transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 mb-5">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                LibSQL & Drizzle ORM
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Zero-setup local SQLite file storage in development and Turso-ready cloud support with deterministic versioned migrations.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-7 transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 mb-5">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Better Auth Security
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Modern cookie-based session management, instant registration, multi-session inspection, and granular role support.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-7 transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-950/60 dark:text-cyan-400 mb-5">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Live Preview & PDF Export
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Inspect changes in real time and generate pixel-perfect, printer-friendly PDFs ready for immediate application submission.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-7 transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 mb-5">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Account Self-Service
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Full user autonomy: edit your personal branding, update credentials, monitor active browser sessions, and revoke remote access.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200/80 bg-white/40 py-8 dark:border-slate-800/80 dark:bg-slate-950/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Verifit. Intelligent CV tailoring powered by Sanity CMS.</p>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400">Sign In</Link>
            <Link href="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
