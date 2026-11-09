import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { intro } from '../lib/intro'
import { knotTexture, weatheredTexture } from '../lib/glyphs'
import { bandProfile, engraveTextures } from '../lib/bands'
import { scrollState, pickProject, setFocus } from '../lib/scrollState'
import { PROJECTS } from '../data/projects'
import { heroRings, RING, THICK, H, GLYPH_H, STACK_R, GAP, SPREAD, LINE, stack, AXIS_Q } from '../lib/heroRings'

/* One solid copper ring. The same component is used for the hero's two rings and for the other project rings,
   so a project ring is literally a hero ring: it keeps its geometry, material and spin, and as you scroll into
   the Projects section it just moves into its place in the stack while its inscription turns from the hero's
   knot pattern into the project's name.

   Props: k = which hero ring it is (0 smaller, 1 larger); i = which project it carries (a hero ring carries
   project k; extra rings carry 2..5); hero = true for the two rings that are always there. */

const LIME = new THREE.Color('#c6ff3d')
const limeHDR = LIME.clone().multiplyScalar(2.2)
const DULL = new THREE.Color(0.34, 0.27, 0.21) // the bland, unlit look of a ring that is not selected
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x) }
const ease = (x) => 1 - Math.pow(1 - clamp01(x), 3)
// In the line-up every ring lies flat like a hoop, leaning back toward you: its name runs along the front rim, so it
// reads left to right and scrolls past as the ring spins, and you can still see into the opening.
const LINE_Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(LINE.tilt, 0, 0))
const _e = new THREE.Euler(), _q0 = new THREE.Quaternion(), _q1 = new THREE.Quaternion(), _p = new THREE.Vector3()

