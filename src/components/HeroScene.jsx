import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, RoundedBox, Line } from '@react-three/drei'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { intro } from '../lib/intro'
import { iconTexture } from '../lib/icons'
import { knotTexture, weatheredTexture } from '../lib/glyphs'
import { scrollState, updateScrollState } from '../lib/scrollState'
import ProjectRings from './ProjectRings'
import BandRing from './BandRing'
import { useDragTurn } from '../lib/dragTurn'

/* This file is the whole 3D stage. It lives in ONE fixed, full-screen canvas behind the page:
     - the hero world (cube, two rings, orbit lines) stays alive behind every section, centred once you leave the hero
     - one small silver orb per project rides the orbit lines; inside the Projects section each one in turn
       swells to fill the whole screen (see ProjectOrb) */

const LIME = '#c6ff3d'
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const ease = (x) => 1 - Math.pow(1 - clamp01(x), 3)
const easeBack = (x) => {
  const t = clamp01(x) - 1
  return 1 + 2.70158 * t * t * t + 1.70158 * t * t
}
const lerp = (a, b, t) => a + (b - a) * t

// HDR lime (>1) so the bloom pass picks it up and it glows
const limeHDR = new THREE.Color(LIME).multiplyScalar(2.2)

// world position of each orb's slot on its orbit (filled by <OrbSlot/>, read by <Bead/>)
const orbSlots = []

