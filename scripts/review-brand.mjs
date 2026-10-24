import fs from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"

const root = path.resolve(import.meta.dirname, "..")
const input = name => path.join(root, name)
const board = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="430"><rect width="1000" height="430" fill="#F3ECE4"/><rect x="333" width="334" height="430" fill="#171514"/><rect x="667" width="333" height="430" fill="#50372D"/><g font-family="Arial,sans-serif" font-size="14"><text x="30" y="35" fill="#171514">Light browser tab</text><text x="363" y="35" fill="#FAF8F5">Dark browser tab</text><text x="697" y="35" fill="#FAF8F5">Warm brown browser tab</text></g><g font-family="Arial,sans-serif" font-size="12" fill="#9B8980"><text x="30" y="85">Native sizes: 16 / 32 / 48 px</text><text x="363" y="85">Native sizes: 16 / 32 / 48 px</text><text x="697" y="85">Native sizes: 16 / 32 / 48 px</text><text x="30" y="215">16px PNG enlarged ×8</text><text x="363" y="215">16px PNG enlarged ×8</text><text x="697" y="215">16px PNG enlarged ×8</text></g></svg>`)
const overlays = []
for (const x of [30, 363, 697]) {
  for (const [i, size] of [16, 32, 48].entries()) overlays.push({ input: await fs.readFile(input(`public/brand/favicon/favicon-${size}x${size}.png`)), left: x + i * 70, top: 140 - size })
  overlays.push({ input: await sharp(input("public/brand/favicon/favicon-16x16.png")).resize(128, 128, { kernel: "nearest" }).png().toBuffer(), left: x, top: 240 })
}
await sharp(board).composite(overlays).png().toFile(input("docs/brand/favicon-review.png"))
const masterBoard = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="450"><rect width="1100" height="450" fill="#171514"/><rect x="550" width="550" height="450" fill="#F3ECE4"/></svg>')
await sharp(masterBoard).composite(await Promise.all(["prepcraft-symbol-dark", "prepcraft-symbol-light"].map(async (name, i) => ({ input: await sharp(input(`public/brand/logo/${name}.svg`)).resize(380, 380).png().toBuffer(), left: 85 + i * 550, top: 35 })))).png().toFile(input("docs/brand/master-review.png"))
console.log("Rendered master and transparent favicon review sheets.")
