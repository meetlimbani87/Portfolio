import * as THREE from 'three'

// The hero's two copper rings (index 0 = the smaller, 1 = the larger) register themselves here.
export const heroRings = [null, null]

// The shape of the two ring types. Every project ring is one of these, so the project rings ARE the hero rings
// (the hero's two rings are project 1 and 2; the other four are copies of them that peel away).
export const RING = [{ R: 2.55 }, { R: 3.05 }]
export const THICK = 0.25, H = 0.68, GLYPH_H = 0.3
export const STACK_R = 2.8     // every ring ends up this wide in the stack (whatever its hero size), so the stack is even
export const GAP = 0.98        // distance between neighbouring rings along the stack's axis
export const SPREAD = 0.5      // extra room the stack opens up on each side of the chosen ring (nothing overlaps)

// shared by all rings, updated once a frame by <ProjectRings/>
export const stack = {
  sf: 0,                       // the chosen ring as a smoothly moving number
  q: new THREE.Quaternion(),   // orientation of the whole stack
  e: new THREE.Euler(),
  fv: 0,                       // 0..1: how far the line-up (a ring raised, the others to its sides) has opened
  fi: 0,                       // the raised ring (last one chosen)
  ff: 0,                       // the raised ring as a smoothly moving number, so switching rings slides them across
  moved: false,                // true right after a drag, so letting go does not also click a ring
}
// a ring's own axis is its lathe +y; turning it to point along z makes the rings stack front-to-back
export const AXIS_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))

// The line-up when a ring is double-clicked: the chosen ring rises to the middle and the rings before it sit to its
// left and the rings after it to its right, smaller, all still spinning and all turned so their names can be read.
export const LINE = {
  focusR: 1.25,  // how wide the raised ring is
  focusY: 2.75,  // height of the raised ring (the top of the screen is about 3.4)
  sideR: 0.95,   // how wide the others are
  sideY: 3.05,   // height of the others: a row along the very top, so they can run off the edge
  sideX0: 3.0,   // distance of the nearest side ring from the middle
  sideDX: 2.1,   // spacing between side rings
  backZ: -2.6,   // how far the second ring out on each side is pushed back, so it is out of focus
  tilt: 0.32,    // how far the rings lean back toward you: low = flatter, seen more from the side
}
