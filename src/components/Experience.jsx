import { useCallback, useRef } from 'react'
import gsap from 'gsap'
import { useReveal } from '../lib/useReveal'

const items = [
  { when: '3 months', role: 'Full-Stack & Automation Intern', where: 'VedLogic', desc: 'Building automations with n8n and shipping features in React and C#.' },
  { when: '3 months', role: 'Intern', where: 'Infividhya', desc: 'Worked on React and Python.' },
  { when: 'Graduating 2027', role: 'Bachelor of Engineering — Computer Science', where: 'LDRP-ITR', desc: 'BE CE, in progress.' },
]

export default function Experience() {
  const ref = useRef(null)
  // draw the timeline line as the list scrolls through the viewport
  const extra = useCallback(() => {
    gsap.fromTo('.tl-line', { scaleY: 0 }, {
      scaleY: 1, ease: 'none', transformOrigin: 'top',
      scrollTrigger: { trigger: '.timeline', start: 'top 70%', end: 'bottom 70%', scrub: true },
    })
  }, [])
  useReveal(ref, extra)

  return (
    <section className="section experience" id="experience" ref={ref}>
      <span className="eyebrow" data-reveal>04 — Experience</span>
      <div className="timeline">
        <div className="tl-line" />
        {items.map((it, i) => (
          <div className="tl-item" key={i} data-reveal>
            <span className="tl-dot" />
            <span className="eyebrow">{it.when}</span>
            <h3>{it.role}</h3>
            {it.where && <p className="tl-where">{it.where}</p>}
            <p>{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
