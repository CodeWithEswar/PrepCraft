/** Deterministic exports. Run npm run brand:generate; never hand-edit public/brand. */
import fs from "node:fs/promises"
import path from "node:path"
import { createRequire } from "node:module"
import sharp from "sharp"
import { symbolPaths as p, symbolOutline, symbolGradients } from "../src/components/brand/brand-symbol-paths.ts"

const require = createRequire(import.meta.url)
const fontkit = require("next/dist/compiled/@next/font/dist/fontkit").default
const root = path.resolve(import.meta.dirname, "..")
const files = []
const write = async (name, value) => {
  const dest = path.join(root, name)
  await fs.mkdir(path.dirname(dest), { recursive: true })
  await fs.writeFile(dest, value)
  files.push(name)
}
const svg = (viewBox, body, label = "PrepCraft") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${label}">${body}</svg>\n`
const gradients = (id) => symbolGradients.map(g => `<linearGradient id="${id}-${g.name}" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${g.stops.map(([offset, color]) => `<stop offset="${offset}" stop-color="${color}"/>`).join("")}</linearGradient>`).join("")
function mark(id, variant = "dimensional", color = "#A15F4B", light = false) {
  if (variant !== "dimensional") return `<path fill="${color}" fill-rule="evenodd" d="${symbolOutline}"/><path fill="${color}" d="${p.spark}"/>`
  const fill = name => `url(#${id}-${name})`
  return `<defs>${gradients(id)}<clipPath id="${id}-clip"><path fill-rule="evenodd" clip-rule="evenodd" d="${symbolOutline}"/></clipPath></defs><g clip-path="url(#${id}-clip)"><path fill="${fill("copper")}" d="${p.silhouette}"/><path fill="${fill("mineral")}" d="${p.mineral}"/><path fill="${fill("turn")}" d="${p.turn}"/><path fill="${fill("crown")}" d="${p.crown}"/><path fill="${fill("ribbon")}" d="${p.ribbon}"/><path d="${p.seams}" fill="none" stroke="${fill("edge")}" stroke-width="2" stroke-linejoin="round" opacity=".85"/></g><path fill="none" fill-rule="evenodd" d="${symbolOutline}" stroke="${light ? "#855A48" : fill("edge")}" stroke-width="2.5" stroke-linejoin="round"/><path d="${p.spark}" fill="${fill("crown")}"/>`
}

// The installed Next.js distribution includes Geist (SIL Open Font License).
// Outline every glyph; no runtime font dependency in exported assets.
const fontPath = require.resolve("next/dist/next-devtools/server/font/geist-latin.woff2")
const font = fontkit(await fs.readFile(fontPath))
const regular = fontkit(await fs.readFile(fontPath))
function outline(text, face = font, tracking = -18) {
  const run = face.layout(text)
  let x = 0
  const paths = run.glyphs.map((glyph, i) => {
    const pos = run.positions[i]
    const item = { d: glyph.path.toSVG(), x: x + pos.xOffset, y: pos.yOffset, craft: i >= 4 }
    x += pos.xAdvance + tracking
    return item
  })
  return { paths, width: x - tracking, units: face.unitsPerEm, capHeight: face.capHeight, stroke: face === font ? 32 : 0 }
}
const word = outline("PrepCraft")
const tagline = outline("CRAFT YOUR WAY TO READY.", regular, 200)
const actions = outline("PLAN  •  PRACTICE  •  REVISE  •  TRACK  •  IMPROVE", regular, 110)
await write("src/components/brand/brand-wordmark-paths.json", JSON.stringify({ word, tagline }, null, 2) + "\n")
function lettering(data, x, baseline, size, main, accent = main) {
  const scale = size / data.units
  return `<g transform="translate(${x} ${baseline}) scale(${scale} ${-scale})">${data.paths.map(g => `<path fill="${g.craft ? accent : main}" stroke="${g.craft ? accent : main}" stroke-width="${data.stroke}" stroke-linejoin="round" transform="translate(${g.x} ${g.y})" d="${g.d}"/>`).join("")}</g>`
}
const widthAt = (data, size) => data.width * size / data.units
for (const [name, variant, color, light] of [
  ["symbol", "dimensional", "#A15F4B", false], ["symbol-flat", "flat", "#A15F4B", false],
  ["symbol-monochrome", "flat", "currentColor", false], ["symbol-white", "flat", "#FAF8F5", false],
  ["symbol-black", "flat", "#171514", false], ["symbol-light", "dimensional", "#A15F4B", true],
  ["symbol-dark", "dimensional", "#A15F4B", false],
]) await write(`public/brand/logo/prepcraft-${name}.svg`, svg("0 0 512 512", mark(name, variant, color, light)))

