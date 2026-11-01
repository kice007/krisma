import { motion } from 'framer-motion'

export const EASE = [0.16, 1, 0.3, 1]

// Plays once when the block enters the viewport. `x` / `y` set the direction.
export default function Reveal({ children, className, style, delay = 0, y = 32, x = 0, scale = 1, duration = 0.9, as = 'div' }) {
  const M = motion[as]
  return (
    <M
      className={className}
      style={style}
      initial={{ opacity: 0, y, x, scale }}
      whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </M>
  )
}
