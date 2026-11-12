import { useEffect, useRef, useState } from 'react'
import { useReveal } from '../lib/useReveal'
import PhotoTrail from './PhotoTrail'
import { PROJECTS } from '../data/projects'

// A number that counts up from 0 the first time it scrolls into view.
function CountUp({ to, suffix = '' }) {
  const ref = useRef(null)
  const [value, setValue] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(to); return }
    let raf = 0
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const t0 = performance.now()
      const dur = 1800
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / dur)
        setValue(Math.round(to * (1 - Math.pow(1 - k, 3)))) // eases out
        if (k < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, { threshold: 0.6 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [to])
  return <i ref={ref} style={{ fontStyle: 'normal' }}>{value}{value >= to ? suffix : ''}</i>
}

const stats = [
  { to: 2, l: 'Projects shipped' },
  { to: PROJECTS.length, l: 'Total projects' },
  { to: 300, suffix: '+', l: 'Live users on Expert HairArts' },
]

export default function About() {
  const ref = useRef(null)
  useReveal(ref)
  return (
    <section className="section about" id="about" ref={ref}>
      <span className="eyebrow" data-reveal>01 — About</span>
      <p className="about-lead" data-reveal>
        I'm Meet Limbani — a full-stack developer who builds products and automations.
      </p>
      <p className="about-note" data-reveal>
        Most of what I ship is AI-augmented delivery: I steer, review and ship, with AI in the loop.
      </p>
      <div className="about-grid">
        <PhotoTrail src="/about/meet.jpg" alt="Meet Limbani" />
        <div className="about-stats">
          {stats.map((s) => (
            <div className="stat" key={s.l} data-reveal>
              <strong><CountUp to={s.to} suffix={s.suffix} /></strong><span>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
