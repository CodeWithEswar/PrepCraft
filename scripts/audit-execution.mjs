import assert from "node:assert/strict"
import fs from "node:fs/promises"
import {createRequire} from "node:module"
import {chromium} from "@playwright/test"
const axe=createRequire(import.meta.url)("axe-core"),browser=await chromium.launch({channel:"chrome",headless:true}),reports=[]
try{
const page=await browser.newPage({viewport:{width:1536,height:864}}),errors=[]
page.on("pageerror",error=>errors.push(error.message))
await page.emulateMedia({reducedMotion:"reduce"})
await page.goto("http://localhost:3030/preview/practice")
await page.getByRole("heading",{name:"Longest substring without repeating characters",exact:true}).waitFor()
for(const mode of ["Practice","Interview practice","OA round","Debrief"]){
  await page.getByRole("navigation",{name:"Preview execution modes"}).getByRole("button",{name:mode,exact:true}).click()
  for(const [width,height] of [[360,800],[390,844],[430,932],[768,1024],[820,1180],[1024,1366],[1280,800],[1440,900],[1536,864],[1920,1080]]){
    await page.setViewportSize({width,height})
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${mode} ${width}: document overflow`)
    const timer=await page.locator(".pc-execution-timer").boundingBox()
    assert(timer&&timer.x>=0&&timer.x+timer.width<=width,`${mode} ${width}: timer clipped`)
  }
  for(const mobile of [false,true]){
    await page.setViewportSize(mobile?{width:390,height:844}:{width:1536,height:864})
    for(const theme of ["light","dark"]){
      const current=await page.locator("html").getAttribute("class")
      if(!current?.split(" ").includes(theme))await page.getByRole("button",{name:"Toggle session color theme"}).click()
      await page.evaluate(()=>document.fonts.ready)
      await page.addScriptTag({content:axe.source})
      const result=await page.evaluate(()=>window.axe.run({exclude:["nextjs-portal"]},{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]}}))
      reports.push({mode,mobile,theme,violations:result.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>({target:node.target,summary:node.failureSummary}))})),clientErrors:[...errors]})
      await page.screenshot({path:`docs/design/workspace/execution-${mode.split(" ")[0].toLowerCase()}-${mobile?"mobile-":""}${theme}.png`,style:"nextjs-portal{display:none!important}"})
    }
    if(mobile&&mode!=="Debrief"){await page.getByRole("button",{name:"Working surface",exact:true}).click();await page.screenshot({path:`docs/design/workspace/execution-${mode.split(" ")[0].toLowerCase()}-mobile-editor.png`,style:"nextjs-portal{display:none!important}"});await page.getByRole("button",{name:"Question",exact:true}).click()}
  }
}
}finally{await browser.close()}
await fs.writeFile("docs/design/workspace/execution-accessibility-audit.json",JSON.stringify({recordedAt:new Date().toISOString(),reports},null,2)+"\n")
for(const report of reports)console.log(JSON.stringify({...report,violations:report.violations.map(item=>({id:item.id,nodes:item.nodes.length}))}))
if(reports.some(report=>report.violations.length||report.clientErrors.length))process.exitCode=1
