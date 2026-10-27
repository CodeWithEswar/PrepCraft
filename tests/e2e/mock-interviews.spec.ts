import { test, expect } from "@playwright/test"

test.describe("Phase 16: Mock Interviews & OA Simulation Engine", () => {
  test("renders Mock Home with Lobby, Hero, Composer, and Sidebars", async ({ page }) => {
    await page.goto("/preview/mocks")
    await page.waitForLoadState("domcontentloaded")

    // Verify main header and quote
    await expect(page.getByRole("heading", { name: "Mock Interviews & OA Simulator" })).toBeVisible()
    await expect(page.getByText("Practice in realistic conditions")).toBeVisible()

    // Verify category pills
    await expect(page.getByRole("button", { name: /Coding/i }).first()).toBeVisible()
    await expect(page.getByRole("button", { name: /CS Fundamentals/i }).first()).toBeVisible()
    await expect(page.getByRole("button", { name: /Behavioral/i }).first()).toBeVisible()
    await expect(page.getByRole("button", { name: /OA Simulator/i }).first()).toBeVisible()

    // Verify hero recommended brief
    await expect(page.getByRole("heading", { name: "Amazon SDE Technical Mock" })).toBeVisible()
    await expect(page.getByText("Why this mock?")).toBeVisible()
    await expect(page.getByText("Graph evidence is still limited")).toBeVisible()

    // Verify Simulation Composer
    await expect(page.getByRole("heading", { name: "Create Your Mock" })).toBeVisible()
    await expect(page.getByText("Select Sections")).toBeVisible()
    await expect(page.getByText("Configure Settings")).toBeVisible()
    await expect(page.getByText("Session Preview")).toBeVisible()

    // Verify sidebars
    await expect(page.getByText("Your Readiness Overview")).toBeVisible()
    await expect(page.getByText("78%")).toBeVisible()
    await expect(page.getByText("Upcoming Interview")).toBeVisible()
    await expect(page.getByText("Amazon — SDE")).toBeVisible()
    await expect(page.getByText("Recent Mock Sessions", { exact: true })).toBeVisible()
    await expect(page.getByText("Next Week Bridge")).toBeVisible()

    // Verify performance insights
    await expect(page.getByText("Time Management").first()).toBeVisible()
    await expect(page.getByText("Testing").first()).toBeVisible()
  })

  test("can switch to Interview Chamber and inspect session workspace", async ({ page }) => {
    await page.goto("/preview/mocks")
    await page.waitForLoadState("domcontentloaded")

    // Click Chamber view
    await page.getByRole("button", { name: "2. Interview Chamber" }).click()

    // Verify Chamber elements
    await expect(page.getByText("Amazon SDE Technical Mock")).toBeVisible()
    await expect(page.getByLabel(/Time:/i)).toBeVisible()
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible()
    await expect(page.getByRole("complementary", { name: "Question Navigator" })).toBeVisible()

    // Verify question workspace
    await expect(page.getByRole("region", { name: "Response Workspace" })).toBeVisible()
  })

  test("can switch to Debrief & Findings and inspect evidence ledger", async ({ page }) => {
    await page.goto("/preview/mocks")
    await page.waitForLoadState("domcontentloaded")

    // Click Debrief view
    await page.getByRole("button", { name: "3. Debrief & Findings" }).click()

    // Verify debrief elements
    await expect(page.getByText("Debrief & Findings", { exact: true })).toBeVisible()
    await expect(page.getByText("Testing Under Time Pressure")).toBeVisible()
    await expect(page.getByText("Evidence Confidence:")).toBeVisible()
    await expect(page.getByText("What Held Up (Strengths)")).toBeVisible()

    // Verify Performance Facets and no fake communication score
    await expect(page.getByText("Problem Solving")).toBeVisible()
    await expect(page.getByText("Communication", { exact: true })).toBeVisible()
    await expect(page.getByText("Spoken Communication · Not Evaluated")).toBeVisible()

    // Verify Decision Friction, Time Allocation, and Session Replay
    await expect(page.getByText("Decision Friction")).toBeVisible()
    await expect(page.getByText("Time Allocation Map")).toBeVisible()
    await expect(page.getByText("Session Replay")).toBeVisible()
  })
})
