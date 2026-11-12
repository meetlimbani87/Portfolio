import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROJECTS } from '../data/projects'
import { scrollState, onPick, onFocus, setFocus } from '../lib/scrollState'
import { getLenis } from '../lib/smoothScroll'

gsap.registerPlugin(ScrollTrigger)

// The full write-up of a double-clicked project: summary, highlights, stack, and a gallery whose pictures are shown
// at full size (click the big picture for a full-screen view).
function FocusPanel({ project: p, onClose }) {
  const [shot, setShot] = useState(0)
  const [zoom, setZoom] = useState(false)
  const n = p.images.length
  const panel = useRef(null)
  // Wheel / trackpad scrolling over the panel only ever scrolls the panel's own text. When the text reaches its top or
  // bottom (or the pointer is over the picture) the scroll is swallowed, so it never carries on into the page behind.
  useEffect(() => {
    const el = panel.current
    if (!el) return
    const onWheel = (e) => {
      // scrolling up with nothing left to scroll up to (the top of the text, or over the picture) goes back to the stack
      const text = el.querySelector('.focus-text')
      const inText = text && text.contains(e.target)
      const canScroll = inText && text.scrollHeight > text.clientHeight + 1
      const atTop = text && text.scrollTop <= 0
      const atBottom = text && text.scrollTop + text.clientHeight >= text.scrollHeight - 1
      if (canScroll && !((e.deltaY < 0 && atTop) || (e.deltaY > 0 && atBottom))) return // let the text scroll
      e.preventDefault()
      if (e.deltaY < 0) onClose()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onClose])
  useEffect(() => {
    if (!zoom) return
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); setZoom(false) }
      if (e.key === 'ArrowRight') setShot((i) => (i + 1) % n)
      if (e.key === 'ArrowLeft') setShot((i) => (i - 1 + n) % n)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [zoom, n])

  return (
    <div className={'focus-panel' + (n ? '' : ' no-shots')} ref={panel} data-lenis-prevent>
      <button type="button" className="focus-close" onClick={onClose} aria-label="Close summary" data-magnetic>✕</button>
      <div className="focus-text">
        {p.badges && <div className="focus-badges">{p.badges.map((b) => <span key={b}>{b}</span>)}</div>}
        <span className="eyebrow">{p.tag}</span>
        <h3>{p.title}</h3>
        {p.summary.map((t, i) => <p key={i}>{t}</p>)}
        <ul className="focus-points">{p.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
        <div className="focus-stack">{p.stack.map((t) => <span key={t}>{t}</span>)}</div>
        <div className="project-links">
          {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer" data-magnetic>Live site ↗</a>}
          {p.repo && <a href={p.repo} target="_blank" rel="noopener noreferrer" data-magnetic>Source ↗</a>}
        </div>
      </div>
      {n > 0 && (
        <div className="focus-gallery">
          <button type="button" className="focus-main" onClick={() => setZoom(true)} aria-label="View picture full screen">
            <img key={p.images[shot]} src={p.images[shot]} alt={p.title + ' screenshot ' + (shot + 1)} decoding="async" />
            <span className="focus-count">{shot + 1} / {n}</span>
          </button>
          {n > 1 && (
            <div className="focus-thumbs">
              {p.images.map((src, i) => (
                <button key={src} type="button" className={i === shot ? 'is-on' : ''} onClick={() => setShot(i)} aria-label={'Show picture ' + (i + 1)}>
                  <img src={src} alt="" loading="lazy" decoding="async" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {zoom && (
        <div className="lightbox" onClick={() => setZoom(false)} role="dialog" aria-label="Full-size picture">
          <img src={p.images[shot]} alt={p.title + ' screenshot ' + (shot + 1)} />
          {n > 1 && <button type="button" className="lb-nav lb-prev" onClick={(e) => { e.stopPropagation(); setShot((shot - 1 + n) % n) }} aria-label="Previous picture">‹</button>}
          {n > 1 && <button type="button" className="lb-nav lb-next" onClick={(e) => { e.stopPropagation(); setShot((shot + 1) % n) }} aria-label="Next picture">›</button>}
          <button type="button" className="lb-close" onClick={() => setZoom(false)} aria-label="Close">✕</button>
        </div>
      )}
    </div>
  )
}

const pad = (n) => String(n).padStart(2, '0')

// The section is pinned for a few screens of scrolling, one stretch per project. The hero world keeps
// spinning behind it (the project rings are the hero's own rings, see BandRing). Scroll steps through the projects;
// hovering a name previews that project; clicking a name jumps to it; double-clicking a ring raises it and opens its
// write-up.
export default function Projects() {
  const root = useRef(null)
  const trigger = useRef(null)
  const [active, setActive] = useState(0)
  const [hover, setHover] = useState(null)
  const [focus, setFocusIdx] = useState(-1) // a ring was double-clicked: it is raised and its summary is open
  const shown = focus >= 0 ? focus : (hover ?? active)

  useEffect(() => { scrollState.project = shown }, [shown])
  // double-clicking a ring in 3D raises it; Esc, the close button or scrolling puts it back
  useEffect(() => onFocus(setFocusIdx), [])
  useEffect(() => {
    if (focus < 0) return
    // scrolling over the summary reads it; scrolling anywhere else closes it and goes back to the stack
    const close = () => setFocus(-1)
    const onWheel = (e) => { if (!(e.target instanceof Element && e.target.closest('.focus-panel'))) close() }
    const onKey = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('wheel', onWheel) }
  }, [focus])

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

  // a click on a project ring (in 3D) asks for that project
  const jumpRef = useRef(jumpTo)
  jumpRef.current = jumpTo
  useEffect(() => onPick((i) => jumpRef.current(i)), [])

  const p = PROJECTS[shown]

  return (
    <section className={`projects${focus >= 0 ? ' is-focus' : ''}`} id="work" ref={root}>
      <div className="projects-inner">
        <span className="eyebrow">03 — Projects</span>
        <h2 className="projects-title">Select<br />project</h2>

        <ul className="project-list">
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
                onDoubleClick={() => { jumpTo(i); setFocus(i) }} // double-click a name: its ring rises and the case study opens
                data-magnetic
              >
                <span className="project-item-n">{pad(i + 1)}</span>
                <span className="project-item-name">{pr.title}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="project-meta" key={`meta-${shown}`}>
          <span className="eyebrow">{p.tag}</span>
          <h3>{p.title}</h3>
          <p>{p.desc}</p>
          <div className="project-links">
            {p.live && <a href={p.live} target="_blank" rel="noopener noreferrer" data-magnetic>Live site ↗</a>}
            {p.repo && <a href={p.repo} target="_blank" rel="noopener noreferrer" data-magnetic>Source ↗</a>}
          </div>
        </div>

        {focus >= 0 && <FocusPanel key={`panel-${focus}`} project={PROJECTS[focus]} onClose={() => setFocus(-1)} />}

        <span className="projects-count">{pad(shown + 1)} / {pad(PROJECTS.length)}</span>
      </div>
    </section>
  )
}
