const origin=process.argv[2]||"http://localhost:3030"
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { chromium } from '@playwright/test'
const axe=createRequire(import.meta.url)('axe-core'),browser=await chromium.launch({channel:'chrome',headless:true}),reports=[]
try{
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'})
 for(const theme of ['Light','Dark']){
  await page.setViewportSize({width:390,height:844});await page.goto(`${origin}/preview/learn`,{timeout:120000});await page.locator('.pc-learn[data-ready="true"]').waitFor({timeout:30000});await page.getByRole('button',{name:'Workspace color theme'}).click();await page.getByRole('menuitem',{name:theme,exact:true}).click();await page.locator('[data-slot="dropdown-menu-content"]').waitFor({state:'detached'});
  await page.locator('.pc-learn-concept-path').getByRole('button',{name:/Prime and composite numbers/}).click();const drawer=page.getByRole('dialog',{name:'Concept lens',exact:true});await drawer.waitFor();await page.addScriptTag({content:axe.source});
  for(const tab of ['Learn','Examples','Practice','Interview','Notes']){await drawer.getByRole('tab',{name:tab,exact:true}).click();const result=await page.evaluate(async()=>window.axe.run({exclude:['nextjs-portal']},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));reports.push({surface:'mobile drawer',theme,tab,violations:result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});assert(await drawer.evaluate(n=>n.scrollWidth<=n.clientWidth),'drawer overflow')}
  await drawer.getByRole('tab',{name:'Learn',exact:true}).click();await page.screenshot({path:`docs/design/workspace/learning-concept-mobile-${theme.toLowerCase()}.png`});await page.keyboard.press('Escape')
  for(const [width,height] of [[390,844],[1440,900]]){
   await page.setViewportSize({width,height});await page.goto(`${origin}/preview/learn/concept/learn-operating-systems-cpu-scheduling-core`,{timeout:120000});await page.getByRole('heading',{name:'See the waiting time.',exact:true}).waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'reading overflow');await page.addScriptTag({content:axe.source});const result=await page.evaluate(async()=>window.axe.run({exclude:['nextjs-portal']},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));reports.push({surface:'concept with scheduler',theme,width,violations:result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});await page.screenshot({path:`docs/design/workspace/learning-reading-${width}-${theme.toLowerCase()}.png`})
  }
 }
 if(errors.length)reports.push({clientErrors:errors})
}finally{await browser.close()}
await fs.writeFile('docs/design/workspace/learning-details-accessibility-audit.json',JSON.stringify({recordedAt:new Date().toISOString(),reports},null,2)+'\n');for(const r of reports)console.log(JSON.stringify({...r,violations:r.violations?.map(v=>({id:v.id,count:v.nodes.length}))}));if(reports.some(r=>r.violations?.length||r.clientErrors?.length))process.exitCode=1
