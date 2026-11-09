import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import './Cursor.css'

export default function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)

  useEffect(() => {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const dx = gsap.quickTo(dot.current, 'x', { duration: 0.1 })
    const dy = gsap.quickTo(dot.current, 'y', { duration: 0.1 })
    const rx = gsap.quickTo(ring.current, 'x', { duration: 0.5, ease: 'power3' })
    const ry = gsap.quickTo(ring.current, 'y', { duration: 0.5, ease: 'power3' })

    const move = (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY) }
    const over = (e) => {
      const hot = e.target.closest('a, button, [data-magnetic]')
      gsap.to(ring.current, { scale: hot ? 2.2 : 1, duration: 0.3 })
    }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseover', over)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseover', over)
    }
  }, [])

  return (
    <>
      <div className="cursor-ring" ref={ring} />
      <div className="cursor-dot" ref={dot} />
    </>
  )
}
