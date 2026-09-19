import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "@/modules/auth/components/login-form";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSignInEmail = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: (key: string) => (key === "callbackUrl" ? "/account/profile" : null),
  }),
}));

vi.mock("@/modules/auth/client", () => ({
  signIn: {
    email: (...args: any[]) => mockSignInEmail(...args),
  },
}));

describe("LoginForm (Ticket 04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation error when email is invalid", async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "not-an-email" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "secret123" },
    });

    fireEvent.click(screen.getByTestId("login-submit-btn"));

    expect(
      await screen.findByText(/Please enter a valid email address/i)
    ).toBeInTheDocument();
  });

  it("shows validation error when password is empty", async () => {
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "alex@example.com" },
    });

    fireEvent.click(screen.getByTestId("login-submit-btn"));

    expect(
      await screen.findByText(/Please enter your password/i)
    ).toBeInTheDocument();
  });

  it("calls signIn.email and redirects to callbackUrl on success", async () => {
    mockSignInEmail.mockResolvedValueOnce({
      data: {
        user: { id: "u1", email: "alex@example.com" },
      },
      error: null,
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "secret123" },
    });

    fireEvent.click(screen.getByTestId("login-submit-btn"));

    await waitFor(() => {
      expect(mockSignInEmail).toHaveBeenCalledWith({
        email: "alex@example.com",
        password: "secret123",
        callbackURL: "/account/profile",
      });
      expect(mockPush).toHaveBeenCalledWith("/account/profile");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("displays error alert when invalid credentials are provided", async () => {
    mockSignInEmail.mockResolvedValueOnce({
      data: null,
      error: {
        message: "Invalid email or password.",
        status: 401,
      },
    });

    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "wrongpassword" },
    });

    fireEvent.click(screen.getByTestId("login-submit-btn"));

    expect(
      await screen.findByText(/Invalid email or password/i)
    ).toBeInTheDocument();
  });
});
