import { useSyncExternalStore } from 'react'

// Theme awareness for the 3D stage.
// In light mode the whole canvas is inverted by a CSS filter (see index.css: --stage-filter), which turns the
// copper rings steel-blue and the lime glow indigo-blue. Colours that are *neutral* in the scene (orbit lines,
// the wire sphere, the dust) would just turn grey, so in light mode we draw them in the INVERSE of the colour
// we want to see; the filter then lands on the wanted colour.

const root = typeof document !== 'undefined' ? document.documentElement : null
const subscribe = (cb) => {
  if (!root) return () => {}
  const mo = new MutationObserver(cb)
  mo.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
  return () => mo.disconnect()
}
const snapshot = () => root?.dataset.theme === 'light'
export const useIsLight = () => useSyncExternalStore(subscribe, snapshot, () => false)

const invert = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return '#' + (0xffffff ^ n).toString(16).padStart(6, '0')
}

// the colour we want to SEE in light mode (change these to restyle the light theme's orbit + wire sphere + dust)
export const LIGHT_ORBIT = '#6f93d9'
export const LIGHT_SHELL = '#6f93d9'
export const LIGHT_DUST = '#8aa2d2'

export const stageColor = (light, dark, wantedInLight) => (light ? invert(wantedInLight) : dark)
