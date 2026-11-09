import { useRef } from 'react'
import { useReveal } from '../lib/useReveal'

const marquee = ['React', 'JavaScript', 'C#', 'Python', 'SQL', 'n8n', 'HTML', 'CSS', 'Git', 'VS Code']
const groups = [
  { title: 'Languages', items: ['JavaScript', 'C#', 'Python', 'SQL'] },
  { title: 'Frontend', items: ['React', 'HTML', 'CSS'] },
  { title: 'Tools', items: ['Git', 'VS Code', 'n8n'] },
]

export default function Skills() {
  const ref = useRef(null)
  useReveal(ref)
  const row = [...marquee, ...marquee]
  return (
    <section className="section skills" id="skills" ref={ref}>
      <span className="eyebrow" data-reveal>02 — Skills</span>
      <div className="marquee" data-reveal>
        <div className="marquee-track">
          {row.map((m, i) => <span key={i}>{m} <i>✦</i></span>)}
        </div>
      </div>
      <div className="skill-grid">
        {groups.map((g) => (
          <div className="skill-card" key={g.title} data-reveal data-magnetic>
            <h3>{g.title}</h3>
            <ul>{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        ))}
      </div>
    </section>
  )
}
