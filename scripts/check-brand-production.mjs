import assert from "node:assert/strict"

const origin = process.argv[2] || "http://localhost:3031"
const root = await fetch(origin)
assert.equal(root.status, 200)
const html = await root.text()
assert(html.includes('name="application-name" content="PrepCraft"'))
assert(html.includes("favicon.svg?v=2"))
assert(html.includes("og-default.png"))
const preview = await fetch(new URL("/dev/brand", origin))
assert.equal(preview.status, 404, "Brand inspection must be private by default in production")
const manifest = await fetch(new URL("/manifest.webmanifest", origin))
assert.equal(manifest.status, 200)
const data = await manifest.json()
for (const icon of data.icons) assert.equal((await fetch(new URL(icon.src, origin))).status, 200)
for (const asset of ["/favicon.ico", "/brand/favicon/favicon.svg?v=2", "/brand/social/og-default.png", "/brand/social/twitter-card.png"]) assert.equal((await fetch(new URL(asset, origin))).status, 200)
console.log("Production checks passed: homepage/metadata/assets 200; /dev/brand 404; manifest icons reachable.")
