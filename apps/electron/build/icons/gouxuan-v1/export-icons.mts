import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const require = createRequire(import.meta.url)
const sharp = require('sharp')
const run = promisify(execFile)
const root = dirname(fileURLToPath(import.meta.url))
const iconset = join(root, 'Gouxuan.iconset')
const source = await readFile(join(root, 'source/app-icon.svg'), 'utf8')
const path = source.match(/<path\s+d="([^"]+)"\s*\/>/)?.[1]
assert(path, 'The source must contain the returning-hook path.')

const foreground = source.replace(/\s*<rect id="background"[^>]+\/>/, '')
const mark = foreground.match(/<g id="mark"[\s\S]*?<\/g>/)?.[0]
assert(mark, 'The source must contain the foreground group.')

// Only the legacy ICNS export carries a baked-in mask and transparent margin.
// Icon Composer receives the full-bleed source and the unmasked foreground.
const legacy = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs><clipPath id="tile"><rect x="100" y="100" width="824" height="824" rx="184" /></clipPath></defs>
  <g clip-path="url(#tile)">
    <rect x="100" y="100" width="824" height="824" fill="#ffffff" />
    <g transform="translate(100 100) scale(0.8046875)">${mark}</g>
  </g>
</svg>`

// A small optical expansion keeps the thin tips legible at 16pt.
const template = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 600 600">
  <title>钩玄菜单栏模板图标</title>
  <g transform="translate(60 45)" fill="#000000" stroke="#000000" stroke-width="8" stroke-linejoin="round" paint-order="stroke fill">
    <path d="${path}" />
  </g>
</svg>`

await mkdir(iconset, { recursive: true })
await mkdir(join(root, 'menu-bar'), { recursive: true })
await writeFile(join(root, 'source/foreground.svg'), foreground)
await writeFile(join(root, 'source/app-icon-macos.svg'), legacy)
await writeFile(join(root, 'source/menu-bar.svg'), template)

const exported = []

/** Renders each representation from vectors, never from a smaller PNG. */
const render = async (
  svg: string,
  name: string,
  size: number,
  density: number,
  kind: 'full-bleed' | 'foreground' | 'legacy' | 'template'
): Promise<void> => {
  const destination = join(root, name)
  await sharp(Buffer.from(svg), { density: 288 })
    .resize(size, size)
    .withMetadata({ density, icc: 'srgb' })
    .png()
    .toFile(destination)
  const png = await readFile(destination)
  const metadata = await sharp(png).metadata()
  assert.equal(metadata.width, size)
  assert.equal(metadata.height, size)
  assert.equal(metadata.density, density)
  const { data, info } = await sharp(png)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  let transparent = 0
  let solidMark = 0
  for (let index = 0; index < data.length; index += info.channels) {
    const [red, green, blue, alpha] = data.subarray(index, index + 4)
    if (alpha === 0) transparent++
    if (kind === 'template') {
      if (alpha > 0) assert.equal(red + green + blue, 0)
      if (alpha === 255) solidMark++
    } else if (red === 27 && green === 27 && blue === 27 && alpha === 255) {
      solidMark++
    }
  }
  assert(solidMark > 0, `${name} must contain solid mark pixels.`)
  if (kind === 'full-bleed') assert.equal(transparent, 0)
  else assert(transparent > 0, `${name} must retain transparent margins.`)
  exported.push({
    file: name,
    width: size,
    height: size,
    density,
    kind,
    transparentPixels: transparent,
    solidMarkPixels: solidMark,
    sha256: createHash('sha256').update(png).digest('hex'),
  })
}

await render(source, 'app-icon-1024.png', 1024, 72, 'full-bleed')
await render(foreground, 'foreground-1024.png', 1024, 72, 'foreground')
await render(legacy, 'app-icon-macos-1024.png', 1024, 72, 'legacy')
for (const size of [16, 32, 128, 256, 512]) {
  for (const scale of [1, 2]) {
    const suffix = scale === 2 ? '@2x' : ''
    await render(
      legacy,
      `Gouxuan.iconset/icon_${size}x${size}${suffix}.png`,
      size * scale,
      72 * scale,
      'legacy'
    )
  }
}
await render(template, 'menu-bar/GouxuanTemplate.png', 16, 72, 'template')
await render(template, 'menu-bar/GouxuanTemplate@2x.png', 32, 144, 'template')

