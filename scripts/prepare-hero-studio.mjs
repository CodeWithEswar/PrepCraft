import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import assert from "node:assert/strict"

const root = path.resolve(import.meta.dirname,"..")
const prompts = JSON.parse(await fs.readFile(path.join(root,"docs/design/hero-studio-prompts.json"),"utf8"))
const gallery = path.join(root,"public/brand/landing/hero-gallery")
const masters = path.join(root,"docs/design/hero-gallery/masters")
await fs.mkdir(masters,{recursive:true})
const assets = [], checks = [], thumbnails = []
for (const [index,item] of prompts.assets.entries()) {
  const master = path.join(masters,`${item.name}.png`)
  try { await fs.access(master) } catch { await fs.copyFile(item.generatedPath,master) }
  const output = path.join(gallery,`${item.name}.webp`)
  await sharp(master).resize(960,768,{fit:"contain",background:{r:0,g:0,b:0,alpha:0}}).extend({top:16,bottom:16,left:20,right:20,background:{r:0,g:0,b:0,alpha:0}}).webp({quality:80,alphaQuality:100,effort:4}).toFile(output)
  await sharp(output).resize(500,400).webp({quality:80,alphaQuality:100,effort:4}).toFile(path.join(gallery,"responsive",`${item.name}-500.webp`))
  const { data,info } = await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  const corners = [3,(info.width-1)*4+3,(info.height-1)*info.width*4+3,(info.width*info.height-1)*4+3].map(i=>data[i])
  assert(corners.every(a=>a===0),`${item.name}: transparent corners`)
  let transparent=0,partial=0,solid=0
  for(let i=3;i<data.length;i+=4) { if(data[i]===0)transparent++; else if(data[i]===255)solid++; else partial++ }
  assert(transparent && partial && solid,`${item.name}: true alpha`)
  checks.push({name:item.name,cornerAlpha:corners,transparent,partial,solid,passed:true})
  assets.push({name:item.name,src:`/brand/landing/hero-gallery/${item.name}.webp`,source:`docs/design/hero-gallery/masters/${item.name}.png`,width:1000,height:800,bytes:(await fs.stat(output)).size,alpha:true,medium:"AI-generated raster; built-in image_gen",promptFile:"docs/design/hero-studio-prompts.json",responsive:{src:`/brand/landing/hero-gallery/responsive/${item.name}-500.webp`,width:500,height:400}})
  for(const [theme,background] of [[0,"#f8f8f6"],[1,"#171918"]]) {
    const input = await sharp(output).resize(400,320).flatten({background}).png().toBuffer()
    thumbnails.push({input,left:theme*400,top:index*320})
  }
}
await fs.writeFile(path.join(gallery,"studio-manifest.json"),JSON.stringify({mode:prompts.mode,webpQuality:80,alphaQuality:100,assets},null,2)+"\n")
await fs.writeFile(path.join(gallery,"studio-alpha-validation.json"),JSON.stringify({verifiedAssets:5,checks},null,2)+"\n")
await sharp({create:{width:800,height:1600,channels:3,background:"#f8f8f6"}}).composite(thumbnails).png().toFile(path.join(root,"docs/design/hero-gallery/studio-contact-sheet.png"))
console.log(assets.map(a=>`${a.name}: ${a.width}×${a.height}, ${(a.bytes/1024).toFixed(1)} KiB; alpha verified`).join("\n"))
