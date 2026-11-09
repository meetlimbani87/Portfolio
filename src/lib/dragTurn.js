import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

// Click-hold-drag to turn something in 3D (used for the hero world and for the project-ring stack).
// `canStart()` says whether a drag may begin right now. `onMoved(true/false)` reports when a drag is in
// progress. Returns the live state { yaw, pitch, down, ... } plus `step(dt)` (call once a frame: it coasts
// to a stop after letting go) and `quat(out)` (the turn as a quaternion, about the screen's own axes).
const INTERACTIVE = 'a, button, input, textarea, .project-list, .project-meta, .layout-switch, .nav, .cursor-preview'
const _e = new THREE.Euler()
const LIMIT = 1.3
const SENS = 0.0006 // radians turned per pixel dragged: very low, so one swipe turns it only a little (about 20 degrees across a full screen)

export function useDragTurn(canStart, onMoved) {
  const d = useMemo(() => ({ yaw: 0, pitch: 0, vy: 0, vp: 0, down: false, x: 0, y: 0, travelled: 0 }), [])

  useEffect(() => {
    const onDown = (e) => {
      if (e.pointerType === 'touch' || e.button !== 0) return // on touch screens the page keeps scrolling normally
      if (!canStart()) return
      if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return
      d.down = true; d.x = e.clientX; d.y = e.clientY; d.travelled = 0
    }
    const onMove = (e) => {
      if (!d.down) return
      const dx = e.clientX - d.x, dy = e.clientY - d.y
      d.x = e.clientX; d.y = e.clientY
      d.travelled += Math.abs(dx) + Math.abs(dy)
      if (d.travelled > 4) {
        onMoved?.(true)
        document.documentElement.classList.add('is-dragging')
      }
      d.vy = dx * SENS; d.vp = dy * SENS
      d.yaw += d.vy
      d.pitch = Math.max(-LIMIT, Math.min(LIMIT, d.pitch + d.vp))
    }
    const onUp = () => {
      if (!d.down) return
      d.down = false
      document.documentElement.classList.remove('is-dragging')
      setTimeout(() => onMoved?.(false), 0) // lets the click that follows a drag be ignored
    }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [d, canStart, onMoved])

  d.step = (dt) => {
    if (d.down) return
    // coast after letting go
    const f = Math.min(dt * 60, 3)
    d.yaw += d.vy * f
    d.pitch = Math.max(-LIMIT, Math.min(LIMIT, d.pitch + d.vp * f))
    const damp = Math.exp(-5 * dt)
    d.vy *= damp; d.vp *= damp
  }
  d.quat = (out) => out.setFromEuler(_e.set(d.pitch, d.yaw, 0, 'YXZ'))
  return d
}