/* ------------------------------------------------------------------ core cube */
function Core() {
  const ref = useRef()
  const tex = useMemo(() => iconTexture('code'), [])
  const S = 0.95
  // the 12 box edges as individual thick lines
  const edges = useMemo(() => {
    const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(S, S, S))
    const p = g.attributes.position
    const out = []
    for (let i = 0; i < p.count; i += 2) {
      out.push([new THREE.Vector3().fromBufferAttribute(p, i), new THREE.Vector3().fromBufferAttribute(p, i + 1)])
    }
    return out
  }, [])

  useFrame(({ clock, pointer }) => {
    const t = clock.elapsedTime
    const s = ease(intro.orb)
    // the cube gives way to the project preview window in the Projects section
    ref.current.scale.setScalar(Math.max(s * (1 - scrollState.act), 0.0001))
    ref.current.visible = intro.orb > 0.001
    ref.current.rotation.x = 0.3 + Math.sin(t * 0.5) * 0.15 - pointer.y * 0.2
    ref.current.rotation.y = -0.45 + Math.sin(t * 0.4) * 0.25 + pointer.x * 0.3
  })

  return (
    <group ref={ref} scale={0.0001}>
      <RoundedBox args={[S, S, S]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial color="#07120a" roughness={0.05} metalness={0.1} transparent opacity={0.3} clearcoat={1} envMapIntensity={1.4} />
      </RoundedBox>
      {edges.map((e, i) => (
        <Line key={i} points={e} color={limeHDR} lineWidth={2.4} toneMapped={false} />
      ))}
      {/* inner glow */}
      <mesh scale={0.42}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={limeHDR} transparent opacity={0.2} toneMapped={false} depthWrite={false} />
      </mesh>
      {[S / 2 + 0.01, -S / 2 - 0.01].map((z) => (
        <mesh key={z} position={[0, 0, z]} rotation={[0, z < 0 ? Math.PI : 0, 0]}>
          <planeGeometry args={[0.64, 0.64]} />
          <meshBasicMaterial map={tex} color={limeHDR} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
      <pointLight color={LIME} intensity={9} distance={7} />
    </group>
  )
}

/* ------------------------------------------------------------------ Ten-Rings style band */
function ringProfile(R, thick, height, bevel, seg = 6) {
  const a = thick / 2, b = height / 2
  const corners = [
    [R + a - bevel, b - bevel, 0],
    [R - a + bevel, b - bevel, Math.PI / 2],
    [R - a + bevel, -b + bevel, Math.PI],
    [R + a - bevel, -b + bevel, Math.PI * 1.5],
  ]
  const pts = []
  for (const [x, y, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const ang = a0 + (i / seg) * (Math.PI / 2)
      pts.push(new THREE.Vector2(x + Math.cos(ang) * bevel, y + Math.sin(ang) * bevel))
    }
  }
  pts.push(pts[0].clone())
  return pts
}

/* Wedge-shaped band profile (like the reference rings): a flat outer face that carries the ornament,
   chamfered shoulders above and below it, and a flat polished inner wall. Corners get two points
   each, very close together, so the edges stay crisp instead of being smeared by smooth shading. */
function bandProfile(R, a, H) {
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

/* ------------------------------------------------------------------ thin orbit line + invisible slots the orbs follow */
function OrbSlot({ A, B, a0, speed, index }) {
  const ref = useRef()
  useEffect(() => {
    orbSlots[index] = ref.current
    return () => { orbSlots[index] = null }
  }, [index])
  const angle = useRef(a0)
  useFrame((_, dt) => {
    angle.current += dt * speed
    const a = angle.current
    ref.current.position.set(Math.cos(a) * A, 0, Math.sin(a) * B)
  })
  return <object3D ref={ref} />
}

function Orbit({ A, B, tilt, speed, slots = [], orderBase = 0 }) {
  const group = useRef()
  const line = useRef()
  const pts = useMemo(() => {
    const a = []
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * Math.PI * 2
      a.push(new THREE.Vector3(Math.cos(t) * A, 0, Math.sin(t) * B))
    }
    return a
  }, [A, B])

  useFrame(() => {
    group.current.scale.setScalar(Math.max(ease(intro.dust) * (1 - scrollState.decoHide), 0.0001)) // the orbit lines fade away in the project-rings layout
    group.current.visible = intro.dust > 0.001 && scrollState.decoHide < 0.995
  })

  return (
    <group ref={group} rotation={tilt} scale={0.0001} visible={false}>
      <Line ref={line} points={pts} color="#d5d9dd" lineWidth={1.1} transparent opacity={0.7} />
      {slots.map((s, i) => (
        <OrbSlot key={i} A={A} B={B} a0={s.a0} speed={speed} index={s.index} />
      ))}
    </group>
  )
}

/* ------------------------------------------------------------------ faint wireframe sphere */
function Shell() {
  const ref = useRef()
  const mat = useRef()
  useFrame(() => {
    const s = intro.shell
    ref.current.visible = s > 0.001 && scrollState.decoHide < 0.995
    ref.current.scale.setScalar(4.3 * (1.35 - 0.35 * s)) // contracts into place as it forms
    ref.current.rotation.y = (1 - s) * Math.PI * 0.9
    mat.current.opacity = intro.shellOpacity * (1 - scrollState.decoHide)
  })
  return (
    <mesh ref={ref} visible={false}>
      <icosahedronGeometry args={[1, 2]} />
      <meshBasicMaterial ref={mat} color="#f2f0ea" wireframe transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ small silver beads on the orbit lines
   Part of the hero's look. Decoration only. */
const BEAD = [0.085, 0.07, 0.095, 0.08] // radius of each bead (before rig scale)
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x) }

function Bead({ i }) {
  const root = useRef()
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    const slot = orbSlots[i]
    if (!slot) return
    slot.getWorldPosition(v)
    const pop = Math.max(easeBack(intro.tiles * 5.2 - i * 0.85), 0.0001) // hero intro: beads pop in one by one
    const r = BEAD[i % BEAD.length] * scrollState.fit * pop * (1 - scrollState.decoHide) // fades away in the project-rings layout
    root.current.position.copy(v)
    root.current.scale.setScalar(Math.max(r, 0.0001))
    root.current.visible = r > 0.002
  })
  return (
    <mesh ref={root} scale={0.0001} visible={false}>
      <sphereGeometry args={[1, 48, 48]} />
      <meshStandardMaterial color="#e8ebee" metalness={1} roughness={0.12} envMapIntensity={2} />
    </mesh>
  )
}

// split the beads across the two thin orbit lines: even ones on the first, odd ones on the second
const orbitSlots = (parity, offset) => {
  const idx = BEAD.map((_, i) => i).filter((i) => i % 2 === parity)
  return idx.map((index, j) => ({ index, a0: offset + (j / idx.length) * Math.PI * 2 }))
}
const ORBIT_A_SLOTS = orbitSlots(0, 0.5)
const ORBIT_B_SLOTS = orbitSlots(1, 1.3)

/* ------------------------------------------------------------------ whole rig */
// the hero world can be turned by click-and-drag, but only while the hero is on screen
const canTurnHero = () => scrollState.hero < 0.3
const heroDragQ = new THREE.Quaternion(), tmpQ = new THREE.Quaternion()

function Rig() {
  const drag = useDragTurn(canTurnHero)
  const root = useRef()
  const heroGroup = useRef()
  const target = useRef({ x: 0, y: 0 })
  const rigQ = useMemo(() => new THREE.Quaternion(), [])
  const swayQ = useMemo(() => new THREE.Quaternion(), [])
  const turn = useRef()
  const swayE = useMemo(() => new THREE.Euler(), [])
  const { size } = useThree()

  useFrame(({ pointer, clock }, dt) => {
    const t = clock.elapsedTime
    const k = 1 - Math.exp(-4 * dt)
    target.current.x += (pointer.x - target.current.x) * k
    target.current.y += (pointer.y - target.current.y) * k
    // responsive: wide screens put the rig right of the name; narrow screens centre it lower down,
    // leaving the top half for the name. Sized against the hero camera (z = 9.5, fov 40).
    const H0 = 2 * 9.5 * Math.tan(THREE.MathUtils.degToRad(20))
    const W0 = H0 * (size.width / size.height)
    const wide = size.width > 900
    const portrait = size.width <= 900
    const fit = wide
      ? Math.min(H0 / 7.6, W0 / 10)
      : Math.min(H0 / (portrait ? 9 : 7.6), W0 / (portrait ? 7.2 : 8))
    scrollState.fit = fit
    // once we scroll past the hero the rig settles into the middle of the screen (and a touch smaller)
    // and keeps moving there, behind the page
    const h = smooth(scrollState.hero)
    // in the Projects section the spinning world is the star of the screen, so it swells a touch
    root.current.scale.setScalar(fit * (1 - 0.12 * h) * (1 + 0.1 * scrollState.act))
    scrollState.halfW = W0 / 2 / root.current.scale.x
    root.current.position.x = wide ? W0 * 0.05 * (1 - h) : 0
    root.current.position.y = Math.sin(t * 0.8) * 0.1 * fit + (wide ? 0 : -H0 * (portrait ? 0.14 : 0.06) * (1 - h))
    // the pointer tilts the world, but not in the Projects section, where it holds still. In the constellation
    // layout the world instead turns to bring the selected project's node to the front.
    const sway = 1 - scrollState.act
    swayQ.setFromEuler(swayE.set(-target.current.y * 0.25 * sway, target.current.x * 0.35 * sway, 0))
    const goal = swayQ
    // the visitor's drag turns the world on top of that; it settles back as you scroll away from the hero
    drag.step(dt)
    const away = 1 - smooth(scrollState.hero * 4)
    if (away < 1) { const keep = Math.exp(-6 * dt); drag.yaw *= keep; drag.pitch *= keep; drag.vy *= keep; drag.vp *= keep }
    heroDragQ.identity().slerp(drag.quat(tmpQ), away)
    turn.current.quaternion.copy(heroDragQ) // the drag turns everything EXCEPT the cube in the middle, which only follows the cursor
    rigQ.slerp(goal, 1 - Math.exp(-3 * dt))
    root.current.quaternion.copy(rigQ)
    scrollState.rigQuat.copy(rigQ)
  })

  return (
    <group ref={root}>
      {/* the cube in the middle: it never turns with a drag, it only follows the cursor (through the whole rig) */}
      <group ref={heroGroup}>
        <Core />
      </group>
      {/* everything else turns when the visitor click-drags in the hero */}
      <group ref={turn}>
        <BandRing hero k={0} i={0} tilt={[0.55, 0.2, 1.2]} speed={0.45} channel="ring1" phase={0} />
        <BandRing hero k={1} i={1} tilt={[0.38, 0, -0.42]} speed={-0.38} channel="ring2" phase={2} />
        <Shell />
        <Orbit A={4.0} B={2.2} tilt={[0.55, 0.15, 0.5]} speed={0.16} slots={ORBIT_A_SLOTS} />
        <Orbit A={3.5} B={1.85} tilt={[0.2, -0.4, -0.75]} speed={-0.14} slots={ORBIT_B_SLOTS} />
        {/* the Projects section: ways to show the selected project (switch with the 1 / 2 / 3 keys) */}
        <Suspense fallback={null}>
          <ProjectRings />
        </Suspense>
      </group>
    </group>
  )
}

function Particles({ count = 900 }) {
  const ref = useRef()
  const mat = useRef()
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 4 + Math.random() * 8
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      arr[i * 3 + 2] = r * Math.cos(phi) - 3
    }
    return arr
  }, [count])

  useFrame(({ pointer }, dt) => {
    ref.current.rotation.y += dt * 0.03
    ref.current.rotation.x += (pointer.y * 0.15 - ref.current.rotation.x) * (1 - Math.exp(-2 * dt))
    mat.current.opacity = 0.6 * intro.dust
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={mat} color="#f2f0ea" size={0.03} sizeAttenuation transparent opacity={0} depthWrite={false} />
    </points>
  )
}


