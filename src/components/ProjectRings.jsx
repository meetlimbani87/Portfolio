import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PROJECTS } from '../data/projects'
import { scrollState, pickProject } from '../lib/scrollState'
import { heroRings } from '../lib/heroRings'
import { bandProfile, nameTexture } from '../lib/bands'
import { weatheredTexture } from '../lib/glyphs'

/* LAYOUT 4 — "rings": the Ten Rings idea. Each project is one ring in a stack, with the project's name
   engraved around its band in glowing letters.

   THE TRANSITION: the project rings come OUT of the hero's two copper rings. As you scroll into the section,
   each project ring starts exactly where one of the hero rings is (same place, same tilt, same size), then
   peels away one after another and slides out into the stack, its lettering lighting up as it goes. Scrolling
   back reverses it: the rings slide back together and merge into the hero rings again. The orbit lines, beads
   and the faint wireframe sphere fade away so only the rings remain.

   Choosing a project opens the stack like an accordion around its ring (nothing overlaps), makes its lettering
   glow brighter and slows its spin so the name can be read. Hover a ring to light it, click it to select it. */

const LIME = new THREE.Color('#c6ff3d')
const R = 2.4, THICK = 0.28, H = 0.8, GLYPH_H = 0.48
const HERO_R = [2.55, 3.05] // radii of the hero's two rings (HeroScene.jsx)
const GAP = 0.98 // distance between neighbouring rings along the stack's axis
const SPREAD = 0.5 // extra room the stack opens up on each side of the chosen ring (an accordion: nothing overlaps)

const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x) }

// shared between the rings and the parent (updated once a frame in <ProjectRings/>)
const stack = {
  sf: 0, // the chosen ring as a smoothly moving number
  q: new THREE.Quaternion(), // orientation of the whole stack
  e: new THREE.Euler(),
}
// the ring's own axis is its lathe +y; turning it to point along z makes the rings stack front-to-back
const AXIS_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0))
const _q0 = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _p = new THREE.Vector3()

function NameRing({ i, gate }) {
  const root = useRef()
  const spin = useRef()
  const glyphMat = useRef()
  const sel = useRef(0)
  const hov = useRef(0)
  const n = PROJECTS.length
  const z0 = ((n - 1) / 2 - i) * GAP // the first project is the front ring
  const dir = i % 2 ? -1 : 1
  const outerR = R + THICK / 2

  const geo = useMemo(() => new THREE.LatheGeometry(bandProfile(R, THICK / 2, H), 200), [])
  const tex = useMemo(() => nameTexture(PROJECTS[i].title, Math.max(1, Math.round((2 * Math.PI * R) / (GLYPH_H * 8)))), [i])
  const worn = useMemo(() => weatheredTexture(), [])

  useFrame((_, dt) => {
    const isSel = scrollState.project === i ? 1 : 0
    const isHov = scrollState.hoverNode === i ? 1 : 0
    sel.current += (isSel - sel.current) * (1 - Math.exp(-6 * dt))
    hov.current += (isHov - hov.current) * (1 - Math.exp(-8 * dt))

    // how far this ring has peeled out of its hero ring (0 = still on it, 1 = in its place in the stack);
    // each ring leaves a little after the previous one
    const e = smooth(gate.current * 1.8 - i * 0.16)
    root.current.visible = gate.current > 0.002

    // start pose: the hero ring this one comes out of (rings alternate between the two)
    const hero = heroRings[i % 2]
    _q1.copy(stack.q).multiply(AXIS_Q) // end pose: its place in the tilted stack
    let s0 = 1
    if (hero) { _q0.copy(hero.quaternion); s0 = HERO_R[i % 2] / R } else _q0.copy(_q1)
    root.current.quaternion.slerpQuaternions(_q0, _q1, e)

    // the stack opens up around the chosen ring: rings in front slide forward, rings behind slide back
    const z = z0 - SPREAD * Math.max(-1, Math.min(1, i - stack.sf))
    _p.set(0, 0, z).applyQuaternion(stack.q).multiplyScalar(e)
    root.current.position.copy(_p)
    root.current.scale.setScalar((s0 + (1 - s0) * e) * (1 + 0.02 * hov.current))

    // slower while selected so the name can be read
    spin.current.rotation.y += dt * dir * (0.5 - 0.38 * sel.current)

    // the lettering lights up as the ring leaves the hero ring, and glows brighter on the chosen ring
    const k = 0.5 + 1.7 * sel.current + 0.5 * hov.current
    glyphMat.current.color.setRGB(LIME.r * k, LIME.g * k, LIME.b * k)
    glyphMat.current.opacity = smooth((e - 0.25) / 0.75)
  })

  const onOver = (e) => { if (gate.current < 0.5) return; e.stopPropagation(); scrollState.hoverNode = i }
  const onOut = () => { if (scrollState.hoverNode === i) scrollState.hoverNode = null }
  const onClick = (e) => { if (gate.current < 0.5) return; e.stopPropagation(); pickProject(i) }

  return (
    <group ref={root} visible={false}>
      <group ref={spin}>
        <mesh geometry={geo} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
          <meshStandardMaterial color="#b8693a" metalness={1} roughness={0.3} roughnessMap={worn} bumpMap={worn} bumpScale={0.7} side={THREE.DoubleSide} envMapIntensity={1.7} />
        </mesh>
        {/* the project's name, engraved in glowing letters around the outer face */}
        <mesh>
          <cylinderGeometry args={[outerR + 0.004, outerR + 0.004, GLYPH_H, 200, 1, true]} />
          <meshBasicMaterial ref={glyphMat} map={tex} color={LIME} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
        {[GLYPH_H / 2, -GLYPH_H / 2].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[outerR + 0.003, 0.01, 8, 200]} />
            <meshBasicMaterial color={LIME.clone().multiplyScalar(2.2)} toneMapped={false} />
          </mesh>
        ))}
        <mesh>
          <cylinderGeometry args={[R - THICK / 2 - 0.004, R - THICK / 2 - 0.004, 0.05, 180, 1, true]} />
          <meshBasicMaterial color={LIME.clone().multiplyScalar(2.2)} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

export default function ProjectRings() {
  const gate = useRef(0)

  useFrame(({ clock }, dt) => {
    // tied to scrolling into the section, so the rings peel out as you scroll
    // starts only once the section is mostly on screen, so nothing peels apart behind the Skills section above it
    const target = scrollState.layout === 'rings' ? smooth((scrollState.act - 0.55) / 0.45) : 0
    gate.current += (target - gate.current) * (1 - Math.exp(-4 * dt))
    const g = gate.current

    // the hero's own rings are swapped for the project rings the instant those start (they sit exactly on top of
    // each other), and the orbit lines / beads / wireframe sphere fade away while the rings leave
    scrollState.heroHide = clamp01(g * 40)
    scrollState.decoHide = clamp01(g * 3)

    stack.sf += (scrollState.project - stack.sf) * (1 - Math.exp(-5 * dt))
    const t = clock.elapsedTime
    // the whole stack is tilted so you see the lettering on the outer faces, and drifts a little
    stack.q.setFromEuler(stack.e.set(0.42 + Math.sin(t * 0.3) * 0.05, -0.62 + Math.sin(t * 0.22) * 0.06, 0.12))
  })

  return (
    <group>
      {PROJECTS.map((p, i) => (
        <NameRing key={p.title} i={i} gate={gate} />
      ))}
    </group>
  )
}
