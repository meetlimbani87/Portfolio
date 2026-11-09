import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { scrollState, setFocus } from '../lib/scrollState'
import { stack } from '../lib/heroRings'
import { useDragTurn } from '../lib/dragTurn'
import BandRing from './BandRing'

/* LAYOUT "rings": the Ten Rings idea. The hero's two copper rings ARE project 1 and 2; as you scroll into the
   Projects section they move into a stack together with four more rings that peel away from them, and each
   ring's inscription turns into its project's name (see BandRing). Everything is driven straight by the scroll
   position, so fast scrolling cannot make the animation lag. Choosing a project opens the stack like an
   accordion around its ring, brightens its lettering and slows its spin. Hover a ring to light it, click it to
   select it.

   Click, hold and drag anywhere on the open background to turn the whole stack (only the rings, not the page
   text) to look at it from another side; let go and it coasts to a stop. This component adds the four extra
   rings, keeps the stack's tilt up to date and handles the drag. */

const _drag = new THREE.Quaternion(), _base = new THREE.Quaternion()
const canStart = () => scrollState.layout === 'rings' && scrollState.ringGate > 0.9
const onMoved = (m) => { stack.moved = m }

export default function ProjectRings() {
  const d = useDragTurn(canStart, onMoved)

  useFrame(({ clock }, dt) => {
    stack.sf += (scrollState.project - stack.sf) * (1 - Math.exp(-5 * dt))
    // the line-up opens and closes smoothly; it closes by itself when you leave the Projects section or the layout
    if (scrollState.focus >= 0 && (scrollState.act < 0.5 || scrollState.layout !== 'rings')) setFocus(-1)
    if (scrollState.focus >= 0) stack.fi = scrollState.focus
    // the raised ring as a smooth number: it jumps there while the line-up is closed, and slides when you switch rings
    if (stack.fv < 0.02) stack.ff = stack.fi
    else stack.ff += (stack.fi - stack.ff) * (1 - Math.exp(-3.5 * dt))
    stack.fv += ((scrollState.focus >= 0 ? 1 : 0) - stack.fv) * (1 - Math.exp(-3 * dt)) // slower, so the move reads as one smooth glide
    // While the rings glide between the stack and the row they move out from under a pointer that is standing still,
    // and the browser never reports that (no pointer-out), which left a ring lit green and enlarged. So while they move
    // nothing counts as hovered; the next real pointer movement lights whatever is under it.
    if (stack.fv > 0.02 && stack.fv < 0.98) scrollState.hoverNode = null
    const t = clock.elapsedTime

    d.step(dt) // coasts to a stop after letting go

    // the whole stack is tilted so you see the lettering on the outer faces, and drifts a little
    _base.setFromEuler(stack.e.set(0.42 + Math.sin(t * 0.3) * 0.05, -0.62 + Math.sin(t * 0.22) * 0.06, 0.12))
    // the visitor's drag turns it about the screen's own axes, on top of that
    d.quat(_drag)
    stack.q.copy(_drag).multiply(_base)
  })

  return (
    <group>
      {[2, 3, 4, 5].map((i) => <BandRing key={i} i={i} k={i % 2} />)}
    </group>
  )
}