// runs first every frame so everything else sees this frame's scroll numbers
function ScrollDriver() {
  useFrame(() => {
    updateScrollState()
    if (import.meta.env.DEV) window.__scroll = scrollState // handy for debugging in the browser console
    // past the hero the whole stage dims a little so page text stays readable over the rig; in the
    // Projects section there is hardly any text, so the spinning world is shown almost undimmed
    const dim = 0.4 * smooth(scrollState.hero * 1.5) * (1 - 0.75 * scrollState.act)
    document.documentElement.style.setProperty('--stage-dim', dim.toFixed(3))
  }, -10)
  return null
}

export default function Stage() {
  const mobile = typeof window !== 'undefined' && window.innerWidth < 700
  return (
    <Canvas
      camera={{ position: [0, 0, 9.5], fov: 40 }}
      dpr={[1, mobile ? 1.25 : 1.5]}
      gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.NoToneMapping }}
      // the canvas sits behind the page, so listen for the pointer on the whole document instead
      eventSource={document.documentElement}
      eventPrefix="client"
    >
      <color attach="background" args={['#0a0a0c']} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 5, 5]} intensity={2.2} />
      <directionalLight position={[-5, -2, 3]} intensity={1.2} color="#9fb4ff" />
      <ScrollDriver />
      <Rig />
      {BEAD.map((_, i) => (
        <Bead key={i} i={i} />
      ))}
      <Particles />
      <Environment files="/hdri/potsdamer_platz_1k.hdr" environmentIntensity={0.7} />
      <EffectComposer multisampling={mobile ? 0 : 4}>
        <Bloom mipmapBlur intensity={0.8} luminanceThreshold={1} luminanceSmoothing={0.15} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
