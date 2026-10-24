import fs from "node:fs/promises"
import path from "node:path"
import { createRequire } from "node:module"
import { chromium } from "@playwright/test"
const require = createRequire(import.meta.url)
const axe = require("axe-core")
const origin = process.argv[2] || "http://localhost:3031"
const output = path.resolve(import.meta.dirname,"../docs/design")
const browser = await chromium.launch({channel:"chrome",headless:true})
const reports = []
try {
  for (const mobile of [false,true]) {
    const context = await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1})
    await context.addInitScript(() => {
      window.__lab = {lcp:0,cls:0,events:[],errors:[]}
      new PerformanceObserver(list => { for(const entry of list.getEntries()) window.__lab.lcp = entry.startTime }).observe({type:"largest-contentful-paint",buffered:true})
      new PerformanceObserver(list => { for(const entry of list.getEntries()) if(!entry.hadRecentInput) window.__lab.cls += entry.value }).observe({type:"layout-shift",buffered:true})
      new PerformanceObserver(list => { for(const entry of list.getEntries()) window.__lab.events.push(entry.duration) }).observe({type:"event",buffered:true,durationThreshold:16})
    })
    const page = await context.newPage()
    const errors=[]
    page.on("pageerror",error=>errors.push(error.message))
    await page.goto(origin)
    await page.waitForLoadState("networkidle")
    await page.waitForFunction(() => document.fonts.status === "loaded")
    // Observe layout stability after image and font decoding settles.
    await page.waitForTimeout(600)
    const lab = await page.evaluate(() => ({...window.__lab,canvas:document.querySelectorAll("canvas").length,webglReady:Boolean(document.querySelector(".mk-cinematic-ready")),navigation:performance.getEntriesByType("navigation").map(n=>({domContentLoadedMs:n.domContentLoadedEventEnd,loadMs:n.loadEventEnd})),resources:performance.getEntriesByType("resource").map(r=>({url:r.name.split(location.origin).at(-1),type:r.initiatorType,transferBytes:r.transferSize,decodedBytes:r.decodedBodySize})),domNodes:document.querySelectorAll("*").length}))
    const audits=[]
    for(const theme of ["Light","Dark"]) {
      await page.getByRole("button",{name:"Choose color theme"}).click()
      await page.getByRole("menuitem",{name:theme,exact:true}).click()
      // Audit the settled page after the popup's exit animation unmounts its
      // focus guards, rather than capturing a transient menu teardown state.
      await page.locator('[data-slot="dropdown-menu-content"]').waitFor({state:"detached"})
      await page.waitForFunction(expected => document.documentElement.classList.contains(expected), theme.toLowerCase())
      await page.addScriptTag({content:axe.source})
      const result = await page.evaluate(async()=>window.axe.run({exclude:["nextjs-portal"]},{runOnly:{type:"tag",values:["wcag2a","wcag2aa","wcag21a","wcag21aa","wcag22aa"]}}))
      audits.push({theme,violations:result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),passes:result.passes.length,incomplete:result.incomplete.length})
    }
    const events = await page.evaluate(()=>window.__lab.events)
    reports.push({viewport:mobile?"390×844 touch":"1440×900 desktop",lab,interactionEventDurationsMs:events,clientErrors:errors,audits})
    await context.close()
  }
} finally { await browser.close() }
const result={recordedAt:new Date().toISOString(),origin,browser:"installed Chrome",measurement:"Single local production lab run, unthrottled. LCP/CLS and event durations are lab observations; these are not field Core Web Vitals or INP.",reports}
await fs.writeFile(path.join(output,"MARKETING-AUDIT.json"),JSON.stringify(result,null,2)+"\n")
for(const report of reports) console.log(JSON.stringify({viewport:report.viewport,lcpMs:Math.round(report.lab.lcp),cls:report.lab.cls,canvas:report.lab.canvas,webglReady:report.lab.webglReady,jsTransferKiB:Math.round(report.lab.resources.filter(r=>r.url.endsWith(".js")).reduce((n,r)=>n+r.transferBytes,0)/1024),violations:report.audits.map(a=>({theme:a.theme,count:a.violations.length})),errors:report.clientErrors}))
if(reports.some(r=>r.clientErrors.length||r.audits.some(a=>a.violations.length))) process.exitCode=1
