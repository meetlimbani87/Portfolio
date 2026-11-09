import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import { PROJECTS } from '../data/projects'
import { scrollState, pickProject } from '../lib/scrollState'
import { PANES, PaneMesh, smooth, useProjectTextures } from './projectMedia'

/* LAYOUT 3 — "stars": the projects are glowing nodes on the outer layer of the hero world (the faint wireframe
   sphere), joined by thin lines like a star map. The world turns to bring the selected node to the front, and
   that project's images appear on a card beside it. Hover a node for its name; click it to select it. */

const LIME = new THREE.Color('#c6ff3d').multiplyScalar(2.2)
const R = 4.5                      // just outside the wireframe sphere (4.3)
const CARD_W = 2.4, CARD_H = 1.5 // 16:10 (the front of the sphere is close to the camera, so this looks bigger than it is)
const FRONT = new THREE.Vector3(-0.12, 0.03, 1).normalize() // where the selected node ends up: a little left of centre, so the card fits on its right

// spread the nodes evenly over the sphere (Fibonacci lattice)
const NODES = PROJECTS.map((p, k) => {
  const n = PROJECTS.length
  const y = n === 1 ? 0 : 1 - (2 * (k + 0.5)) / n
  const r = Math.sqrt(Math.max(0, 1 - y * y))
  const th = k * 2.399963 + 0.6
  const dir = new THREE.Vector3(r * Math.cos(th), y * 0.85, r * Math.sin(th)).normalize()
  return { title: p.title, dir, pos: dir.clone().multiplyScalar(R) }
})

// a curved line along the sphere between two nodes
function arc(a, b, n = 28) {
  const pts = []
  const q = new THREE.Quaternion().setFromUnitVectors(a, b)
  const id = new THREE.Quaternion()
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const qq = id.clone().slerp(q, t)
    pts.push(a.clone().applyQuaternion(qq).multiplyScalar(R + 0.02))
  }
  return pts
}

const _q = new THREE.Quaternion(), _inv = new THREE.Quaternion(), _v = new THREE.Vector3()

