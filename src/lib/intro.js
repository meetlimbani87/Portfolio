// Shared, mutable intro state. GSAP (Preloader) writes to it, the 3D scene reads it every frame.
// Kept outside React state on purpose: it changes 60x/sec and must not trigger re-renders.
// Order of play: cube -> ring1 -> ring2 -> tiles (logos one by one) -> the rest
export const intro = {
  orb: 0,          // 0 -> 1  core cube grows from nothing
  ring1: 0,        // 0 -> 1  first ring forms
  ring2: 0,        // 0 -> 1  second ring forms
  tiles: 0,        // 0 -> 1  logo tiles pop in one after another
  shell: 0,        // 0 -> 1  faint wireframe sphere forms
  shellOpacity: 0, // flashes while forming, then settles
  dust: 0,         // 0 -> 1  particles, orbit line and beads fade in
}
