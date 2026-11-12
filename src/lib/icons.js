import * as THREE from 'three'

const LIME = '#ffffff' // white: the material colour tints it (see palette.js)

// Clean line icons (Lucide-style, 24x24 grid) drawn with Path2D so they stay crisp and consistent.
const ICONS = {
  code: ['m18 16 4-4-4-4', 'm6 8-4 4 4 4', 'm14.5 4-5 16'],
  sparkle: [
    'M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z',
    'M20 3v4', 'M22 5h-4', 'M4 17v2', 'M5 18H3',
  ],
  database: ['M3 5a9 3 0 1 0 18 0a9 3 0 1 0-18 0', 'M3 5V19A9 3 0 0 0 21 19V5', 'M3 12A9 3 0 0 0 21 12'],
  cloud: ['M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z'],
  browser: [
    'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    'M2 9h20', 'M6 6.5h.01', 'M9 6.5h.01',
    'M11 12.5l1.6 6.2 1.7-2.4 2.6-.4z',
  ],
  chart: ['M16 7h6v6', 'm22 7-8.5 8.5-5-5L2 17', 'M4 21v-2', 'M10 21v-4'],
}

const cache = {}
export function iconTexture(kind) {
  if (cache[kind]) return cache[kind]
  const cv = document.createElement('canvas')
  cv.width = cv.height = 256
  const c = cv.getContext('2d')
  const k = 8.4
  c.translate((256 - 24 * k) / 2, (256 - 24 * k) / 2)
  c.scale(k, k)
  c.strokeStyle = LIME
  c.lineWidth = 1.7
  c.lineCap = 'round'
  c.lineJoin = 'round'
  c.shadowColor = LIME
  c.shadowBlur = 10
  for (const d of ICONS[kind]) c.stroke(new Path2D(d))
  const tex = new THREE.CanvasTexture(cv)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  cache[kind] = tex
  return tex
}
