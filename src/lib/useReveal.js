import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Fades/rises every [data-reveal] inside the ref'd section as it scrolls into view.
// Optional extra setup can be passed as a second arg and runs inside the same gsap context.
export function useReveal(ref, extra) {
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 50, opacity: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
      extra?.()
    }, ref)
    return () => ctx.revert()
  }, [ref, extra])
}
