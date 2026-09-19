"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updateUser,
  changePassword,
  listSessions,
  revokeSession,
  deleteUser,
} from "@/modules/auth/client";
import {
  User as UserIcon,
  KeyRound,
  Laptop,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  Clock,
  Globe,
  AlertTriangle,
  X,
} from "lucide-react";

interface AccountDashboardProps {
  initialUser: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
  };
  currentSessionToken?: string;
}

interface SessionRecord {
  id: string;
  token: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
  expiresAt: Date | string;
}

export function AccountDashboard({
  initialUser,
  currentSessionToken,
}: AccountDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "sessions" | "danger"
  >("profile");

  // Profile form state
  const [name, setName] = useState(initialUser.name || "");
  const [image, setImage] = useState(initialUser.image || "");
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isProfilePending, startProfileTransition] = useTransition();

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordPending, startPasswordTransition] = useTransition();

  // Sessions state
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  // Danger zone state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch active sessions
  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    setSessionsError(null);
    try {
      const response = await listSessions();
      if (response.data) {
        setSessions(response.data as unknown as SessionRecord[]);
      } else if (response.error) {
        setSessionsError(response.error.message || "Could not load sessions.");
      }
    } catch (err: any) {
      setSessionsError(err?.message || "Failed to load sessions.");
    } finally {
      setIsLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === "sessions") {
      fetchSessions();
    }
  }, [activeTab]);

  // Profile update handler
  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (!name.trim()) {
      setProfileError("Display name cannot be empty.");
      return;
    }

    startProfileTransition(async () => {
      try {
        const response = await updateUser({
          name: name.trim(),
          image: image.trim() || undefined,
        });

        if (response.error) {
          setProfileError(response.error.message || "Failed to update profile.");
          return;
        }

        setProfileSuccess("Profile details updated successfully.");
        router.refresh();
      } catch (err: any) {
        setProfileError(err?.message || "An unexpected error occurred.");
      }
    });
  };

  // Password update handler
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError("Please enter your current password.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    startPasswordTransition(async () => {
      try {
        const response = await changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: false,
        });

        if (response.error) {
          setPasswordError(
            response.error.message || "Current password incorrect."
          );
          return;
        }

        setPasswordSuccess("Password changed successfully.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } catch (err: any) {
        setPasswordError(err?.message || "An unexpected error occurred.");
      }
    });
  };

  // Revoke individual session handler
  const handleRevokeSession = async (token: string) => {
    setRevokingToken(token);
    try {
      await revokeSession({ token });
      setSessions((prev) => prev.filter((s) => s.token !== token));
    } catch (err: any) {
      setSessionsError(err?.message || "Failed to revoke session.");
    } finally {
      setRevokingToken(null);
    }
  };

  // Delete user account handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      setDeleteError("Please type DELETE in all caps to confirm.");
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await deleteUser();
      if (response?.error) {
        setDeleteError(response.error.message || "Failed to delete account.");
        setIsDeleting(false);
        return;
      }

      setIsDeleteModalOpen(false);
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setDeleteError(err?.message || "Failed to delete account.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8" data-testid="account-dashboard">
      {/* Header Profile Summary */}
      <div className="rounded-3xl border border-slate-200/80 bg-white/70 p-6 sm:p-8 backdrop-blur-xl shadow-lg dark:border-slate-800/80 dark:bg-slate-900/70 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={name || "User avatar"}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-indigo-500/20 shadow-md"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 text-xl font-bold text-white shadow-md">
                {name ? name.charAt(0).toUpperCase() : "U"}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white" data-testid="user-display-name">
                  {name || "User Profile"}
                </h1>
                {initialUser.role === "admin" && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    <Shield className="h-3 w-3" /> Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{initialUser.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation & Panels */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <aside className="space-y-1.5 md:col-span-1">
          <button
            type="button"
            data-testid="tab-profile"
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition ${
              activeTab === "profile"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
            }`}
          >
            <UserIcon className="h-4 w-4" />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            data-testid="tab-security"
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition ${
              activeTab === "security"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
            }`}
          >
            <KeyRound className="h-4 w-4" />
            <span>Security & Password</span>
          </button>

          <button
            type="button"
            data-testid="tab-sessions"
            onClick={() => setActiveTab("sessions")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition ${
              activeTab === "sessions"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span>Active Sessions</span>
          </button>

          <button
            type="button"
            data-testid="tab-danger"
            onClick={() => setActiveTab("danger")}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition ${
              activeTab === "danger"
                ? "bg-red-600 text-white shadow-md shadow-red-500/20"
                : "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            }`}
          >
            <Trash2 className="h-4 w-4" />
            <span>Danger Zone</span>
          </button>
        </aside>

        {/* Tab Content Panel */}
        <main className="md:col-span-3">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-lg dark:border-slate-800/80 dark:bg-slate-900/80">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Personal Information
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Update your public name and avatar URL used on generated CVs.
              </p>

              {profileSuccess && (
                <div
                  data-testid="profile-success-alert"
                  role="alert"
                  className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div
                  data-testid="profile-error-alert"
                  role="alert"
                  className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="profile-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Display Name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="profile-email"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Email Address
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    disabled
                    value={initialUser.email}
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Email address cannot be changed directly.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="profile-avatar"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Avatar Image URL
                  </label>
                  <input
                    id="profile-avatar"
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isProfilePending}
                    data-testid="profile-save-btn"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isProfilePending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <span>Save Profile Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-lg dark:border-slate-800/80 dark:bg-slate-900/80">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                Change Password
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                Ensure your account is using a secure, long password.
              </p>

              {passwordSuccess && (
                <div
                  data-testid="password-success-alert"
                  role="alert"
                  className="mb-6 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div
                  data-testid="password-error-alert"
                  role="alert"
                  className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Current Password
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    New Password
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirm-new-password"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirm-new-password"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm transition focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isPasswordPending}
                    data-testid="password-update-btn"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isPasswordPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Update Password</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SESSIONS TAB */}
          {activeTab === "sessions" && (
            <div className="rounded-3xl border border-slate-200/80 bg-white/80 p-6 sm:p-8 backdrop-blur-xl shadow-lg dark:border-slate-800/80 dark:bg-slate-900/80">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                    Active Sessions
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Devices and browsers currently authenticated to your account.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={fetchSessions}
                  disabled={isLoadingSessions}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
                >
                  Refresh
                </button>
              </div>

              {sessionsError && (
                <div
                  role="alert"
                  className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
                >
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                  <span>{sessionsError}</span>
                </div>
              )}

              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-12 text-sm text-slate-500">
                  No active remote sessions found.
                </div>
              ) : (
                <div className="space-y-4" data-testid="sessions-list">
                  {sessions.map((s) => {
                    const isCurrent =
                      s.token === currentSessionToken || sessions.length === 1;

                    return (
                      <div
                        key={s.id || s.token}
                        data-testid={`session-item-${s.id || s.token}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/40"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 mt-0.5">
                            <Laptop className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {s.userAgent || "Desktop Browser"}
                              </p>
                              {isCurrent && (
                                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  Current Device
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {s.ipAddress || "Localhost / 127.0.0.1"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(s.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {!isCurrent && (
                          <button
                            type="button"
                            disabled={revokingToken === s.token}
                            onClick={() => handleRevokeSession(s.token)}
                            data-testid={`revoke-session-${s.id || s.token}`}
                            className="inline-flex items-center justify-center rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/40"
                          >
                            {revokingToken === s.token ? "Revoking..." : "Revoke"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* DANGER ZONE TAB */}
          {activeTab === "danger" && (
            <div className="rounded-3xl border border-red-200/80 bg-red-50/30 p-6 sm:p-8 backdrop-blur-xl shadow-lg dark:border-red-900/40 dark:bg-red-950/10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400 shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-red-900 dark:text-red-300">
                    Delete Account
                  </h2>
                  <p className="mt-1 text-sm text-red-700/80 dark:text-red-400/80 leading-relaxed">
                    Permanently delete your user account and all active sessions.
                    This action is irreversible and your identity records will be
                    wiped completely from the system.
                  </p>

                  <div className="mt-6">
                    <button
                      type="button"
                      data-testid="open-delete-modal-btn"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition hover:bg-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete My Account</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div
          data-testid="delete-confirmation-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 font-bold">
                <AlertTriangle className="h-5 w-5" />
                <span>Confirm Account Deletion</span>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
              Are you sure you want to permanently delete your account? To confirm,
              please type <strong className="text-slate-900 dark:text-white">DELETE</strong> below:
            </p>

            {deleteError && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
              >
                {deleteError}
              </div>
            )}

            <input
              type="text"
              data-testid="delete-confirm-input"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white mb-6"
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting || deleteConfirmation !== "DELETE"}
                data-testid="confirm-delete-account-btn"
                onClick={handleDeleteAccount}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
