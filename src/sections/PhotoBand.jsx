import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useScroll, useTransform } from 'framer-motion'
import { EASE } from '../components/Reveal'
import { useLang } from '../i18n'

// Carrousel de portraits (diaspora africaine et maghrébine) : fondu toutes les 5 s.
// `pos` = cadrage sur mobile, où la photo est recadrée en hauteur.
const SLIDES = [
  { src: '/img/landing/photo.webp', pos: '38%' },
  { src: '/img/landing/photo-2.webp', pos: '24%' },
  { src: '/img/landing/photo-3.webp', pos: '70%' },
  { src: '/img/landing/photo-4.webp', pos: '22%' },
  { src: '/img/landing/photo-5.webp', pos: '72%' },
]

export default function PhotoBand() {
  const { t } = useLang()
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '0px 0px -10% 0px' })
  const [i, setI] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%'])

  useEffect(() => {
    if (!inView) return
    const id = setInterval(() => setI((n) => (n + 1) % SLIDES.length), 5000)
    return () => clearInterval(id)
  }, [inView])

  // Précharge les photos suivantes une fois la section visible.
  useEffect(() => {
    if (inView) SLIDES.forEach((s) => (new Image().src = s.src))
  }, [inView])

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
        <motion.div className="absolute -top-[10%] left-0 h-[120%] w-full" style={{ y }}>
          <AnimatePresence initial={false}>
            <motion.img
              key={SLIDES[i].src}
              src={SLIDES[i].src}
              alt={t.photoAlt}
              className="absolute inset-0 h-full w-full object-cover lg:!object-center"
              style={{ objectPosition: `${SLIDES[i].pos} center` }}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ opacity: { duration: 1.1, ease: 'easeInOut' }, scale: { duration: 5.5, ease: 'linear' } }}
            />
          </AnimatePresence>
        </motion.div>
        <span className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-[#11111199]" />
        <div className="absolute bottom-[22px] left-0 flex w-max lg:bottom-[23px]" aria-hidden>
          <div className="marquee flex gap-4 lg:gap-11">
            {Array.from({ length: 9 }).map((_, k) => (
              <span key={k} className="font-display text-[62px] font-bold leading-none tracking-[-1.5px] text-white lg:text-[110px] lg:tracking-[-3px]">
                KRISMA
              </span>
            ))}
          </div>
        </div>
        <div className="absolute right-5 top-5 flex gap-1.5 lg:right-8 lg:top-8">
          {SLIDES.map((s, k) => (
            <button
              key={s.src}
              type="button"
              aria-label={`${k + 1} / ${SLIDES.length}`}
              aria-current={k === i ? 'true' : undefined}
              onClick={() => setI(k)}
              className={`h-1.5 cursor-pointer rounded-full transition-all duration-500 ${k === i ? 'w-6 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80'}`}
            />
          ))}
        </div>
      </motion.div>
    </section>
  )
}
