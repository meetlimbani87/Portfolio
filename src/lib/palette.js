import { useSyncExternalStore } from 'react'
import * as THREE from 'three'

// Theme awareness for the 3D stage: light mode swaps the glowing lime for blue (the brass rings stay brass).

const root = typeof document !== 'undefined' ? document.documentElement : null
const subscribe = (cb) => {
  if (!root) return () => {}
  const mo = new MutationObserver(cb)
  mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
  return () => mo.disconnect()
}
const snapshot = () => root?.dataset.theme === 'light'
export const useIsLight = () => useSyncExternalStore(subscribe, snapshot, () => false)


export const ACCENT_DARK = '#c6ff3d'
export const ACCENT_LIGHT = '#3f63c4'

// Colours for the glowing parts, per theme. The glow textures are white, so the material colour carries the tint:
//   plain  - for things with no texture (cube edges, glow strips)
//   tex    - for textured ones (icon, knot band); in dark mode it equals the old lime-texture x lime-colour look
//   base   - the un-boosted accent (lights, emissive)
const make = (hex, squared) => {
  const base = new THREE.Color(hex)
  const plain = base.clone().multiplyScalar(2.2)
  const tex = squared ? base.clone().multiply(base).multiplyScalar(2.2) : plain.clone()
  return { base, plain, tex }
}
const DARK = make(ACCENT_DARK, true)
const LIGHT = make(ACCENT_LIGHT, false)
export const accentFor = (light) => (light ? LIGHT : DARK)

// light-mode colours for the neutral scenery
export const LIGHT_ORBIT = '#6f93d9' // orbit lines: subtle blue
export const LIGHT_SHELL = '#2a2a33' // the wire sphere stays a neutral line (it is very faint)
export const LIGHT_DUST = '#55555f'
// slightly over-bright on purpose: the stage's ACES tone mapping pulls it back down to match the page (--bg)
export const LIGHT_BG = new THREE.Color('#f4f3ef').multiplyScalar(1.7)
