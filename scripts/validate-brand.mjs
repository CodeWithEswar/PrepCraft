import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { JSDOM } from "jsdom"
import { symbolOutline, symbolPaths } from "../src/components/brand/brand-symbol-paths.ts"

const root = path.resolve(import.meta.dirname, "..")
const brand = path.join(root, "public/brand")
const files = (await fs.readdir(brand, { recursive: true })).filter(f => /\.(svg|png)$/.test(f) && !/^landing[\\/]/.test(f))
let svgCount = 0
let pngCount = 0
for (const file of files) {
  const full = path.join(brand, file)
  if (file.endsWith(".svg")) {
    const source = await fs.readFile(full, "utf8")
    const dom = new JSDOM(source, { contentType: "image/svg+xml" })
    const doc = dom.window.document
    assert(doc.documentElement.getAttribute("viewBox"), `${file}: viewBox`)
    assert(!doc.querySelector("image, text, foreignObject, script"), `${file}: only vector geometry`)
    assert(!/data:|base64|https?:\/\/(?!www.w3.org)/.test(source), `${file}: no external assets`)
    const ids = [...doc.querySelectorAll("[id]")].map(n => n.id)
    assert.equal(ids.length, new Set(ids).size, `${file}: duplicate SVG IDs`)
    for (const [, id] of source.matchAll(/url\(#([^)]*)\)/g)) assert(ids.includes(id), `${file}: unresolved ${id}`)
    if (!file.includes("wordmark")) assert(source.includes(symbolPaths.silhouette) || source.includes(symbolOutline), `${file}: canonical silhouette`)
    await sharp(full).resize(128, 128).png().toBuffer()
    svgCount++
    dom.window.close()
  } else {
    const meta = await sharp(full).metadata()
    let width, height
    if (file.startsWith("social")) { width = 1200; height = 630 }
    else if (file.includes("apple-touch")) width = height = 180
    else width = height = Number(file.match(/(16|32|48|192|512)(?:x\d+)?\.png$/)[1])
    assert.equal(meta.width, width, file)
    assert.equal(meta.height, height, file)
    assert.equal(meta.space, "srgb", `${file}: sRGB`)
    if (file.includes("favicon-")) {
      const { data, info } = await sharp(full).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
      assert.equal(data[3], 0, `${file}: transparent browser icon background`)
      assert.equal(data[(info.width * info.height - 1) * info.channels + 3], 0, `${file}: transparent browser icon corner`)
    }
    pngCount++
  }
}

const manifest = JSON.parse(await fs.readFile(path.join(root, "public/manifest.webmanifest"), "utf8"))
assert.equal(manifest.name, "PrepCraft")
assert.equal(manifest.display, "standalone")
for (const icon of manifest.icons) {
  await fs.access(path.join(root, "public", icon.src))
  assert.match(icon.sizes, /^(192|512)x(192|512)$/)
}
assert(manifest.icons.some(i => i.purpose === "maskable"))

// Rasterize only foreground geometry at the exact maskable transform and verify
// every antialiased important pixel is inside the 40%-radius safe circle.
const safe = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><g transform="translate(92.16 92.16) scale(.64)" fill="white"><path fill-rule="evenodd" d="${symbolOutline}"/><path d="${symbolPaths.spark}"/></g></svg>`)
const { data, info } = await sharp(safe).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
let farthest = 0
for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
  if (data[(y * 512 + x) * info.channels + 3] > 16) farthest = Math.max(farthest, Math.hypot(x + .5 - 256, y + .5 - 256))
}
assert(farthest < 204.8, `Maskable foreground outside safe circle: ${farthest}`)

const ico = await fs.readFile(path.join(root, "src/app/favicon.ico"))
assert.equal(ico.readUInt16LE(2), 1)
assert.equal(ico.readUInt16LE(4), 3)
for (let i = 0; i < 3; i++) {
  const pos = 6 + 16 * i
  const length = ico.readUInt32LE(pos + 8)
  const offset = ico.readUInt32LE(pos + 12)
  const metadata = await sharp(ico.subarray(offset, offset + length)).metadata()
  assert.equal(metadata.width, [16, 32, 48][i])
}
console.log(`Validated ${svgCount} vector SVGs, ${pngCount} sRGB PNGs, 3 ICO sizes, manifest links, and maskable safe radius (${farthest.toFixed(1)} < 204.8).`)
