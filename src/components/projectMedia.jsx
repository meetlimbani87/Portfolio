import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { PROJECTS } from '../data/projects'
import { scrollState } from '../lib/scrollState'

/* Shared by the three Projects layouts: every image of every project is one "pane" with its own texture,
   and a pane fades in when its project (and its slide) is the one being shown. A project without images gets
   a generated card with its name. */

export const SLIDE_SECS = 3.4

export const PANES = PROJECTS.flatMap((p, pi) =>
  (p.images && p.images.length ? p.images : [null]).map((src, k, arr) => ({ pi, k, count: arr.length, src, title: p.title, tag: p.tag })),
)
const SRCS = PANES.filter((p) => p.src).map((p) => p.src)

export const clamp01 = (x) => Math.min(1, Math.max(0, x))
export const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x) }

function cardTexture(title, tag, aspect) {
  const w = 1280, h = Math.round(1280 / aspect)
  const cv = document.createElement('canvas')
  cv.width = w; cv.height = h
  const c = cv.getContext('2d')
  const g = c.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#0e1a0a'); g.addColorStop(1, '#050806')
  c.fillStyle = g; c.fillRect(0, 0, w, h)
  c.strokeStyle = 'rgba(198,255,61,0.12)'; c.lineWidth = 1
  for (let x = 0; x <= w; x += 64) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke() }
  for (let y = 0; y <= h; y += 64) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke() }
  // fit the title to the card
  let size = Math.round(w * 0.085)
  c.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif`
  while (c.measureText(title).width > w * 0.82 && size > 30) { size -= 4; c.font = `700 ${size}px "Space Grotesk", system-ui, sans-serif` }
  c.textBaseline = 'middle'
  c.fillStyle = '#f2f0ea'
  c.fillText(title, w * 0.07, h * 0.46)
  c.fillStyle = '#c6ff3d'; c.font = `500 ${Math.round(w * 0.028)}px Inter, system-ui, sans-serif`
  c.fillText(tag.toUpperCase(), w * 0.075, h * 0.46 + size * 0.85)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

// crop-to-fill: scale the texture so it covers a window of this aspect with no stretching
function fitCover(tex, aspect) {
  const ia = tex.image.width / tex.image.height
  tex.repeat.set(1, 1); tex.offset.set(0, 0)
  if (ia > aspect) { tex.repeat.x = aspect / ia; tex.offset.x = (1 - tex.repeat.x) / 2 }
  else { tex.repeat.y = ia / aspect; tex.offset.y = (1 - tex.repeat.y) / 2 }
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  tex.needsUpdate = true
}

// one texture per pane, cropped for a window of the given aspect (each layout asks for its own aspect)
export function useProjectTextures(aspect) {
  const loaded = useTexture(SRCS)
  return useMemo(() => {
    let li = 0
    return PANES.map((p) => {
      const t = p.src ? loaded[li++].clone() : cardTexture(p.title, p.tag, aspect)
      fitCover(t, aspect)
      return t
    })
  }, [loaded, aspect])
}

// a plane showing one pane. mode 'active': shown while its project is the selected one (and it is its turn in
// the slideshow). mode 'always': shown whenever it is its turn (e.g. every cube face shows its own project).
// `gate` is a ref (0..1) from the layout, so the whole layout can fade in and out.
export function PaneMesh({ pane, tex, w, h, z = 0, mode = 'active', gate }) {
  const mesh = useRef()
  const mat = useRef()
  const o = useRef(0)
  useFrame(({ clock }, dt) => {
    const slide = Math.floor(clock.elapsedTime / SLIDE_SECS) % pane.count
    const on = (mode === 'always' || scrollState.project === pane.pi) && slide === pane.k ? 1 : 0
    o.current += (on - o.current) * (1 - Math.exp(-7 * dt)) // crossfade
    mat.current.opacity = o.current * (gate ? gate.current : 1)
    mesh.current.visible = mat.current.opacity > 0.01
  })
  return (
    <mesh ref={mesh} position={[0, 0, z]} visible={false}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={mat} map={tex} transparent opacity={0} toneMapped={false} depthWrite={false} />
    </mesh>
  )
}
