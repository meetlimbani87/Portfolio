import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { getLenis } from '../lib/smoothScroll'
import './Nav.css'

const links = ['about', 'work', 'experience', 'contact']

export default function Nav({ ready }) {
  const bar = useRef(null)
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')

  // nav joins the intro after the hero text
  useEffect(() => {
    if (ready) gsap.fromTo('.nav', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1, delay: 0.6, ease: 'power3.out', clearProps: 'transform' })
  }, [ready])

  useEffect(() => {
    const lenis = getLenis()
    const onScroll = ({ progress }) => gsap.set(bar.current, { scaleX: progress })
    lenis?.on('scroll', onScroll)
    return () => lenis?.off('scroll', onScroll)
  }, [])

  // highlight the section that is currently in view
  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight * 0.45
      let found = ''
      for (const id of links) {
        const el = document.getElementById(id)
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.top <= mid && r.bottom > mid) found = id
      }
      setCurrent(found)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // side drawer: lock page scroll while open, close on Esc or when the viewport grows to desktop
  useEffect(() => {
    const lenis = getLenis()
    if (open) lenis?.stop(); else lenis?.start()
    document.documentElement.classList.toggle('menu-open', open)
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    const mq = window.matchMedia('(min-width: 761px)')
    const onMq = () => mq.matches && setOpen(false)
    window.addEventListener('keydown', onKey)
    mq.addEventListener('change', onMq)
    return () => {
      window.removeEventListener('keydown', onKey)
      mq.removeEventListener('change', onMq)
      lenis?.start()
      document.documentElement.classList.remove('menu-open')
    }
  }, [open])

  const scrollToId = useCallback((id) => {
    // a pinned section lives inside a GSAP "pin-spacer" wrapper; aim at the wrapper so we land at the pin's start
    const el = document.getElementById(id)
    const target = el?.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el
    if (target) getLenis()?.scrollTo(target, { duration: 1.6 })
  }, [])

  const go = (id) => (e) => {
    e.preventDefault()
    if (open) {
      setOpen(false)
      // let the drawer release the scroll lock before scrolling
      setTimeout(() => scrollToId(id), 60)
    } else scrollToId(id)
  }

  return (
    <header className={`nav${open ? ' is-open' : ''}`}>
      <a href="#top" className="nav-logo" data-magnetic onClick={() => setOpen(false)}>ML.</a>
      <nav className="nav-desktop" aria-label="Primary">
        {links.map((l) => (
          <a key={l} href={`#${l}`} onClick={go(l)} className={current === l ? 'is-current' : ''} data-magnetic>{l}</a>
        ))}
      </nav>
      <button
        type="button" className="nav-toggle" aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open} aria-controls="side-nav" onClick={() => setOpen((o) => !o)}
      >
        <span /><span />
      </button>
      <div className="nav-progress" ref={bar} />

      <div className="side-backdrop" onClick={() => setOpen(false)} aria-hidden="true" />
      <aside className="side-nav" id="side-nav" aria-hidden={!open} inert={!open}>
        <span className="eyebrow">Menu</span>
        <nav aria-label="Mobile">
          {links.map((l, i) => (
            <a key={l} href={`#${l}`} onClick={go(l)} className={current === l ? 'is-current' : ''} style={{ '--i': i }}>
              <span>{String(i + 1).padStart(2, '0')}</span>{l}
            </a>
          ))}
        </nav>
        <a className="side-mail" href="mailto:meetlimbani87@gmail.com">meetlimbani87@gmail.com</a>
      </aside>
    </header>
  )
}