export default function BandRing({ k, i, hero = false, tilt = [0, 0, 0], speed = 0.4, channel, phase = 0 }) {
  const { R } = RING[k]
  const outer = useRef()
  const spin = useRef()
  const knotMat = useRef()
  const nameMat = useRef()
  const sel = useRef(0)
  const hov = useRef(0)
  const n = PROJECTS.length
  const z0 = ((n - 1) / 2 - i) * GAP // the first project is the front ring
  const dir = i % 2 ? -1 : 1
  const outerR = R + THICK / 2
  const rep = Math.max(1, Math.round((2 * Math.PI * R) / (GLYPH_H * 8)))

  const geo = useMemo(() => new THREE.LatheGeometry(bandProfile(R, THICK / 2, H), 220), [R])
  const knot = useMemo(() => knotTexture(rep), [rep])
  // the name is carved into the OUTER face of the ring, where the hero's knot band is
  const eng = useMemo(() => engraveTextures(PROJECTS[i].title, rep, false), [i, rep])
  const worn = useMemo(() => weatheredTexture(), [])
  // one material for the glowing rules and the inner strip, so they can all be dimmed together
  const glowMat = useMemo(() => new THREE.MeshBasicMaterial({ color: limeHDR.clone(), toneMapped: false, side: THREE.DoubleSide }), [])

  useEffect(() => {
    if (!hero) return
    heroRings[k] = outer.current
    return () => { heroRings[k] = null }
  }, [hero, k])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime
    const o = outer.current
    const v = hero ? intro[channel] : 1
    const isSel = scrollState.project === i ? 1 : 0
    const isHov = scrollState.hoverNode === i ? 1 : 0
    sel.current += (isSel - sel.current) * (1 - Math.exp(-6 * dt))
    hov.current += (isHov - hov.current) * (1 - Math.exp(-8 * dt))

    // how far this ring has moved from the hero into the stack. It comes straight from the scroll position
    // (never eased over time), each ring leaving a little after the previous one.
    const e = smooth(scrollState.ringGate * 1.8 - i * 0.16)

    // hero pose: the ring precesses and wobbles like a gyroscope. Extra rings start exactly on their hero ring.
    const base = hero ? null : heroRings[k]
    if (hero) {
      _q0.setFromEuler(_e.set(
        tilt[0] + Math.sin(t * 0.35 + phase) * 0.14,
        tilt[1] + t * 0.09 * Math.sign(speed),
        tilt[2] + (1 - ease(v)) * 1.4, // swings into its tilt as it forms
      ))
    } else if (base) _q0.copy(base.quaternion)
    else _q0.identity()
    o.visible = hero ? v > 0.001 : (e > 0.001 && !!base)

    // the stack opens up around the chosen ring: rings in front slide forward, rings behind slide back
    _q1.copy(stack.q).multiply(AXIS_Q)
    o.quaternion.slerpQuaternions(_q0, _q1, e)
    const z = z0 - SPREAD * Math.max(-1, Math.min(1, i - stack.sf))
    _p.set(0, 0, z).applyQuaternion(stack.q).multiplyScalar(e)

    // line-up (after a double-click): the raised ring is in the middle, the rings before it in a row along the top to its left
    // and the rings after it in a row along the top to its right. rel is how far this ring is from the raised one (a smooth number,
    // so when you pick another ring they all slide across instead of jumping).
    const rel = i - stack.ff
    const a = Math.abs(rel)
    const tt = smooth(a)
    const slot = Math.max(a - 1, 0)
    const lx = Math.sign(rel) * (LINE.sideX0 + LINE.sideDX * slot) * tt
    const ly = LINE.focusY + (LINE.sideY - LINE.focusY) * tt
    const f = smooth(stack.fv * 1.5 - 0.1 * a)
    o.quaternion.slerp(LINE_Q, f)
    // only three rings are sharp (the raised one and one either side); the next one out on each side is pushed back so it
    // falls out of focus (the scene blurs by depth), and anything further out is gone
    const back = LINE.backZ * smooth(a - 1)
    const gone = 1 - smooth((a - 2.1) / 0.7)
    o.position.set(_p.x + (lx - _p.x) * f, _p.y + (ly - _p.y) * f, _p.z * (1 - f) + back * f)
    if (f > 0.001 && gone < 0.01) o.visible = false
    const wide = LINE.focusR + (LINE.sideR - LINE.focusR) * tt
    const lineScale = (1 + (wide / STACK_R - 1) * f) * (1 - f * (1 - gone))
    o.scale.setScalar(Math.max(ease(v) * (1 + (STACK_R / R - 1) * e) * lineScale * (1 + 0.08 * hov.current), 0.0001))

    // spins at its hero speed, slowing to a readable crawl on the chosen ring
    spin.current.rotation.y += dt * (speed * (1 - e) + dir * (0.5 - 0.38 * sel.current) * e)

    // inscription: the hero's knot pattern gives way to the project's name, which glows brighter when chosen
    knotMat.current.opacity = 1 - smooth(e * 2.2)
    // In the project layouts only the selected ring glows green: the others keep their copper and a dull, bland
    // inscription. (In the hero, e = 0, everything glows as before.)
    const lit = Math.min(1, sel.current + 0.6 * hov.current)
    const glow = 1 + (lit - 1) * e // 1 in the hero, then only the selected ring stays lit
    glowMat.color.setRGB(DULL.r + (limeHDR.r - DULL.r) * glow, DULL.g + (limeHDR.g - DULL.g) * glow, DULL.b + (limeHDR.b - DULL.b) * glow)
    // the engraving: it fades in as the ring leaves the hero, and ONLY the selected ring's letters glow green
    nameMat.current.opacity = smooth((e - 0.25) / 0.75)
    nameMat.current.emissiveIntensity = (2.4 * sel.current + 1.0 * hov.current) * nameMat.current.opacity
  })

  const live = () => scrollState.ringGate > 0.5
  const onOver = (ev) => { if (!live()) return; ev.stopPropagation(); scrollState.hoverNode = i }
  const onOut = () => { if (scrollState.hoverNode === i) scrollState.hoverNode = null }
  // click selects a ring; while a ring is raised, clicking another one raises that one instead
  const onClick = (ev) => {
    if (!live() || stack.moved) return
    ev.stopPropagation()
    if (scrollState.focus >= 0) setFocus(i)
    else pickProject(i)
  }
  // double-click raises the ring and opens its summary
  const onDouble = (ev) => {
    if (!live() || stack.moved) return
    ev.stopPropagation()
    if (scrollState.focus < 0) { pickProject(i); setFocus(i) }
  }

  return (
    <group ref={outer} scale={0.0001} visible={false}>
      <group ref={spin}>
        {/* solid beveled copper band */}
        <mesh geometry={geo} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick} onDoubleClick={onDouble}>
          <meshStandardMaterial color="#b8693a" metalness={1} roughness={0.3} roughnessMap={worn} bumpMap={worn} bumpScale={0.7} side={THREE.DoubleSide} envMapIntensity={1.7} />
        </mesh>
        {/* engraved glowing inscription around the outer face: knot pattern (hero) ... */}
        <mesh>
          <cylinderGeometry args={[outerR + 0.004, outerR + 0.004, GLYPH_H, 220, 1, true]} />
          <meshBasicMaterial ref={knotMat} map={knot} color={limeHDR} transparent toneMapped={false} depthWrite={false} />
        </mesh>
        {/* ... and the project's name, carved into the same outer face (projects) */}
        <mesh>
          <cylinderGeometry args={[outerR + 0.005, outerR + 0.005, GLYPH_H, 220, 1, true]} />
          <meshStandardMaterial
            ref={nameMat} map={eng.color} alphaMap={eng.alpha} bumpMap={eng.bump} bumpScale={6}
            emissive={LIME} emissiveMap={eng.glow} emissiveIntensity={0}
            metalness={0.6} roughness={0.45} envMapIntensity={0.9} transparent opacity={0}
            polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2}
          />
        </mesh>
        {/* glowing rules framing the inscription */}
        {[GLYPH_H / 2, -GLYPH_H / 2].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[outerR + 0.003, 0.01, 8, 220]} />
            <primitive object={glowMat} attach="material" />
          </mesh>
        ))}
        {/* glowing strip on the inner wall */}
        <mesh>
          <cylinderGeometry args={[R - THICK / 2 - 0.004, R - THICK / 2 - 0.004, 0.05, 200, 1, true]} />
          <primitive object={glowMat} attach="material" />
        </mesh>
      </group>
    </group>
  )
}
