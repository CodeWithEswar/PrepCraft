import { test } from "@playwright/test"

test("capture screenshots for mock interviews", async ({ page }) => {
  // 1. Desktop Mock Home
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/preview/mocks")
  await page.waitForLoadState("networkidle")
  await page.screenshot({ path: "test-results/mock_home_desktop.png", fullPage: true })

  // 2. Pre-flight Dialog
  await page.getByRole("button", { name: "Start Mock" }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: "test-results/mock_preflight_dialog.png" })
  await page.keyboard.press("Escape")

  // 3. Chamber View
  await page.getByRole("button", { name: "2. Interview Chamber" }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: "test-results/mock_chamber_desktop.png" })

  // 4. Debrief & Findings View
  await page.getByRole("button", { name: "3. Debrief & Findings" }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: "test-results/mock_debrief_desktop.png", fullPage: true })

  // 5. Mobile Mock Home
  await page.setViewportSize({ width: 390, height: 844 })
  await page.getByRole("button", { name: "1. Lobby & Composer" }).click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: "test-results/mock_home_mobile.png", fullPage: true })
})
