import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { intro } from '../lib/intro'
import './Preloader.css'

// The loader no longer draws its own blob: it sits over the real hero scene and
// drives it. Sequence: orb grows from zero -> border forms -> name & everything else come in.
export default function Preloader({ onDone }) {
  const root = useRef(null)
  const numOutline = useRef(null)
  const numFill = useRef(null)
  const status = useRef(null)
  // keep the latest callback in a ref so a parent re-render never restarts the intro
  const doneRef = useRef(onDone)
  doneRef.current = onDone

  useEffect(() => {
    const ctx = gsap.context(() => {
      Object.assign(intro, { orb: 0, ring1: 0, ring2: 0, tiles: 0, shell: 0, shellOpacity: 0, dust: 0 })
      const state = { p: 0 }

      const tl = gsap.timeline()

      // 1. the orb grows from nothing while the outlined counter fills
      tl.to(state, {
        p: 100,
        duration: 3.2,
        ease: 'power2.inOut',
        onUpdate: () => {
          const p = state.p
          const txt = String(Math.round(p)).padStart(3, '0')
          root.current.style.setProperty('--p', p.toFixed(2))
          numOutline.current.textContent = txt
          numFill.current.textContent = txt
          status.current.textContent = p < 40 ? 'Loading' : p < 80 ? 'Building the scene' : 'Almost there'
          // cube first, then the two rings follow it while the counter is still running
          const q = p / 100
          const seg = (a, b) => Math.min(1, Math.max(0, (q - a) / (b - a)))
          intro.orb = seg(0, 0.4)
          intro.ring1 = seg(0.25, 0.7)
          intro.ring2 = seg(0.45, 0.95)
        },
      })
        // 2. counter steps aside -> wireframe sphere and thin orbit lines appear
        .to('.pre-ui', { opacity: 0, duration: 0.5 }, '+=0.1')
        .addLabel('build')
        .to(intro, { shell: 1, duration: 1.6, ease: 'expo.out' }, 'build')
        .to(intro, { shellOpacity: 0.07, duration: 0.5, ease: 'power2.out' }, 'build')
        .to(intro, { shellOpacity: 0.013, duration: 1.1, ease: 'power2.inOut' }, 'build+=0.5')
        .to(intro, { dust: 1, duration: 1.2, ease: 'power1.out' }, 'build+=0.2')
        // 3. logos pop in one after another along the orbit lines
        .to(intro, { tiles: 1, duration: 2, ease: 'none' }, 'build+=1')
        // 4. name, role, nav and the rest come in as the last logos land
        .call(() => {
          document.body.classList.remove('is-loading')
          doneRef.current?.()
        }, null, 'build+=2.2')
        .set(root.current, { display: 'none' })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div className="preloader" ref={root}>
      <div className="pre-ui">
        <div className="pre-top">
          <span className="eyebrow pre-label">Meet Limbani — Portfolio</span>
          <span className="eyebrow pre-status" ref={status}>Loading</span>
        </div>
        <div className="pre-count" aria-hidden="true">
          <span className="pre-outline" ref={numOutline}>000</span>
          <span className="pre-fill" ref={numFill}>000</span>
        </div>
        <div className="pre-bar" aria-hidden="true"><i /></div>
      </div>
    </div>
  )
}
