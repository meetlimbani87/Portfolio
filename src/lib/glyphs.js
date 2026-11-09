import * as THREE from 'three'

const LIME = '#c6ff3d'
const W = 2048, H = 256 // one tile of the ornament strip; it repeats around the ring

function rng(seed) {
  return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
}

/* ------------------------------------------------------------------ interlaced knot band
   A Celtic-style braid: two strands weave over/under each other, with a finer braid above
   and below it. Dark outlines make the over/under read; lime fill glows. Transparent elsewhere. */
let knotBase
export function knotTexture(repeatX) {
  if (!knotBase) {
    const cv = document.createElement('canvas')
    cv.width = W
    cv.height = H
    const c = cv.getContext('2d')
    c.lineCap = 'round'
    c.lineJoin = 'round'

    // dark engraved channel the pattern sits in
    c.fillStyle = 'rgba(4,8,3,0.9)'
    c.fillRect(0, 22, W, H - 44)

    // draws one sine strand as dark outline + lime core, optionally clipped to an x-window
    const strand = (cy, amp, period, phase, outline, core, x0 = 0, x1 = W) => {
      c.save()
      c.beginPath(); c.rect(x0, 0, x1 - x0, H); c.clip()
      c.beginPath()
      for (let x = x0 - 4; x <= x1 + 4; x += 3) {
        const y = cy + amp * Math.sin((x / period) * Math.PI * 2 + phase)
        x === x0 - 4 ? c.moveTo(x, y) : c.lineTo(x, y)
      }
      c.strokeStyle = '#020402'; c.lineWidth = outline; c.stroke()
      c.strokeStyle = LIME; c.lineWidth = core; c.stroke()
      c.restore()
    }
    const braid = (cy, amp, period, outline, core) => {
      strand(cy, amp, period, 0, outline, core)
      strand(cy, amp, period, Math.PI, outline, core)
      // crossings happen every half period; put strand A on top at every other one
      for (let k = 0; k * (period / 2) <= W; k += 2) {
        const xc = k * (period / 2)
        strand(cy, amp, period, 0, outline, core, xc - period * 0.16, xc + period * 0.16)
      }
    }
    braid(H / 2, 46, 128, 24, 13)  // main braid
    braid(48, 11, 64, 9, 4.5)      // fine braid above
    braid(H - 48, 11, 64, 9, 4.5)  // fine braid below

    // thin glowing border lines
    c.strokeStyle = LIME; c.lineWidth = 3
    c.beginPath(); c.moveTo(0, 26); c.lineTo(W, 26); c.moveTo(0, H - 26); c.lineTo(W, H - 26); c.stroke()

    knotBase = new THREE.CanvasTexture(cv)
    knotBase.colorSpace = THREE.SRGBColorSpace
  }
  const t = knotBase.clone()
  t.needsUpdate = true
  t.wrapS = THREE.RepeatWrapping
  t.repeat.set(repeatX, 1)
  t.anisotropy = 8
  return t
}

/* ------------------------------------------------------------------ weathered metal
   Grey noise + hairline cracks; used as bump and roughness map so the steel looks old and worn. */
let wornTex
export function weatheredTexture() {
  if (wornTex) return wornTex
  const S = 512
  const cv = document.createElement('canvas')
  cv.width = cv.height = S
  const c = cv.getContext('2d')
  const rnd = rng(5)
  c.fillStyle = '#808080'
  c.fillRect(0, 0, S, S)
  for (let i = 0; i < 9000; i++) { // speckle
    const v = 90 + rnd() * 90
    c.fillStyle = `rgb(${v},${v},${v})`
    c.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 2, 1 + rnd() * 2)
  }
  c.lineCap = 'round'
  for (let i = 0; i < 38; i++) { // cracks
    let x = rnd() * S, y = rnd() * S
    c.beginPath(); c.moveTo(x, y)
    const n = 4 + Math.floor(rnd() * 8)
    for (let k = 0; k < n; k++) { x += (rnd() - 0.5) * 46; y += (rnd() - 0.5) * 46; c.lineTo(x, y) }
    c.strokeStyle = `rgba(20,20,20,${0.5 + rnd() * 0.4})`
    c.lineWidth = 0.8 + rnd() * 1.4
    c.stroke()
  }
  wornTex = new THREE.CanvasTexture(cv)
  wornTex.wrapS = wornTex.wrapT = THREE.RepeatWrapping
  wornTex.repeat.set(8, 2)
  return wornTex
}
