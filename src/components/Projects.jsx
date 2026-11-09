import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROJECTS } from '../data/projects'
import { scrollState, onPick } from '../lib/scrollState'
import { getLenis } from '../lib/smoothScroll'

gsap.registerPlugin(ScrollTrigger)

const pad = (n) => String(n).padStart(2, '0')

// The ways of showing a project, for comparing (switch with the buttons or the 1-3 keys). 1-4 draw the
// project in the 3D world behind the page (ProjectWindow / CubeConsole / Constellation / ProjectRings);
// 5 and 6 are page layouts (big type with a cursor-following preview, and a terminal).
const LAYOUTS = [
  ['stars', 'Constellation'], ['rings', 'Project rings'], ['type', 'Big type'],
]

// The section is pinned for a few screens of scrolling, one stretch per project. The hero world keeps
// spinning behind it. Scroll steps through the projects; hovering a name previews that project;
// clicking a name jumps to it.
export default function Projects() {
  const root = useRef(null)
  const trigger = useRef(null)
  const preview = useRef(null)
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(null)
  const [slide, setSlide] = useState(0)
  const [layout, setLayout] = useState(scrollState.layout)
  const shown = hover ?? active
  const isType = layout === 'type'

  useEffect(() => { scrollState.project = shown }, [shown])
  useEffect(() => { scrollState.layout = layout }, [layout])
  useEffect(() => {
    const onKey = (e) => {
      // typing digits into the terminal must not switch layouts
      if (e.target instanceof HTMLElement && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return
      const l = LAYOUTS[Number(e.key) - 1]
      if (l) setLayout(l[0])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useLayoutEffect(() => {
    const n = PROJECTS.length
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top top',
      end: `+=${n * 75}%`,
      pin: true,
      anticipatePin: 1,
      onUpdate: (self) => setActive(Math.min(n - 1, Math.floor(self.progress * n))),
    })
    trigger.current = st
    return () => st.kill()
  }, [])

  const jumpTo = (i) => {
    const st = trigger.current
    if (!st) return
    const y = st.start + ((i + 0.5) / PROJECTS.length) * (st.end - st.start)
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(y, { duration: 1.2 })
    else window.scrollTo({ top: y, behavior: 'smooth' })
  }

  // a click on a constellation node / project ring (in 3D) asks for that project
  const jumpRef = useRef(jumpTo)
  jumpRef.current = jumpTo
  useEffect(() => onPick((i) => jumpRef.current(i)), [])

  // 'type' layout: a preview picture follows the cursor while a name is hovered, cycling through the project's images
  useEffect(() => {
    if (!isType || hover === null) return
    setSlide(0)
    const id = setInterval(() => setSlide((s) => s + 1), 1100)
    return () => clearInterval(id)
  }, [isType, hover])
  useEffect(() => {
    if (!isType || !preview.current) return
    gsap.set(preview.current, { xPercent: -50, yPercent: -50 })
    const qx = gsap.quickTo(preview.current, 'x', { duration: 0.45, ease: 'power3' })
    const qy = gsap.quickTo(preview.current, 'y', { duration: 0.45, ease: 'power3' })
    // follows the cursor vertically, but stays to the right of the big names so it never covers the one you are hovering
    const move = (e) => { qx(Math.max(e.clientX + 260, window.innerWidth * 0.56)); qy(e.clientY) }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [isType])

  const p = PROJECTS[shown]
  const hp = hover !== null ? PROJECTS[hover] : null
  const previewSrc = hp && hp.images.length ? hp.images[slide % hp.images.length] : null

  return (
    <section className="projects" id="work" ref={root}>
      <div className="projects-inner">
        <span className="eyebrow">03 — Projects</span>
        <h2 className={`projects-title${isType ? ' is-compact' : ''}`}>Select<br />project</h2>

                  <ul className={`project-list${isType ? ' is-big' : ''}`}>
            {PROJECTS.map((pr, i) => (
              <li key={pr.title}>
                <button
                  type="button"
                  className={`project-item${shown === i ? ' is-active' : ''}`}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                  onClick={() => jumpTo(i)}
                  data-magnetic
                >
                  <span className="project-item-n">{pad(i + 1)}</span>
                  <span className="project-item-name">{pr.title}</span>
                  {isType && <span className="project-item-tag">{pr.tag}</span>}
                </button>
              </li>
            ))}
          </ul>

        {(
          <div className="project-meta" key={shown}>
            <span className="eyebrow">{p.tag}</span>
            <h3>{p.title}</h3>
            <p>{p.desc}</p>
            <div className="project-links">
              {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer" data-magnetic>Live site ↗</a>}
              {p.repo && <a href={p.repo} target="_blank" rel="noopener noreferrer" data-magnetic>Source ↗</a>}
            </div>
          </div>
        )}

        {isType && (
          <div className={`cursor-preview${hp ? ' on' : ''}`} ref={preview} aria-hidden="true">
            {previewSrc
              ? <img src={previewSrc} alt="" />
              : <div className="cursor-preview-card"><strong>{hp?.title}</strong><span>{hp?.tag}</span></div>}
          </div>
        )}

        <div className="layout-switch">
          {LAYOUTS.map(([id, label], i) => (
            <button key={id} type="button" className={layout === id ? 'is-on' : ''} onClick={() => setLayout(id)}>
              <span>{i + 1}</span> {label}
            </button>
          ))}
        </div>

        <span className="projects-count">{pad(shown + 1)} / {pad(PROJECTS.length)}</span>
      </div>
    </section>
  )
}
