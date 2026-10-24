import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { JSDOM } from "jsdom"

const root = path.resolve(import.meta.dirname,"..")
let count = 0, bytes = 0
for (const [directory,expected,file] of [["hero",7,"manifest.json"],["visuals",10,"manifest.json"],["hero-gallery",5,"manifest.json"],["hero-gallery",5,"studio-manifest.json"],["visuals",10,"studio-manifest.json"]]) {
  const manifest = JSON.parse(await fs.readFile(path.join(root,`public/brand/landing/${directory}/${file}`),"utf8"))
  assert.equal(manifest.assets.length,expected)
  for (const asset of manifest.assets) {
    const full = path.join(root,"public",asset.src)
    const meta = await sharp(full).metadata()
    assert.equal(meta.width,asset.width,asset.src); assert.equal(meta.height,asset.height,asset.src)
    assert(meta.hasAlpha,`${asset.src}: alpha channel`)
    const {data,info} = await sharp(full).ensureAlpha().raw().toBuffer({resolveWithObject:true})
    for (const offset of [3,(info.width-1)*4+3,(info.height-1)*info.width*4+3,(info.height*info.width-1)*4+3]) assert.equal(data[offset],0,`${asset.src}: true transparent corners`)
    let partial = 0,solid = 0
    for (let i=3;i<data.length;i+=4) { if(data[i]>0 && data[i]<250) partial++; if(data[i]>=250) solid++ }
    assert(partial>0 && solid>0,`${asset.src}: material and shadow alpha`)
    if (asset.medium) {
      assert((await sharp(path.join(root,asset.source)).metadata()).hasAlpha,`${asset.source}: retained raster master`)
    } else {
    const source = await fs.readFile(path.join(root,"public",asset.source),"utf8")
    const dom = new JSDOM(source,{contentType:"image/svg+xml"})
    assert(!dom.window.document.querySelector("image,text,script,foreignObject"),`${asset.source}: original vector construction`)
    dom.window.close()
    }
    bytes += (await fs.stat(full)).size; count++
  }
}
const ui = await fs.readdir(path.join(root,"src/components/ui"))
for(const name of ui.filter(name => name.endsWith(".tsx"))) assert(!(await fs.readFile(path.join(root,"src/components/ui",name),"utf8")).includes('from "lucide-react"'),`${name}: Hugeicons only`)
console.log(`Validated ${count} true-alpha visual assets (${(bytes/1024).toFixed(1)} KiB), retained sources, dimensions, and shared Hugeicons rendering.`)