function Node({ i, node, gate }) {
  const core = useRef()
  const halo = useRef()
  const label = useRef()
  const mats = useRef()

  useFrame(({ clock, camera }) => {
    const g = gate.current
    const sel = scrollState.project === i ? 1 : 0
    const hov = scrollState.hoverNode === i ? 1 : 0
    const t = clock.elapsedTime
    const pulse = 1 + 0.14 * Math.sin(t * 2.4 + i * 1.3)
    core.current.scale.setScalar(Math.max(0.0001, g * (0.07 + 0.045 * sel + 0.035 * hov) * pulse))
    // the halo ring always faces the camera, even though the world is rotating
    halo.current.parent.getWorldQuaternion(_inv).invert()
    halo.current.quaternion.copy(_inv).multiply(camera.quaternion)
    halo.current.scale.setScalar(Math.max(0.0001, g * (0.14 + 0.09 * sel + 0.06 * hov) * (1 + 0.1 * Math.sin(t * 2.4 + i * 1.3 + 1))))
    mats.current.opacity = 0.35 + 0.5 * Math.max(sel, hov)
    // the name shows on hover (or while selected, small)
    if (label.current) label.current.style.opacity = g > 0.5 ? String(Math.max(hov, sel * 0.9)) : '0'
  })

  const onOver = (e) => { if (gate.current < 0.5) return; e.stopPropagation(); scrollState.hoverNode = i }
  const onOut = () => { if (scrollState.hoverNode === i) scrollState.hoverNode = null }
  const onClick = (e) => { if (gate.current < 0.5) return; e.stopPropagation(); pickProject(i) }

  return (
    <group position={node.pos}>
      <mesh ref={core}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={LIME} toneMapped={false} />
      </mesh>
      <mesh ref={halo}>
        <ringGeometry args={[0.8, 1, 48]} />
        <meshBasicMaterial ref={mats} color={LIME} toneMapped={false} side={THREE.DoubleSide} transparent opacity={0.4} depthWrite={false} />
      </mesh>
      {/* generous invisible hit area */}
      <mesh onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
        <sphereGeometry args={[0.38, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Html position={[0, 0.36, 0]} center zIndexRange={[0, 0]} style={{ pointerEvents: 'none' }}>
        <div ref={label} className="node-label">{node.title}</div>
      </Html>
    </group>
  )
}

export default function Constellation() {
  const gate = useRef(0)
  const card = useRef()
  const cardTarget = useRef(new THREE.Vector3())
  const cardInit = useRef(false)
  const textures = useProjectTextures(CARD_W / CARD_H)

  const lines = useMemo(() => {
    const n = NODES.length
    const out = []
    for (let k = 0; k < n; k++) {
      if (n === 2 && k === 1) break
      out.push(arc(NODES[k].dir, NODES[(k + 1) % n].dir))
    }
    return out
  }, [])

  // faint background stars scattered on the sphere
  const stars = useMemo(() => {
    const a = new Float32Array(120 * 3)
    for (let i = 0; i < 120; i++) {
      const v = new THREE.Vector3().randomDirection().multiplyScalar(R + 0.05 + Math.random() * 0.3)
      a[i * 3] = v.x; a[i * 3 + 1] = v.y; a[i * 3 + 2] = v.z
    }
    return a
  }, [])
  const starMat = useRef()
  const lineMats = useRef([])

  useFrame((_, dt) => {
    const on = scrollState.layout === 'stars'
    const target = on ? smooth(scrollState.act) : 0
    gate.current += (target - gate.current) * (1 - Math.exp(-5 * dt))
    const g = gate.current

    // turn the world so the selected node comes to the front
    const node = NODES[scrollState.project % NODES.length]
    scrollState.starQuat.setFromUnitVectors(node.dir, FRONT)

    // the card sits beside the selected node, on the screen's right, always facing the camera
    _inv.copy(scrollState.rigQuat).invert()
    _v.set(1.95, 0.1, 0.3).applyQuaternion(_inv)
    cardTarget.current.copy(node.pos).add(_v)
    if (!cardInit.current) { card.current.position.copy(cardTarget.current); cardInit.current = true }
    card.current.position.lerp(cardTarget.current, 1 - Math.exp(-5 * dt))
    card.current.quaternion.copy(_inv)
    card.current.visible = g > 0.01
    card.current.scale.setScalar(0.85 + 0.15 * g)

    if (starMat.current) starMat.current.opacity = 0.5 * g
    lineMats.current.forEach((m) => { if (m) m.opacity = 0.5 * g })
  })

  return (
    <group>
      {/* thin lines between the nodes, like a star map */}
      {lines.map((pts, i) => (
        <Line key={i} points={pts} color={LIME} lineWidth={1} transparent opacity={0} toneMapped={false} ref={(l) => { if (l) lineMats.current[i] = l.material }} />
      ))}
      <points>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[stars, 3]} /></bufferGeometry>
        <pointsMaterial ref={starMat} color="#f2f0ea" size={0.04} sizeAttenuation transparent opacity={0} depthWrite={false} />
      </points>
      {NODES.map((n, i) => <Node key={i} i={i} node={n} gate={gate} />)}

      {/* the selected project's images */}
      <group ref={card} visible={false}>
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[CARD_W + 0.1, CARD_H + 0.1]} />
          <meshBasicMaterial color="#040605" transparent opacity={0.85} depthWrite={false} />
        </mesh>
        {PANES.map((p, i) => (
          <PaneMesh key={`${p.pi}-${p.k}`} pane={p} tex={textures[i]} w={CARD_W} h={CARD_H} z={0.001 * (i + 1)} gate={gate} />
        ))}
        <Line
          points={[[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]].map(([a, b]) => new THREE.Vector3(a * (CARD_W / 2 + 0.05), b * (CARD_H / 2 + 0.05), 0.02))}
          color={LIME} lineWidth={1.4} toneMapped={false}
        />
      </group>
    </group>
  )
}
