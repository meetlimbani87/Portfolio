import * as THREE from 'three'

// Wedge-shaped band profile (same as the hero's rings): a flat outer face that carries the ornament,
// chamfered shoulders above and below it, and a flat polished inner wall. Each corner gets two points very
// close together so the edges stay crisp instead of being smeared by smooth shading.
export function bandProfile(R, a, H) {
  const h = H / 2
  const raw = [
    [R - a, -h], [R + a * 0.55, -h], [R + a, -h * 0.44], [R + a, h * 0.44], [R + a * 0.55, h], [R - a, h],
  ]
  const out = []
  const n = raw.length
  for (let i = 0; i < n; i++) {
    const p = raw[i], prev = raw[(i + n - 1) % n], next = raw[(i + 1) % n]
    const k = 0.06
    out.push(new THREE.Vector2(p[0] + (prev[0] - p[0]) * k, p[1] + (prev[1] - p[1]) * k))
    out.push(new THREE.Vector2(p[0] + (next[0] - p[0]) * k, p[1] + (next[1] - p[1]) * k))
  }
  out.push(out[0].clone())
  return out
}

// A glowing engraved strip that spells a project's name, to wrap around a ring's outer face. The text is
// drawn once per tile with a diamond after it; `repeatX` tiles are laid around the ring. Transparent
// everywhere except the dark engraved channel and the lime lettering.
const cache = {}
export function nameTexture(title, repeatX) {
  const key = `${title}|${repeatX}`
  if (cache[key]) return cache[key]
  const W = 2048, H = 256
  const cv = document.createElement('canvas')
  cv.width = W
  cv.height = H
  const c = cv.getContext('2d')

  // dark engraved channel the lettering sits in
  c.fillStyle = 'rgba(4,8,3,0.92)'
  c.fillRect(0, 18, W, H - 36)

  // thin glowing border lines
  c.strokeStyle = '#c6ff3d'
  c.lineWidth = 3
  c.beginPath(); c.moveTo(0, 24); c.lineTo(W, 24); c.moveTo(0, H - 24); c.lineTo(W, H - 24); c.stroke()

  // the name, shrunk if needed so title + diamond fit in one tile
  const text = `${title.toUpperCase()}   ◆   `
  let size = 168
  const font = (s) => `700 ${s}px "Space Grotesk", system-ui, sans-serif`
  c.font = font(size)
  if ('letterSpacing' in c) c.letterSpacing = `${Math.round(size * 0.06)}px`
  while (c.measureText(text).width > W - 60 && size > 40) {
    size -= 4
    c.font = font(size)
    if ('letterSpacing' in c) c.letterSpacing = `${Math.round(size * 0.06)}px`
  }
  c.textBaseline = 'middle'
  c.textAlign = 'center'
  c.fillStyle = '#c6ff3d'
  c.shadowColor = '#c6ff3d'
  c.shadowBlur = 10
  c.fillText(text, W / 2, H / 2 + 6)

  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = THREE.RepeatWrapping
  t.repeat.set(repeatX, 1)
  t.anisotropy = 8
  cache[key] = t
  return t
}