await run('/usr/bin/iconutil', [
  '--convert',
  'icns',
  '--output',
  join(root, 'Gouxuan.icns'),
  iconset,
])
const icns = await readFile(join(root, 'Gouxuan.icns'))
assert.equal(icns.toString('ascii', 0, 4), 'icns')
assert.equal(icns.readUInt32BE(4), icns.length)
const representations = []
for (let offset = 8; offset < icns.length;) {
  const length = icns.readUInt32BE(offset + 4)
  assert(length > 8 && offset + length <= icns.length)
  representations.push(icns.toString('ascii', offset, offset + 4))
  offset += length
}
assert(representations.includes('ic10'), 'ICNS must include 512pt @2x.')

const preview = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="680" viewBox="0 0 1200 680">
  <rect width="1200" height="680" fill="#f3f3f3" />
  <style>text{font-family:Helvetica,Arial,sans-serif;fill:#1b1b1b}.title{font-size:24px;font-weight:600}.label{font-size:14px;fill:#666666}</style>
  <text x="48" y="52" class="title">Gouxuan · macOS icons</text>
  <text x="48" y="84" class="label">Returning hook · #1b1b1b · white app tile</text>
  <svg x="32" y="115" width="480" height="480" viewBox="0 0 1024 1024">${legacy.replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, '')}</svg>
  <text x="144" y="622" class="label">Application / ICNS compatibility</text>
  <text x="560" y="160" class="title">Menu bar · template</text>
  <rect x="560" y="192" width="580" height="104" rx="12" fill="#ffffff" />
  <rect x="560" y="312" width="580" height="104" rx="12" fill="#1b1b1b" />
  <svg x="602" y="234" width="16" height="16" viewBox="0 0 600 600">${template.match(/<g [\s\S]*?<\/g>/)[0]}</svg>
  <svg x="712" y="226" width="32" height="32" viewBox="0 0 600 600">${template.match(/<g [\s\S]*?<\/g>/)[0]}</svg>
  <svg x="602" y="354" width="16" height="16" viewBox="0 0 600 600">${template.match(/<g [\s\S]*?<\/g>/)[0].replaceAll('#000000', '#ffffff')}</svg>
  <svg x="712" y="346" width="32" height="32" viewBox="0 0 600 600">${template.match(/<g [\s\S]*?<\/g>/)[0].replaceAll('#000000', '#ffffff')}</svg>
  <text x="790" y="249" class="label">16px / 32px, actual pixels</text>
  <text x="790" y="369" fill="#ffffff" style="fill:#ffffff;font-size:14px">System-tinted dark appearance</text>
  <text x="560" y="478" class="label">Master: square 1024px, unmasked layers</text>
  <text x="560" y="510" class="label">Menu bar: transparent, black alpha mask, 72 / 144dpi</text>
  <text x="560" y="542" class="label">SVG sources + 10 iconset representations</text>
  <text x="560" y="622" class="label">Appearance simulation, not a system screenshot</text>
</svg>`
await sharp(Buffer.from(preview)).png().toFile(join(root, 'preview.png'))
await writeFile(
  join(root, 'verification.json'),
  JSON.stringify(
    {
      source: 'source/app-icon.svg',
      sourceSha256: createHash('sha256').update(source).digest('hex'),
      foregroundColor: '#1b1b1b',
      backgroundColor: '#ffffff',
      icnsRepresentations: representations,
      pngs: exported,
      systemAppearanceVerified: false,
    },
    null,
    2
  ) + '\n'
)
console.log(`Exported ${exported.length} PNGs, ICNS, SVG layers and preview.`)
