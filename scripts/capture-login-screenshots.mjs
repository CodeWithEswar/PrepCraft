import { chromium } from "@playwright/test";

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Desktop Login (Default)
  await page.goto("http://localhost:3030/login");
  await page.waitForSelector("h1");
  await page.screenshot({ path: "C:/Users/hp/.gemini/antigravity-ide/brain/d3335c66-35f2-4557-9c7d-2db45d411b7e/scratch/login-desktop.png" });

  // 2. Mobile Login (375x667)
  await page.setViewportSize({ width: 375, height: 667 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "C:/Users/hp/.gemini/antigravity-ide/brain/d3335c66-35f2-4557-9c7d-2db45d411b7e/scratch/login-mobile.png" });

  // 3. Session Expired Alert
  await page.goto("http://localhost:3030/login?reason=session_expired");
  await page.waitForSelector("h1");
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "C:/Users/hp/.gemini/antigravity-ide/brain/d3335c66-35f2-4557-9c7d-2db45d411b7e/scratch/login-session-expired.png" });

  // 4. Remembered Account Returning User
  await page.goto("http://localhost:3030/login");
  await page.evaluate(() => {
    window.localStorage.setItem(
      "prepcraft_last_account",
      JSON.stringify({
        email: "chintu.sharma@gmail.com",
        maskedEmail: "ch••••••••••@gmail.com",
        displayName: "Chintu Sharma",
        lastUsedAt: new Date().toISOString(),
      })
    );
  });
  await page.reload();
  await page.waitForSelector("h1");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "C:/Users/hp/.gemini/antigravity-ide/brain/d3335c66-35f2-4557-9c7d-2db45d411b7e/scratch/login-returning-user.png" });

  await browser.close();
  console.log("All screenshots captured successfully!");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
