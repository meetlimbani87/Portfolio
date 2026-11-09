import * as THREE from 'three'

// Shared state between the page (DOM) and the 3D stage. The stage reads it every frame.
//
// Story of the page:
//   hero -> About -> Skills   the hero world sits centred behind the page and keeps moving
//   Projects                  the world keeps spinning and shows the selected project in one of three layouts:
//                               'ring'  a glass preview window in the middle of the rings
//                               'cube'  the cube grows into a console: each face is a project
//                               'stars' projects are nodes on the outer sphere (a constellation)
//                               'rings' one ring per project, name engraved around it (the default)
//                               'type' / 'terminal'  page layouts: big type + cursor preview, and a terminal
//   Experience -> Contact     the hero world is behind the page again

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x) }

const LAYOUTS = ['rings']
const initialLayout = () => {
  try {
    const l = new URLSearchParams(window.location.search).get('layout')
    return LAYOUTS.includes(l) ? l : 'rings'
  } catch { return 'rings' }
}

export const scrollState = {
  hero: 0,        // 0 at the top -> 1 once the hero has scrolled out
  act: 0,         // 0 -> 1 while the Projects section is on screen
  project: 0,     // index of the project shown in 3D (written by Projects.jsx)
  layout: initialLayout(),
  focus: -1,      // the project ring that was double-clicked and is raised with its summary (-1 = none)
  hoverNode: null, // constellation: index of the node under the pointer
  fit: 1,         // world-scale of the hero rig (written by the scene)
  heroHide: 0,    // 0..1: 1 once the hero's own two rings are swapped for the project rings (written by the 'rings' layout)
  ringGate: 0,    // 0..1: how far the project rings have peeled out of the hero rings (straight from scroll)
  decoHide: 0,    // 0..1: how far the orbit lines, beads and wireframe sphere have faded away (written by the 'rings' layout)
  rigQuat: new THREE.Quaternion(),  // current rotation of the hero rig (written by the scene)
  starQuat: new THREE.Quaternion(), // rotation that turns the selected constellation node toward the camera
}

// 3D -> page: the scene asks the Projects section to select a project (e.g. a clicked constellation node)
const pickers = new Set()
export const onPick = (fn) => { pickers.add(fn); return () => pickers.delete(fn) }
export const pickProject = (i) => pickers.forEach((fn) => fn(i))

// 3D <-> page: double-clicking a ring raises it and opens its summary (focus = its index); -1 puts everything back
const focusers = new Set()
export const onFocus = (fn) => { focusers.add(fn); return () => focusers.delete(fn) }
export const setFocus = (i) => {
  if (scrollState.focus === i) return
  scrollState.focus = i
  focusers.forEach((fn) => fn(i))
}

let workEl = null

export function updateScrollState() {
  const vh = window.innerHeight || 1
  scrollState.hero = clamp01(window.scrollY / vh)

  if (!workEl || !workEl.isConnected) workEl = document.getElementById('work')
  if (!workEl) { scrollState.act = 0; return }

  const r = workEl.getBoundingClientRect()
  const enter = clamp01(1 - r.top / vh)     // 0 -> 1 while the section scrolls up into view
  const leave = clamp01(1 - r.bottom / vh)  // 0 -> 1 while it scrolls away
  scrollState.act = smooth(enter) * (1 - smooth(leave))

  // The project rings come OUT of the hero rings, driven straight by the scroll position (no easing over time),
  // so fast scrolling can never leave the animation lagging behind. Only wired up in the 'rings' layout.
  const g = scrollState.layout === 'rings' ? smooth((scrollState.act - 0.55) / 0.45) : 0
  scrollState.ringGate = g
  scrollState.decoHide = clamp01(g * 3)               // orbit lines / beads / wireframe sphere fade away
}
