import { requireUser } from "@/modules/auth/session";
import { AccountDashboard } from "@/modules/auth/components/account-dashboard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Settings — SanityCV",
  description: "Manage your profile, credentials, and active sessions on SanityCV.",
};

export default async function AccountPage() {
  const sessionData = await requireUser();

  return (
    <div className="flex-1 py-10">
      <AccountDashboard
        initialUser={sessionData.user}
        currentSessionToken={sessionData.session?.token}
      />
    </div>
  );
}
