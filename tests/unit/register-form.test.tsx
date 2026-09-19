/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RegisterForm } from "@/modules/auth/components/register-form";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSignUpEmail = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

vi.mock("@/modules/auth/client", () => ({
  signUp: {
    email: (...args: any[]) => mockSignUpEmail(...args),
  },
}));

describe("RegisterForm (Ticket 03)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows validation error when name is empty", async () => {
    render(<RegisterForm />);

    const submitBtn = screen.getByTestId("register-submit-btn");
    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Please enter your full name/i)
    ).toBeInTheDocument();
  });

  it("shows validation error when email is invalid", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Alex Mercer" },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "invalid-email" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByTestId("register-submit-btn"));

    expect(
      await screen.findByText(/Please enter a valid email address/i)
    ).toBeInTheDocument();
  });

  it("shows validation error when password is too short", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Alex Mercer" },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "short" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "short" },
    });

    fireEvent.click(screen.getByTestId("register-submit-btn"));

    expect(
      await screen.findByText(/Password must be at least 8 characters long/i)
    ).toBeInTheDocument();
  });

  it("shows validation error when passwords do not match", async () => {
    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Alex Mercer" },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "password456" },
    });

    fireEvent.click(screen.getByTestId("register-submit-btn"));

    expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
  });

  it("calls signUp.email with valid inputs and redirects on success", async () => {
    mockSignUpEmail.mockResolvedValueOnce({
      data: {
        user: {
          id: "u1",
          name: "Alex Mercer",
          email: "alex@example.com",
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        session: {
          id: "s1",
          userId: "u1",
          token: "tok",
          expiresAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      error: null,
    });

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Alex Mercer" },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByTestId("register-submit-btn"));

    await waitFor(() => {
      expect(mockSignUpEmail).toHaveBeenCalledWith({
        name: "Alex Mercer",
        email: "alex@example.com",
        password: "password123",
        callbackURL: "/account",
      });
      expect(mockPush).toHaveBeenCalledWith("/account");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("displays error alert when signUp.email returns an error", async () => {
    mockSignUpEmail.mockResolvedValueOnce({
      data: null,
      error: {
        message: "A user with this email already exists.",
        status: 400,
        statusText: "Bad Request",
      },
    });

    render(<RegisterForm />);

    fireEvent.change(screen.getByLabelText(/Full Name/i), {
      target: { value: "Alex Mercer" },
    });
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "alex@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "password123" },
    });

    fireEvent.click(screen.getByTestId("register-submit-btn"));

    expect(
      await screen.findByText(/A user with this email already exists/i)
    ).toBeInTheDocument();
  });
});
