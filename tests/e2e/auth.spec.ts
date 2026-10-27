import { test, expect } from "@playwright/test"

test.describe("Authentication Surface & Session Protection E2E", () => {
  test("loads the /login page with mineral glass surface and Google OAuth action", async ({ page }) => {
    const response = await page.goto("/login")
    expect(response?.status()).toBe(200)

    // Heading and copy
    await expect(page.getByRole("heading", { name: "Welcome to PrepCraft" })).toBeVisible()
    await expect(page.getByText("Continue where your preparation left off.")).toBeVisible()

    // Google OAuth button
    const googleButton = page.getByRole("button", { name: /continue with google/i })
    await expect(googleButton).toBeVisible()
    await expect(googleButton).toBeEnabled()

    // Security microcopy
    await expect(
      page.getByText(/Your preparation data stays private to your account and authorized workspaces/i)
    ).toBeVisible()

    // Header navigation
    await expect(page.getByRole("link", { name: "PrepCraft Home" })).toBeVisible()
    await expect(page.getByRole("link", { name: /back to home/i })).toBeVisible()
  })

  test("renders session expired alert when reason=session_expired is passed", async ({ page }) => {
    await page.goto("/login?reason=session_expired")
    await expect(page.getByText("Session expired")).toBeVisible()
    await expect(page.getByText(/Your secure session has timed out/i)).toBeVisible()
  })

  test("renders access revoked alert when reason=access_revoked is passed", async ({ page }) => {
    await page.goto("/login?reason=access_revoked&workspace=amazon-sde")
    await expect(page.getByText("Workspace access changed")).toBeVisible()
    await expect(page.getByText(/membership in "amazon-sde" is no longer active/i)).toBeVisible()
  })

  test("middleware protects /w/[slug]/* routes and redirects unauthenticated requests to /login", async ({ page }) => {
    await page.goto("/w/amazon-sde/today")

    // Middleware should redirect to /login with reason and returnTo
    await expect(page).toHaveURL(/\/login\?reason=unauthenticated&returnTo=%2Fw%2Famazon-sde%2Ftoday/)
    await expect(page.getByRole("heading", { name: "Welcome to PrepCraft" })).toBeVisible()
  })

  test("sanitizes open redirect attacks in query params", async ({ page }) => {
    await page.goto("/login?returnTo=https://evil.example.com")

    // The page should load without errors and not redirect to external site
    await expect(page).toHaveURL(/\/login\?returnTo=https:\/\/evil\.example\.com/)
    await expect(page.getByRole("heading", { name: "Welcome to PrepCraft" })).toBeVisible()
  })

  test("renders properly on mobile viewports without horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto("/login")

    await expect(page.getByRole("heading", { name: "Welcome to PrepCraft" })).toBeVisible()
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible()

    // Assert no horizontal scrollbar on body
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalOverflow).toBe(false)
  })

  test("renders properly on tablet viewports", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("/login")

    await expect(page.getByRole("heading", { name: "Welcome to PrepCraft" })).toBeVisible()
    await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible()
  })
})
