import assert from "node:assert/strict"
import fs from "node:fs/promises"
import {chromium} from "@playwright/test"
const browser=await chromium.launch({channel:"chrome",headless:true}),reports=[]
try {
 const page=await browser.newPage({viewport:{width:1536,height:1024}})
 await page.emulateMedia({reducedMotion:"reduce"})
 await page.goto("http://localhost:3030/preview/revision",{timeout:120000})
 await page.locator('.pc-revision[data-ready="true"]').waitFor()
 for(const width of [240,280,310,350,390,480]){
  await page.locator(".pc-revision").evaluate((node,width)=>{node.style.gridTemplateColumns=`minmax(0,1fr) ${width}px`},width)
  const layout=await page.locator(".pc-revision-detail").evaluate(node=>{
   const point=node.querySelector('.pc-memory-point[data-current="true"]'),marker=node.querySelector(".pc-memory-current"),a=point.getBoundingClientRect(),b=marker.getBoundingClientRect(),circle=getComputedStyle(point,"::after")
   return {overflow:node.scrollWidth>node.clientWidth,circleWidth:parseFloat(circle.width),circleHeight:parseFloat(circle.height),markerOffset:Math.abs((a.left+a.width/2)-(b.left+b.width/2)),columns:getComputedStyle(node.querySelector(".pc-revision-schedule-grid")).gridTemplateColumns}
  })
  assert(!layout.overflow,`${width}: panel overflow`)
  assert.equal(layout.circleWidth,layout.circleHeight,`${width}: circle distorted`)
  assert(layout.markerOffset<1,`${width}: current marker is misaligned`)
  if(width<=350)assert(!layout.columns.includes(" "),`${width}: schedule cards did not stack`)
  reports.push({width,...layout})
  if(width===280)await page.locator(".pc-revision-detail").screenshot({path:"docs/design/workspace/revision-narrow-panel.png"})
 }
}finally{await browser.close()}
await fs.writeFile("docs/design/workspace/revision-panel-responsive-audit.json",JSON.stringify({recordedAt:new Date().toISOString(),reports},null,2)+"\n")
console.log(`Revision detail: ${reports.length} narrow widths passed; circles, marker alignment, stacking and overflow verified.`)
