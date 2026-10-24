import assert from "node:assert/strict"
import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

// Run after every generatedPath in the prompt manifest points to a completed PNG.
const root = path.resolve(import.meta.dirname, "..")
const promptFile = "docs/design/landing-studio-prompts.json"
const prompts = JSON.parse(await fs.readFile(path.join(root, promptFile), "utf8"))
const gallery = path.join(root, "public/brand/landing/visuals")
const responsiveDir = path.join(gallery, "responsive")
const reviewDir = path.join(root, "docs/design/landing-studio")
const masters = path.join(reviewDir, "masters")
const transparentBackground = { r: 0, g: 0, b: 0, alpha: 0 }
const encoding = { quality: 80, alphaQuality: 100, effort: 4 }

assert(Array.isArray(prompts.assets) && prompts.assets.length === 10, "Expected ten landing studio assets")
const names = new Set()
for (const item of prompts.assets) {
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.name), "Asset names must be safe lowercase filename stems")
  assert(!names.has(item.name), `Duplicate asset name: ${item.name}`)
  names.add(item.name)
  assert(Number.isInteger(item.width) && item.width >= 600, `${item.name}: valid target width >= 600`)
  assert(Number.isInteger(item.height) && item.height >= 100, `${item.name}: valid target height`)
  assert(typeof item.prompt === "string" && item.prompt.length > 0, `${item.name}: retain the generation prompt`)
  assert(typeof item.generatedPath === "string" && item.generatedPath.length > 0, `${item.name}: missing generatedPath`)
  // Preflight all inputs before producing any derivative assets.
  const master = path.join(masters, `${item.name}.png`)
  try {
    await fs.access(master)
  } catch {
    const generatedPath = path.isAbsolute(item.generatedPath) ? item.generatedPath : path.resolve(root, item.generatedPath)
    await fs.access(generatedPath)
  }
}

await fs.mkdir(masters, { recursive: true })
await fs.mkdir(responsiveDir, { recursive: true })
const assets = [], checks = [], thumbnails = []
const thumbnailWidth = 400, thumbnailHeight = 300

for (const [index, item] of prompts.assets.entries()) {
  const master = path.join(masters, `${item.name}.png`)
  try {
    await fs.access(master)
  } catch {
    const generatedPath = path.isAbsolute(item.generatedPath) ? item.generatedPath : path.resolve(root, item.generatedPath)
    await fs.copyFile(generatedPath, master, fs.constants.COPYFILE_EXCL)
  }
  const masterMetadata = await sharp(master).metadata()
  assert(masterMetadata.hasAlpha, `${item.name}: generated master must have an alpha channel`)
  const masterStats = await sharp(master).stats()
  assert(masterStats.channels[3]?.min === 0, `${item.name}: generated master must contain genuine transparent pixels before padding`)
  const outputName = item.name.endsWith("-studio") ? item.name : `${item.name}-studio`
  const output = path.join(gallery, `${outputName}.webp`)
  const paddingX = Math.max(1, Math.round(item.width * 0.02))
  const paddingY = Math.max(1, Math.round(item.height * 0.02))
  const responsiveWidth = 600
  const responsiveHeight = Math.round(item.height * responsiveWidth / item.width)

  await sharp(master)
    .rotate()
    .resize(item.width - paddingX * 2, item.height - paddingY * 2, { fit: "contain", background: transparentBackground })
    .extend({ top: paddingY, bottom: paddingY, left: paddingX, right: paddingX, background: transparentBackground })
    .webp(encoding)
    .toFile(output)
  const responsiveName = `${outputName}-600.webp`
  const responsiveOutput = path.join(responsiveDir, responsiveName)
  await sharp(output).resize(responsiveWidth, responsiveHeight).webp(encoding).toFile(responsiveOutput)

  for (const [kind, filename, expectedWidth, expectedHeight] of [["primary", output, item.width, item.height], ["responsive", responsiveOutput, responsiveWidth, responsiveHeight]]) {
    const metadata = await sharp(filename).metadata()
    assert(metadata.hasAlpha, `${outputName} ${kind}: an alpha channel is required`)
    const { data, info } = await sharp(filename).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
    assert.equal(info.width, expectedWidth, `${outputName} ${kind}: output width`)
    assert.equal(info.height, expectedHeight, `${outputName} ${kind}: output height`)
    assert.equal(info.channels, 4, `${outputName} ${kind}: RGBA output`)
    const at = (x, y) => data[(y * info.width + x) * 4 + 3]
    const corners = [at(0, 0), at(info.width - 1, 0), at(0, info.height - 1), at(info.width - 1, info.height - 1)]
    assert(corners.every(alpha => alpha === 0), `${outputName} ${kind}: transparent corners`)
    let transparent = 0, partial = 0, solid = 0
    for (let pixel = 3; pixel < data.length; pixel += 4) {
      const alpha = data[pixel]
      if (alpha === 0) transparent++
      else if (alpha >= 250) solid++
      else partial++
    }
    assert(transparent > 0 && partial > 0 && solid > 0, `${outputName} ${kind}: require transparent space, partial material/shadow alpha, and near-opaque foreground`)
    checks.push({ name: outputName, kind, width: info.width, height: info.height, cornerAlpha: corners, transparent, partial, solid, passed: true })
  }

  assets.push({
    name: outputName,
    src: `/brand/landing/visuals/${outputName}.webp`,
    source: `docs/design/landing-studio/masters/${item.name}.png`,
    width: item.width,
    height: item.height,
    bytes: (await fs.stat(output)).size,
    alpha: true,
    transparentPadding: { x: paddingX, y: paddingY, percentagePerEdge: 2 },
    medium: "AI-generated raster; built-in image_gen",
    promptFile,
    responsive: { src: `/brand/landing/visuals/responsive/${responsiveName}`, width: responsiveWidth, height: responsiveHeight, bytes: (await fs.stat(responsiveOutput)).size },
  })

  for (const [theme, background] of [[0, "#f8f8f6"], [1, "#171918"]]) {
    // Flatten in a separate pass so resize padding also receives the theme background.
    const resized = await sharp(output).resize(thumbnailWidth, thumbnailHeight, { fit: "contain", background: transparentBackground }).png().toBuffer()
    const input = await sharp(resized).flatten({ background }).png().toBuffer()
    thumbnails.push({ input, left: theme * thumbnailWidth, top: index * thumbnailHeight })
  }
}

await fs.writeFile(path.join(gallery, "studio-manifest.json"), JSON.stringify({ mode: prompts.mode, webpQuality: 80, alphaQuality: 100, effort: 4, assets }, null, 2) + "\n")
await fs.writeFile(path.join(gallery, "studio-alpha-validation.json"), JSON.stringify({ verifiedAssets: assets.length, verifiedExports: checks.length, checks }, null, 2) + "\n")
await sharp({ create: { width: thumbnailWidth * 2, height: assets.length * thumbnailHeight, channels: 3, background: "#f8f8f6" } })
  .composite(thumbnails)
  .png()
  .toFile(path.join(reviewDir, "contact-sheet.png"))
console.log(assets.map(asset => `${asset.name}: ${asset.width} × ${asset.height}, ${(asset.bytes / 1024).toFixed(1)} KiB; primary and responsive alpha verified`).join("\n"))
