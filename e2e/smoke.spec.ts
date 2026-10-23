import { test, expect } from "@playwright/test"

test.describe("Smoke Test", () => {
  test("loads the root layout and page document", async ({ page }) => {
    const response = await page.goto("/")
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(/PrepCraft/)
  })
})
