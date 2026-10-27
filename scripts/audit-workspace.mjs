import fs from "node:fs/promises"
import { createRequire } from "node:module"
import { chromium } from "@playwright/test"
const require=createRequire(import.meta.url)
const axe=require("axe-core")
const origin=process.argv[2]||"http://localhost:3030"
const browser=await chromium.launch({channel:"chrome",headless:true})
const reports=[]
try {
  for(const mobile of [false,true]) {
    const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1536,height:960},hasTouch:mobile,isMobile:mobile})
    const page=await context.newPage()
    const errors=[]
    page.on("pageerror",error=>errors.push(error.message))
    await page.goto(`${origin}/preview`)
    await page.waitForLoadState("networkidle")
    for(const theme of ["Light","Dark"]) {
      await page.getByRole("button",{name:"Workspace color theme"}).click()
      await page.getByRole("menuitem",{name:theme,exact:true}).click()
      await page.locator('[data-slot="dropdown-menu-content"]').waitFor({state:"detached"})
      await page.addScriptTag({content:axe.source})
      const result=await page.evaluate(async()=>window.axe.run({exclude:["nextjs-portal"]},{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]}}))
      reports.push({viewport:mobile?"390×844":"1536×960",theme,violations:result.violations.map(item=>({id:item.id,impact:item.impact,nodes:item.nodes.map(node=>({target:node.target,summary:node.failureSummary}))})),passes:result.passes.length,incomplete:result.incomplete.length,errors})
    }
    await context.close()
  }
}finally{await browser.close()}
await fs.writeFile(new URL("../docs/design/workspace/accessibility-audit.json",import.meta.url),JSON.stringify({origin,recordedAt:new Date().toISOString(),reports},null,2)+"\n")
for(const report of reports)console.log(JSON.stringify({viewport:report.viewport,theme:report.theme,violations:report.violations.map(item=>({id:item.id,nodes:item.nodes.length})),errors:report.errors}))
if(reports.some(report=>report.violations.length||report.errors.length))process.exitCode=1
