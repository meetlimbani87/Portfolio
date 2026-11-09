import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { getLenis } from '../lib/smoothScroll'
import './Nav.css'

const links = ['about', 'work', 'experience', 'contact']

export default function Nav({ ready }) {
  const bar = useRef(null)

  // nav joins the intro after the hero text
  useEffect(() => {
    if (ready) gsap.fromTo('.nav', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 1, delay: 0.6, ease: 'power3.out' })
  }, [ready])

  useEffect(() => {
    const lenis = getLenis()
    const onScroll = ({ progress }) => gsap.set(bar.current, { scaleX: progress })
    lenis?.on('scroll', onScroll)
    return () => lenis?.off('scroll', onScroll)
  }, [])

  const go = (id) => (e) => {
    e.preventDefault()
    // a pinned section lives inside a GSAP "pin-spacer" wrapper; aim at the wrapper so we land at the pin's start
    const el = document.getElementById(id)
    const target = el?.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el
    if (target) getLenis()?.scrollTo(target, { duration: 1.6 })
  }

  return (
    <header className="nav">
      <a href="#top" className="nav-logo" data-magnetic>ML.</a>
      <nav>
        {links.map((l) => (
          <a key={l} href={`#${l}`} onClick={go(l)} data-magnetic>{l}</a>
        ))}
      </nav>
      <div className="nav-progress" ref={bar} />
    </header>
  )
}
