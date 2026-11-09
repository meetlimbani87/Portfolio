import { useRef } from 'react'
import gsap from 'gsap'
import { useReveal } from '../lib/useReveal'

const socials = [
  { label: 'GitHub', href: 'https://github.com/meetlimbani87' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/meet-limbani87' },
]

export default function Contact() {
  const ref = useRef(null)
  const cta = useRef(null)
  useReveal(ref)

  // button drifts toward the pointer
  const move = (e) => {
    const r = cta.current.getBoundingClientRect()
    gsap.to(cta.current, {
      x: (e.clientX - (r.left + r.width / 2)) * 0.25,
      y: (e.clientY - (r.top + r.height / 2)) * 0.25,
      duration: 0.4, ease: 'power3.out',
    })
  }
  const leave = () => gsap.to(cta.current, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1,0.4)' })

  return (
    <section className="section contact" id="contact" ref={ref}>
      <span className="eyebrow" data-reveal>05 — Contact</span>
      <h2 className="contact-title" data-reveal>Let's build<br />something.</h2>
      <a
        ref={cta} className="contact-cta" data-magnetic data-reveal
        href="mailto:meetlimbani87@gmail.com" onMouseMove={move} onMouseLeave={leave}
      >
        Say hello
      </a>
      <footer className="footer">
        <span>© 2026 Meet Limbani</span>
        <div>{socials.map((s) => <a key={s.label} href={s.href}>{s.label}</a>)}</div>
      </footer>
    </section>
  )
}
