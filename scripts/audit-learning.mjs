const origin=process.argv[2]||"http://localhost:3030"
import assert from "node:assert/strict"
import fs from "node:fs/promises"
import { createRequire } from "node:module"
import { chromium } from "@playwright/test"
const axe=createRequire(import.meta.url)("axe-core")
const browser=await chromium.launch({channel:"chrome",headless:true})
const reports=[]
try {
  const page=await browser.newPage({viewport:{width:1536,height:1024}})
  const errors=[];page.on("pageerror",error=>errors.push(error.message))
  await page.emulateMedia({reducedMotion:"reduce"})
  await page.goto(`${origin}/preview/learn`,{timeout:120000})
  await page.getByRole("heading",{name:"Learn",exact:true}).waitFor()
  await page.locator('.pc-learn[data-ready="true"]').waitFor({timeout:30000})
  for(const [width,height] of [[360,800],[390,844],[430,932],[768,1024],[820,1180],[1024,1366],[1280,800],[1440,900],[1536,864],[1920,1080]]) {
    await page.setViewportSize({width,height})
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}: document overflow`)
    assert(await page.locator(".pc-shell-content").evaluate(node=>node.scrollWidth<=node.clientWidth),`${width}: content overflow`)
  }
  for(const mobile of [false,true]) {
    await page.setViewportSize(mobile?{width:390,height:844}:{width:1536,height:1024})
    for(const theme of ["Light","Dark"]) {
      await page.getByRole("button",{name:"Workspace color theme"}).click()
      await page.getByRole("menuitem",{name:theme,exact:true}).click()
      await page.locator('[data-slot="dropdown-menu-content"]').waitFor({state:"detached"})
      await page.addScriptTag({content:axe.source})
      const result=await page.evaluate(async()=>window.axe.run({exclude:["nextjs-portal"]},{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]}}))
      reports.push({mobile,theme,violations:result.violations.map(item=>({id:item.id,impact:item.impact,nodes:item.nodes.map(node=>({target:node.target,summary:node.failureSummary}))})),clientErrors:[...errors]})
      await page.evaluate(()=>document.fonts.ready)
      await page.screenshot({path:`docs/design/workspace/learning-reference-${mobile?"mobile-":""}${theme.toLowerCase()}.png`,style:"nextjs-portal{display:none!important}"})
    }
  }
} finally {await browser.close()}
await fs.writeFile("docs/design/workspace/learning-accessibility-audit.json",JSON.stringify({recordedAt:new Date().toISOString(),reports},null,2)+"\n")
for(const report of reports)console.log(JSON.stringify({...report,violations:report.violations.map(item=>({id:item.id,nodes:item.nodes.length}))}))
if(reports.some(report=>report.violations.length||report.clientErrors.length))process.exitCode=1
