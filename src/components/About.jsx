import { useRef } from 'react'
import { useReveal } from '../lib/useReveal'
import PhotoTrail from './PhotoTrail'

const stats = [
  { n: '00+', l: 'Projects shipped' },
  { n: '0+', l: 'Years building' },
  { n: '00', l: 'Placeholder stat' },
]

export default function About() {
  const ref = useRef(null)
  useReveal(ref)
  return (
    <section className="section about" id="about" ref={ref}>
      <span className="eyebrow" data-reveal>01 — About</span>
      <p className="about-lead" data-reveal>
        I'm Meet Limbani — a developer who cares about how things feel, not just how they work.
        [Replace with your short intro.]
      </p>
      <div className="about-grid">
        <PhotoTrail src="/about/meet.jpg" alt="Meet Limbani" />
        <div className="about-stats">
          {stats.map((s) => (
            <div className="stat" key={s.l} data-reveal>
              <strong>{s.n}</strong><span>{s.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
