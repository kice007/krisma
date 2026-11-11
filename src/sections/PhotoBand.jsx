import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { EASE } from '../components/Reveal'
import { useLang } from '../i18n'

export default function PhotoBand() {
  const { t } = useLang()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  return (
    <section className="bg-white px-5 lg:px-10 lg:pb-[120px] xl:px-[100px]">
      <motion.div
        ref={ref}
        className="relative mx-auto h-[430px] max-w-[1240px] overflow-hidden rounded-3xl bg-clair lg:h-[640px] lg:rounded-[36px]"
        initial={{ clipPath: 'inset(14% 8% 14% 8% round 36px)' }}
        whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 36px)' }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1.4, ease: EASE }}
      >
        <motion.img
          src="/img/landing/photo.webp"
          alt={t.photoAlt}
          className="absolute -top-[10%] left-0 h-[120%] w-full object-cover object-[38%_center] lg:object-center"
          style={{ y }}
        />
        <span className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-[#11111199]" />
        <div className="absolute bottom-[22px] left-0 flex w-max lg:bottom-[23px]" aria-hidden>
          <div className="marquee flex gap-4 lg:gap-11">
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="font-display text-[62px] font-bold leading-none tracking-[-1.5px] text-white lg:text-[110px] lg:tracking-[-3px]">
                KRISMA
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