const wordWidth = Math.ceil(widthAt(word, 144))
for (const [suffix, main, accent] of [["", "#171514", "#A15F4B"], ["-light", "#171514", "#A15F4B"], ["-dark", "#FAF8F5", "#D99A78"], ["-monochrome", "currentColor", "currentColor"]]) {
  await write(`public/brand/logo/prepcraft-wordmark${suffix}.svg`, svg(`-4 0 ${wordWidth + 8} 160`, lettering(word, 0, 126, 144, main, accent)))
  // 256-unit symbol; gap is one scaled u=24 from the visible right edge.
  await write(`public/brand/logo/prepcraft-horizontal${suffix}.svg`, svg(`0 0 ${248 + wordWidth} 256`, `<g transform="scale(.5)">${mark(`horizontal${suffix}`)}</g>${lettering(word, 248, 178, 144, main, accent)}`))
}
for (const [suffix, main, accent] of [["", "#171514", "#A15F4B"], ["-dark", "#FAF8F5", "#D99A78"]]) {
  await write(`public/brand/logo/prepcraft-vertical${suffix}.svg`, svg("0 0 720 660", `<g transform="translate(155 0) scale(.8)">${mark(`vertical${suffix}`)}</g>${lettering(word, (720 - widthAt(word, 144)) / 2, 538, 144, main, accent)}${lettering(tagline, (720 - widthAt(tagline, 19)) / 2, 596, 19, main)}`))
}
function appIcon(id, light = false, maskable = false) {
  const bg = light ? "#F3ECE4" : "#171311"
  const container = `<defs><linearGradient id="${id}-bg" x2="1" y2="1"><stop stop-color="${light ? "#FFFCF8" : "#3C2A22"}"/><stop offset="1" stop-color="${bg}"/></linearGradient></defs><rect x="${maskable ? 0 : 12}" y="${maskable ? 0 : 12}" width="${maskable ? 512 : 488}" height="${maskable ? 512 : 488}" rx="${maskable ? 0 : 108}" fill="url(#${id}-bg)"/>`
  // All important geometry lies inside the 40%-radius maskable safe circle.
  const scale = maskable ? .64 : .74
  const offset = (512 - 512 * scale) / 2
  return svg("0 0 512 512", `${container}${maskable ? "" : `<rect x="13" y="13" width="486" height="486" rx="107" fill="none" stroke="${light ? "#D3BDAE" : "#815B46"}" stroke-width="2"/>`}<g transform="translate(${offset} ${offset}) scale(${scale})">${mark(id, "dimensional", "#A15F4B", light)}</g>`)
}
for (const [name, light, maskable] of [["app-icon", false, false], ["app-icon-light", true, false], ["app-icon-dark", false, false], ["app-icon-maskable", false, true]]) await write(`public/brand/app-icons/${name}.svg`, appIcon(name, light, maskable))

// Flat source for all favicon sizes. High-contrast copper on opaque graphite.
const favicon = svg("0 0 512 512", `<rect width="512" height="512" rx="108" fill="#171514"/>${mark("favicon", "flat", "#E5AC89")}`)
await write("public/brand/favicon/favicon.svg", favicon)
await write("public/brand/loading/loading-mark.svg", svg("0 0 512 512", mark("loading-mark", "flat")))
const ringStyle = `<style>@keyframes prepcraft-orbit{to{transform:rotate(360deg)}}.orbit{transform-origin:256px 256px;animation:prepcraft-orbit 2.4s linear infinite}@media(prefers-reduced-motion:reduce){.orbit{animation:none}}</style>`
await write("public/brand/loading/loading-ring.svg", svg("0 0 512 512", `${ringStyle}<circle cx="256" cy="256" r="231" fill="none" stroke="#A15F4B" stroke-opacity=".18" stroke-width="10"/><circle class="orbit" cx="256" cy="256" r="231" fill="none" stroke="#A15F4B" stroke-width="10" stroke-linecap="round" stroke-dasharray="360 1092"/><g transform="translate(112.64 112.64) scale(.56)">${mark("loader", "flat")}</g>`, "PrepCraft loading"))

function social(id, dark) {
  const main = dark ? "#FAF8F5" : "#211C19"
  const accent = dark ? "#D99A78" : "#A15F4B"
  return svg("0 0 1200 630", `<defs><radialGradient id="${id}-atmosphere" cx="90%" cy="85%" r="85%"><stop stop-color="${dark ? "#644131" : "#E2C6B2"}"/><stop offset="1" stop-color="${dark ? "#121110" : "#F3EDE5"}"/></radialGradient><linearGradient id="${id}-glass" x2="1" y2="1"><stop stop-color="${dark ? "#FFFFFF" : "#FFFFFF"}" stop-opacity=".1"/><stop offset="1" stop-color="#FFFFFF" stop-opacity=".01"/></linearGradient></defs><rect width="1200" height="630" fill="url(#${id}-atmosphere)"/><circle cx="1060" cy="595" r="390" fill="none" stroke="${accent}" stroke-opacity=".18"/><circle cx="1060" cy="595" r="445" fill="none" stroke="${accent}" stroke-opacity=".1"/><rect x="56" y="56" width="1088" height="518" rx="32" fill="url(#${id}-glass)" stroke="${accent}" stroke-opacity=".24"/><g transform="translate(92 111) scale(.65)">${mark(id, "dimensional", "#A15F4B", !dark)}</g>${lettering(word, 446, 305, 142, main, accent)}${lettering(tagline, 450, 361, 16, main)}${lettering(actions, 450, 474, 13, main)}`, "PrepCraft. Craft your way to ready. Plan, practice, revise, track, improve.")
}
for (const [name, dark] of [["og-default", false], ["og-dark", true], ["twitter-card", true]]) await write(`public/brand/social/${name}.svg`, social(name, dark))

async function raster(source, dest, width, height = width) {
  const input = await fs.readFile(path.join(root, source))
  const png = await sharp(input, { density: 288 }).resize(width, height).png().toBuffer()
  await write(dest, png)
  return png
}
const faviconPngs = []
for (const size of [16, 32, 48]) faviconPngs.push(await raster("public/brand/favicon/favicon.svg", `public/brand/favicon/favicon-${size}x${size}.png`, size))
await raster("public/brand/app-icons/app-icon.svg", "public/brand/favicon/apple-touch-icon.png", 180)
for (const size of [192, 512]) {
  await raster("public/brand/app-icons/app-icon.svg", `public/brand/app-icons/app-icon-${size}.png`, size)
  await raster("public/brand/app-icons/app-icon-maskable.svg", `public/brand/app-icons/maskable-${size}.png`, size)
}
for (const name of ["og-default", "og-dark", "twitter-card"]) await raster(`public/brand/social/${name}.svg`, `public/brand/social/${name}.png`, 1200, 630)

// Multi-resolution ICO with PNG-compressed entries, generated from the same SVG.
const header = Buffer.alloc(6 + 16 * faviconPngs.length)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(faviconPngs.length, 4)
let offset = header.length
faviconPngs.forEach((png, i) => {
  const pos = 6 + i * 16
  header[pos] = [16, 32, 48][i]
  header[pos + 1] = header[pos]
  header.writeUInt16LE(1, pos + 4)
  header.writeUInt16LE(32, pos + 6)
  header.writeUInt32LE(png.length, pos + 8)
  header.writeUInt32LE(offset, pos + 12)
  offset += png.length
})
await write("src/app/favicon.ico", Buffer.concat([header, ...faviconPngs]))
await write("docs/brand/GENERATED-FILES.md", `# Generated brand files\n\nRegenerate with \`npm run brand:generate\`. SVGs use canonical paths; lettering is outlined Geist Regular with a 32-unit contour weight adjustment (tagline unadjusted).\n\n${files.map(f => `- \`${f}\``).join("\n")}\n`)
console.log(`Generated ${files.length} brand files.`)
