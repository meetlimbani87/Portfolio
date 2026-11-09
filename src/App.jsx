import { lazy, Suspense, useEffect, useState } from 'react'
import { initSmoothScroll } from './lib/smoothScroll'
import Preloader from './components/Preloader'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Skills from './components/Skills'
import Projects from './components/Projects'
import Experience from './components/Experience'
import Contact from './components/Contact'
import './components/sections.css'

// the 3D stage: one fixed canvas behind the whole page (hero rig + the scroll-driven orbs)
const Stage = lazy(() => import('./components/HeroScene'))

export default function App() {
  const [ready, setReady] = useState(false)

  useEffect(() => { initSmoothScroll() }, [])

  return (
    <>
      <Preloader onDone={() => setReady(true)} />
      <Cursor />
      <Nav ready={ready} />
      <div className="stage">
        <Suspense fallback={null}><Stage /></Suspense>
        <div className="stage-dim" />
        <div className="stage-vignette" />
        <div className="stage-grain" />
      </div>
      <main>
        <Hero ready={ready} />
        <About />
        <Skills />
        <Projects />
        <Experience />
        <Contact />
      </main>
    </>
  )
}
