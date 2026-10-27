import fs from "node:fs/promises"
import { createRequire } from "node:module"
import { chromium } from "@playwright/test"

const axe=createRequire(import.meta.url)("axe-core")
const browser=await chromium.launch({channel:"chrome",headless:true})
const reports=[]
try {
  for(const mobile of [false,true]) {
    const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},hasTouch:mobile,isMobile:mobile})
    const page=await context.newPage()
    const errors=[]
    page.on("pageerror",error=>errors.push(error.message))
    await page.goto("http://localhost:3030/preview")
    for(const theme of ["Light","Dark"]) {
      await page.getByRole("button",{name:"Workspace color theme"}).click()
      await page.getByRole("menuitem",{name:theme,exact:true}).click()
      await page.locator('[data-slot="dropdown-menu-content"]').waitFor({state:"detached"})
      await page.addScriptTag({content:axe.source})
      for(const control of ["select","workspace"]) {
        if(control==="select") await page.getByRole("combobox",{name:"Weekly progress period"}).click()
        else {
          if(mobile) await page.getByRole("button",{name:"Open workspace navigation"}).click()
          await page.locator(".pc-workspace-picker-trigger").filter({visible:true}).click()
        }
        const result=await page.evaluate(async()=>window.axe.run({exclude:["nextjs-portal"]},{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]}}))
        reports.push({mobile,theme,control,violations:result.violations.map(item=>({id:item.id,impact:item.impact,nodes:item.nodes.map(node=>({target:node.target,summary:node.failureSummary}))})),errors:[...errors]})
        if(theme==="Light"&&!mobile) await page.screenshot({path:`docs/design/workspace/${control}-light.png`,style:"nextjs-portal{display:none!important}"})
        await page.keyboard.press("Escape")
        if(control==="workspace"&&mobile) await page.keyboard.press("Escape")
      }
    }
    await context.close()
  }
} finally {await browser.close()}
await fs.writeFile("docs/design/workspace/controls-accessibility-audit.json",JSON.stringify({recordedAt:new Date().toISOString(),reports},null,2)+"\n")
for(const report of reports) console.log(JSON.stringify({...report,violations:report.violations.map(item=>({id:item.id,nodes:item.nodes.length}))}))
if(reports.some(report=>report.violations.length||report.errors.length))process.exitCode=1
