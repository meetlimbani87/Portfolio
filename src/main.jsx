import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './index.css'
import App from './App.jsx'

// Always start at the top. Browsers restore the old scroll position on refresh, which put the page in the
// middle of the site while the intro (loader, hero text, pinned sections) was still setting up: it glitched.
// ScrollTrigger remembers and re-applies the browser's original setting after every refresh, so tell it too.
gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.clearScrollMemory('manual')
window.scrollTo(0, 0)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
