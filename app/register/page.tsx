import { Suspense } from "react";
import { RegisterForm } from "@/modules/auth/components/register-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register — Verifit",
  description: "Create your Verifit account to start crafting tailored resumes.",
};

export default function RegisterPage() {
  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto h-96 rounded-3xl bg-slate-100 animate-pulse dark:bg-slate-900" />
        }
      >
        <RegisterForm />
      </Suspense>
    </div>
  );
}
