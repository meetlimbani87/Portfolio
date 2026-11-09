import { Component } from 'react'

// If the 3D scene fails (blocked CDN asset, no WebGL, ...) keep the rest of the page alive.
export default class StageBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(err) { console.warn('3D stage unavailable:', err?.message) }
  render() { return this.state.failed ? null : this.props.children }
}
