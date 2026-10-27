import assert from "node:assert/strict"
import fs from "node:fs/promises"
import {createRequire} from "node:module"
import {chromium} from "@playwright/test"
const axe=createRequire(import.meta.url)("axe-core"),browser=await chromium.launch({channel:"chrome",headless:true}),reports=[]
try {
 const page=await browser.newPage({viewport:{width:390,height:844}})
 await page.emulateMedia({reducedMotion:"reduce"})
 for(const feature of ["revision","mastery"]){
  await page.goto(`http://localhost:3030/preview/${feature==="mastery"?"progress":"revision"}`,{timeout:120000})
  await page.locator(`.pc-${feature}[data-ready="true"]`).waitFor()
  for(const theme of ["Light","Dark"]){
   await page.getByRole("button",{name:"Workspace color theme"}).click()
   await page.getByRole("menuitem",{name:theme,exact:true}).click()
   await page.locator('[data-slot="dropdown-menu-content"]').waitFor({state:"detached"})
   if(feature==="mastery")await page.locator(".pc-mastery-terrain").getByRole("button",{name:/Sliding Window Developing/}).click()
   else await page.getByRole("button",{name:"Two Sum Arrays · easy",exact:true}).click()
   const drawer=page.getByRole("dialog",{name:feature==="mastery"?"Evidence Lens":"Revision evidence",exact:true})
   await drawer.waitFor()
   if(feature==="mastery")await drawer.getByRole("button",{name:/Independent Solving/}).click()
   await page.addScriptTag({content:axe.source})
   const result=await page.evaluate(async()=>window.axe.run({exclude:["nextjs-portal"]},{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]}}))
   assert(await drawer.evaluate(node=>node.scrollWidth<=node.clientWidth),`${feature} ${theme}: drawer overflow`)
   reports.push({feature,theme,violations:result.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>({target:node.target,summary:node.failureSummary}))}))})
   await page.screenshot({path:`docs/design/workspace/${feature}-evidence-mobile-${theme.toLowerCase()}.png`})
   await page.keyboard.press("Escape")
   await drawer.waitFor({state:"hidden"})
  }
 }
}finally{await browser.close()}
await fs.writeFile("docs/design/workspace/evidence-drawers-accessibility-audit.json",JSON.stringify({recordedAt:new Date().toISOString(),reports},null,2)+"\n")
for(const report of reports)console.log(JSON.stringify({feature:report.feature,theme:report.theme,violations:report.violations.length}))
if(reports.some(report=>report.violations.length))process.exitCode=1
