import { useEffect, useState } from 'react'

// Live viewport size, for the sections drawn on a fixed Pencil stage.
export function useViewport() {
  const read = () => ({ w: document.documentElement.clientWidth, h: window.innerHeight })
  const [size, setSize] = useState(read)
  useEffect(() => {
    const on = () => setSize(read())
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return size
}
