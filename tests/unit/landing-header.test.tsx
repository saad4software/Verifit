import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Home from "@/app/page";
import { Header } from "@/components/header";
import * as authClient from "@/modules/auth/client";

// Mock Next.js router and navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("Landing Page & Global Shell (Ticket 02)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders landing page hero section with heading and CTAs", () => {
    render(<Home />);

    expect(screen.getByTestId("hero")).toBeInTheDocument();
    expect(
      screen.getByText(/Craft resumes that win interviews/i)
    ).toBeInTheDocument();

    const registerCta = screen.getByTestId("hero-cta-register");
    expect(registerCta).toBeInTheDocument();
    expect(registerCta).toHaveAttribute("href", "/register");

    const loginCta = screen.getByTestId("hero-cta-login");
    expect(loginCta).toBeInTheDocument();
    expect(loginCta).toHaveAttribute("href", "/login");

    expect(screen.getByTestId("features-section")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Headless Sanity CMS/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /LibSQL & Drizzle ORM/i })
    ).toBeInTheDocument();
  });

  it("renders global header in guest state with sign in and register anchors", () => {
    vi.spyOn(authClient, "useSession").mockReturnValue({
      data: null,
      isPending: false,
      error: null,
    } as any);

    render(<Header />);

    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("header-brand")).toHaveAttribute("href", "/");
    expect(screen.getByTestId("nav-login")).toHaveAttribute("href", "/login");
    expect(screen.getByTestId("nav-register")).toHaveAttribute(
      "href",
      "/register"
    );
  });

  it("renders global header in authenticated state with user menu and options", () => {
    vi.spyOn(authClient, "useSession").mockReturnValue({
      data: {
        user: {
          id: "u1",
          name: "Alex Mercer",
          email: "alex@example.com",
          role: "admin",
          image: null,
        },
        session: {
          id: "s1",
          userId: "u1",
          expiresAt: new Date(),
          token: "tok",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
      isPending: false,
      error: null,
    } as any);

    render(<Header />);

    const userMenuButton = screen.getByTestId("user-menu");
    expect(userMenuButton).toBeInTheDocument();
    expect(screen.getByText("Alex Mercer")).toBeInTheDocument();
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();

    // Click user menu to open dropdown
    fireEvent.click(userMenuButton);

    expect(screen.getByTestId("nav-account")).toHaveAttribute("href", "/account");
    expect(screen.getByTestId("nav-signout")).toBeInTheDocument();
  });
});
