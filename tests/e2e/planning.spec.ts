import { test,expect } from "@playwright/test"
test("Planning reference responds across desktop, tablet and mobile and opens day details",async({page})=>{
  test.setTimeout(90000)
  await page.emulateMedia({reducedMotion:"reduce"})
  await page.goto("/preview/plan")
  await expect(page.getByRole("heading",{name:"Plan Your Preparation"})).toBeVisible()
  for(const [width,height] of [[360,800],[390,844],[430,932],[768,1024],[820,1180],[1024,768],[1440,900],[1920,1080]]){
    await page.setViewportSize({width,height})
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    expect(await page.locator(".pc-shell-content").evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true)
  }
  await page.setViewportSize({width:390,height:844})
  const days=page.locator(".pc-plan-day-picker button")
  await days.first().click()
  await expect(page.locator(".pc-plan-day[data-selected=true]")).toHaveCount(1)
  await expect(page.locator(".pc-plan-day:visible")).toHaveCount(1)
  await page.getByRole("button",{name:"Calendar",exact:true}).click()
  await page.locator(".pc-plan-month-grid>button").nth(10).click()
  await expect(page.getByRole("dialog")).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByRole("button",{name:"Review",exact:true}).click()
  await expect(page.getByRole("button",{name:"Close and save weekly review"})).toBeDisabled()
  await expect(page.getByRole("button",{name:"Sign in to plan",exact:true})).toBeVisible()
})
