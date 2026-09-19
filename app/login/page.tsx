import { Suspense } from "react";
import { LoginForm } from "@/modules/auth/components/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — SanityCV",
  description: "Sign in to your SanityCV account to manage tailored resumes.",
};

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto h-96 rounded-3xl bg-slate-100 animate-pulse dark:bg-slate-900" />
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
