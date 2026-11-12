import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import './Hero.css'

const roles = ['Full-Stack Developer', 'Workflow Automator', 'Builder who decides, AI assists']

// split a string into per-character spans (spaces preserved)
const Chars = ({ text }) =>
  text.split('').map((c, i) => (
    <span className="char-mask" key={i}>
      <span className="char" data-c={c}>{c === ' ' ? ' ' : c}</span>
    </span>
  ))

export default function Hero({ ready }) {
  const root = useRef(null)
  const introDone = useRef(false) // the letters ignore the pointer until their entrance (rise + lime wave) has finished

  // hide the text up-front: the loader is transparent now, so nothing covers it
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // letters wait below their masks, tilted; LIMBANI starts solid and is hollowed out later
      gsap.set('.char', { yPercent: 115, skewY: 14, transformOrigin: '0% 100%' })
      gsap.set('.title-row:nth-child(2) .char', { color: getComputedStyle(document.documentElement).getPropertyValue('--fg').trim() || '#f2f0ea' })
      gsap.set('.hero-fade', { opacity: 0, y: 24 })
    }, root)
    return () => ctx.revert()
  }, [])

  useLayoutEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      // name entrance:
      //  1. MEET rises out of its mask letter by letter, un-skewing as it lands
      //  2. LIMBANI follows, solid white
      //  3. a lime wave runs through LIMBANI and hollows each letter out to its outline
      const row1 = gsap.utils.toArray('.title-row:nth-child(1) .char')
      const row2 = gsap.utils.toArray('.title-row:nth-child(2) .char')
      const rise = { yPercent: 0, skewY: 0, duration: 1.4, ease: 'expo.out', stagger: 0.07 }
      // GSAP normally slows its clock after a hitch (lag smoothing), which made the wave freeze part-way and then catch up
      // in a jump while the 3D scene was still starting; during the entrance it follows real time instead.
      gsap.ticker.lagSmoothing(0)
      const LIME_OFF = 'rgba(198,255,61,0)'
      gsap.timeline({
        onComplete: () => {
          gsap.set(row2, { color: LIME_OFF }) // whatever happened on the way, the name ends as a clean outline
          gsap.ticker.lagSmoothing(500, 33)
          introDone.current = true
        },
      })
        .to(row1, rise, 0)
        .to(row2, rise, 0.3)
        .to(row2, {
          keyframes: [
            { color: '#c6ff3d', duration: 0.25, ease: 'power2.out' },
            { color: LIME_OFF, duration: 0.8, ease: 'power2.inOut' },
          ],
          stagger: 0.08,
        }, 1.3)

      gsap.to('.hero-fade', { opacity: 1, y: 0, duration: 1, delay: 0.8, stagger: 0.12, ease: 'power3.out' })

      // role ticker
      const tl = gsap.timeline({ repeat: -1, delay: 1.6 })
      roles.forEach((_, i) => {
        tl.to('.role-track', { yPercent: -(100 / (roles.length + 1)) * (i + 1), duration: 0.7, ease: 'expo.inOut' }, '+=1.6')
      })
      tl.set('.role-track', { yPercent: 0 })

      // parallax: only cheap DOM transforms on the text, canvas is left alone
      gsap.to('.hero-content', {
        yPercent: -18, opacity: 0.1, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, root)
    return () => { gsap.ticker.lagSmoothing(500, 33); ctx.revert() }
  }, [ready])

  // letters nudge away from the pointer
  const onMove = (e) => {
    if (!introDone.current) return // no pointer tweens fighting the entrance
    const chars = root.current.querySelectorAll('.char')
    chars.forEach((el) => {
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      const dy = e.clientY - (r.top + r.height / 2)
      const dist = Math.hypot(dx, dy)
      const pull = Math.max(0, 1 - dist / 220)
      gsap.to(el, { x: -dx * pull * 0.18, y: -dy * pull * 0.18, duration: 0.5, ease: 'power3.out', overwrite: 'auto' })
    })
  }
  const onLeave = () => introDone.current && gsap.to(root.current.querySelectorAll('.char'), { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1,0.5)' })

  return (
    <section className="hero" id="top" ref={root} onMouseMove={onMove} onMouseLeave={onLeave}>

      <div className="hero-content">
        <p className="hero-fade eyebrow hero-top">Portfolio — 2026</p>
        <h1 className="hero-title" aria-label="Meet Limbani">
          <span className="title-row"><Chars text="MEET" /></span>
          <span className="title-row"><Chars text="LIMBANI" /></span>
        </h1>
        <div className="hero-bottom">
          <div className="hero-fade role">
            <span className="role-label">I'm a</span>
            <span className="role-window">
              <span className="role-track">
                {[...roles, roles[0]].map((r, i) => <span key={i}>{r}</span>)}
              </span>
            </span>
          </div>
          <span className="hero-fade hero-scroll eyebrow"><i className="scroll-line" />Scroll</span>
        </div>
      </div>
    </section>
  )
}
