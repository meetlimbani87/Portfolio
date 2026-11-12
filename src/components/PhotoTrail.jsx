import { useEffect, useRef } from 'react'

// Colour photo with a black-and-white "ink trail": the grey version is revealed around the cursor and
// fades away behind it as the pointer moves on. Drawn on a canvas laid over the colour <img>.
export default function PhotoTrail({ src, alt }) {
  const box = useRef(null)
  const img = useRef(null)
  const canvas = useRef(null)

  useEffect(() => {
    const el = box.current, cv = canvas.current, im = img.current
    const ctx = cv.getContext('2d')
    const mask = document.createElement('canvas')
    const mctx = mask.getContext('2d')
    const gray = document.createElement('canvas')
    let w = 0, h = 0, dpr = 1, raf = 0, idle = 0
    let last = null, cur = null

    const buildGray = () => {
      if (!im.naturalWidth || !w) return
      const g = gray.getContext('2d')
      gray.width = w; gray.height = h
      g.drawImage(im, 0, 0, w, h)
      const d = g.getImageData(0, 0, w, h)
      const px = d.data
      for (let i = 0; i < px.length; i += 4) {
        const y = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114
        px[i] = px[i + 1] = px[i + 2] = y
      }
      g.putImageData(d, 0, 0)
    }

    const resize = () => {
      const r = el.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = Math.round(r.width * dpr); h = Math.round(r.height * dpr)
      if (!w || !h) return
      cv.width = mask.width = w; cv.height = mask.height = h
      buildGray()
    }

    const stamp = (x, y) => {
      const rad = Math.max(w, h) * 0.17
      const grad = mctx.createRadialGradient(x, y, 0, x, y, rad)
      grad.addColorStop(0, 'rgba(0,0,0,1)')
      grad.addColorStop(0.45, 'rgba(0,0,0,0.6)')
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      mctx.fillStyle = grad
      mctx.fillRect(x - rad, y - rad, rad * 2, rad * 2)
    }

    const frame = () => {
      // slowly erase the mask so the grey fades out behind the pointer
      mctx.globalCompositeOperation = 'destination-out'
      mctx.fillStyle = 'rgba(0,0,0,0.03)'
      mctx.fillRect(0, 0, w, h)
      mctx.globalCompositeOperation = 'source-over'

      if (cur) {
        // fill the gap between two pointer events so fast moves stay a smooth stroke
        const from = last || cur
        const dist = Math.hypot(cur.x - from.x, cur.y - from.y)
        const step = Math.max(w, h) * 0.03
        const n = Math.max(1, Math.ceil(dist / step))
        for (let i = 1; i <= n; i++) stamp(from.x + ((cur.x - from.x) * i) / n, from.y + ((cur.y - from.y) * i) / n)
        last = cur; cur = null; idle = 0
      } else idle++

      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, w, h)
      ctx.drawImage(gray, 0, 0)
      ctx.globalCompositeOperation = 'destination-in'
      ctx.drawImage(mask, 0, 0)

      // stop the loop once everything has faded out
      if (idle > 240) { ctx.clearRect(0, 0, w, h); raf = 0; return }
      raf = requestAnimationFrame(frame)
    }
    const kick = () => { if (!raf) { idle = 0; raf = requestAnimationFrame(frame) } }

    const move = (e) => {
      const r = el.getBoundingClientRect()
      cur = { x: (e.clientX - r.left) * dpr, y: (e.clientY - r.top) * dpr }
      kick()
    }
    const leave = () => { last = null }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    if (!im.complete) im.addEventListener('load', buildGray, { once: true })
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerdown', move)
    el.addEventListener('pointerleave', leave)
    return () => {
      cancelAnimationFrame(raf); ro.disconnect()
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerdown', move)
      el.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <div className="about-photo" ref={box} data-reveal>
      <img ref={img} src={src} alt={alt} loading="lazy" decoding="async" draggable="false" />
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  )
}
