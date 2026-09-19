import { test, expect } from "@playwright/test";

test.describe("SanityCV Auth & Account Management User Journeys (Ticket 06)", () => {
  const timestamp = Date.now();
  const testUser = {
    name: "Alex Mercer",
    email: `alex_${timestamp}@example.com`,
    password: "Password123!",
    updatedName: "Alex Mercer Senior",
  };

  test("visitor discovers landing page and navigates to register", async ({
    page,
  }) => {
    await page.goto("/");

    // Verify landing page hero content and elements
    await expect(page.getByTestId("hero")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Craft resumes that win interviews/i })
    ).toBeVisible();
    await expect(page.getByTestId("features-section")).toBeVisible();

    // Click hero CTA to register
    await page.getByTestId("hero-cta-register").click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByTestId("register-form")).toBeVisible();
  });

  test("visitor registers, establishes immediate session, and views header state", async ({
    page,
  }) => {
    await page.goto("/register");

    // Fill registration form
    await page.fill("#name", testUser.name);
    await page.fill("#email", testUser.email);
    await page.fill("#password", testUser.password);
    await page.fill("#confirmPassword", testUser.password);

    await page.getByTestId("register-submit-btn").click();

    // Redirects directly to account dashboard
    await expect(page).toHaveURL(/\/account/, { timeout: 15000 });
    await expect(page.getByTestId("account-dashboard")).toBeVisible();

    // Verify header reflects authenticated user
    const userMenu = page.getByTestId("user-menu");
    await expect(userMenu).toBeVisible();
    await expect(userMenu).toContainText(testUser.name);
  });

  test("authenticated user updates profile display name and it persists across reload", async ({
    page,
  }) => {
    // Sign in first
    await page.goto("/login");
    await page.fill("#email", testUser.email);
    await page.fill("#password", testUser.password);
    await page.getByTestId("login-submit-btn").click();

    await expect(page).toHaveURL(/\/account/, { timeout: 15000 });
    await expect(page.getByTestId("account-dashboard")).toBeVisible();

    // Change display name
    const nameInput = page.locator("#profile-name");
    await nameInput.clear();
    await nameInput.fill(testUser.updatedName);
    await page.getByTestId("profile-save-btn").click();

    // Check success notification
    await expect(page.getByTestId("profile-success-alert")).toBeVisible();

    // Reload page and check persistence
    await page.reload();
    await expect(page.getByTestId("user-display-name")).toHaveText(
      testUser.updatedName
    );
    await expect(page.getByTestId("user-menu")).toContainText(
      testUser.updatedName
    );
  });

  test("user signs out and middleware guards protected routes", async ({
    page,
  }) => {
    // Sign in first
    await page.goto("/login");
    await page.fill("#email", testUser.email);
    await page.fill("#password", testUser.password);
    await page.getByTestId("login-submit-btn").click();
    await expect(page).toHaveURL(/\/account/, { timeout: 15000 });

    // Open user menu in header and sign out
    await page.getByTestId("user-menu").click();
    await page.getByTestId("nav-signout").click();

    // Should redirect to home page
    await expect(page).toHaveURL("/");
    await expect(page.getByTestId("nav-login")).toBeVisible();
    await expect(page.getByTestId("nav-register")).toBeVisible();

    // Attempt to navigate to /account should be intercepted by middleware
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Faccount/);
  });
});
