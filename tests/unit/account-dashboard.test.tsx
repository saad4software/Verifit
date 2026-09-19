import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AccountDashboard } from "@/modules/auth/components/account-dashboard";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockUpdateUser = vi.fn();
const mockChangePassword = vi.fn();
const mockListSessions = vi.fn();
const mockRevokeSession = vi.fn();
const mockDeleteUser = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/modules/auth/client", () => ({
  updateUser: (...args: any[]) => mockUpdateUser(...args),
  changePassword: (...args: any[]) => mockChangePassword(...args),
  listSessions: (...args: any[]) => mockListSessions(...args),
  revokeSession: (...args: any[]) => mockRevokeSession(...args),
  deleteUser: (...args: any[]) => mockDeleteUser(...args),
}));

const testUser = {
  id: "u123",
  name: "Morgan Stark",
  email: "morgan@example.com",
  role: "user",
  image: null,
};

describe("AccountDashboard (Ticket 05)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders profile details and initial user info", () => {
    render(
      <AccountDashboard initialUser={testUser} currentSessionToken="tok_cur" />
    );

    expect(screen.getByTestId("account-dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("user-display-name")).toHaveTextContent(
      "Morgan Stark"
    );
    expect(screen.getByText("morgan@example.com")).toBeInTheDocument();
    expect(screen.getByLabelText(/Display Name/i)).toHaveValue("Morgan Stark");
  });

  it("updates user profile name on submit", async () => {
    mockUpdateUser.mockResolvedValueOnce({
      data: { user: { ...testUser, name: "Morgan H. Stark" } },
      error: null,
    });

    render(
      <AccountDashboard initialUser={testUser} currentSessionToken="tok_cur" />
    );

    const nameInput = screen.getByLabelText(/Display Name/i);
    fireEvent.change(nameInput, { target: { value: "Morgan H. Stark" } });

    fireEvent.click(screen.getByTestId("profile-save-btn"));

    await waitFor(() => {
      expect(mockUpdateUser).toHaveBeenCalledWith({
        name: "Morgan H. Stark",
        image: undefined,
      });
      expect(
        screen.getByTestId("profile-success-alert")
      ).toHaveTextContent(/Profile details updated successfully/i);
    });
  });

  it("validates password change fields and submits update", async () => {
    mockChangePassword.mockResolvedValueOnce({
      data: { success: true },
      error: null,
    });

    render(
      <AccountDashboard initialUser={testUser} currentSessionToken="tok_cur" />
    );

    // Switch to Security tab
    fireEvent.click(screen.getByTestId("tab-security"));

    // Validation: empty current password
    fireEvent.click(screen.getByTestId("password-update-btn"));
    expect(
      await screen.findByText(/Please enter your current password/i)
    ).toBeInTheDocument();

    // Fill valid passwords
    fireEvent.change(screen.getByLabelText(/Current Password/i), {
      target: { value: "old_pass_123" },
    });
    fireEvent.change(screen.getByLabelText(/^New Password/i), {
      target: { value: "new_pass_456" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm New Password/i), {
      target: { value: "new_pass_456" },
    });

    fireEvent.click(screen.getByTestId("password-update-btn"));

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: "old_pass_123",
        newPassword: "new_pass_456",
        revokeOtherSessions: false,
      });
      expect(
        screen.getByTestId("password-success-alert")
      ).toHaveTextContent(/Password changed successfully/i);
    });
  });

  it("loads sessions and revokes a remote session", async () => {
    mockListSessions.mockResolvedValueOnce({
      data: [
        {
          id: "s1",
          token: "tok_cur",
          userAgent: "Chrome on macOS",
          ipAddress: "127.0.0.1",
          createdAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
        },
        {
          id: "s2",
          token: "tok_remote",
          userAgent: "Safari on iPhone",
          ipAddress: "192.168.1.5",
          createdAt: new Date().toISOString(),
          expiresAt: new Date().toISOString(),
        },
      ],
      error: null,
    });
    mockRevokeSession.mockResolvedValueOnce({ data: { success: true } });

    render(
      <AccountDashboard initialUser={testUser} currentSessionToken="tok_cur" />
    );

    fireEvent.click(screen.getByTestId("tab-sessions"));

    expect(await screen.findByText("Chrome on macOS")).toBeInTheDocument();
    expect(screen.getByText("Safari on iPhone")).toBeInTheDocument();

    const revokeBtn = screen.getByTestId("revoke-session-s2");
    fireEvent.click(revokeBtn);

    await waitFor(() => {
      expect(mockRevokeSession).toHaveBeenCalledWith({ token: "tok_remote" });
    });
  });

  it("requires DELETE confirmation in Danger Zone and deletes user", async () => {
    mockDeleteUser.mockResolvedValueOnce({ data: { success: true }, error: null });

    render(
      <AccountDashboard initialUser={testUser} currentSessionToken="tok_cur" />
    );

    // Switch to danger zone
    fireEvent.click(screen.getByTestId("tab-danger"));

    // Open delete modal
    fireEvent.click(screen.getByTestId("open-delete-modal-btn"));
    expect(
      screen.getByTestId("delete-confirmation-modal")
    ).toBeInTheDocument();

    const deleteBtn = screen.getByTestId("confirm-delete-account-btn");
    expect(deleteBtn).toBeDisabled();

    // Type incorrect confirmation
    fireEvent.change(screen.getByTestId("delete-confirm-input"), {
      target: { value: "delete" },
    });
    expect(deleteBtn).toBeDisabled();

    // Type correct uppercase DELETE
    fireEvent.change(screen.getByTestId("delete-confirm-input"), {
      target: { value: "DELETE" },
    });
    expect(deleteBtn).not.toBeDisabled();

    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(mockDeleteUser).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
