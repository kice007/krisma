import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

// Counts up to `value` the first time it scrolls into view.
export default function Count({ value, format, duration = 1.6, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setN })
    return () => c.stop()
  }, [inView, value, duration])
  return (
    <span ref={ref} className={className}>
      {format(n)}
    </span>
  )
}
