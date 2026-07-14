import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowUpRight, ChevronDown } from 'lucide-react'

const TAGLINE = 'La banque de la diaspora africaine.'
const SUB =
  'Compte bancaire européen, transferts entre l’Afrique et l’Europe, visa étudiant,  tout en une application.'

function MobileHero() {
  return (
    <div
      className="bg-cover bg-center lg:hidden"
      style={{ backgroundImage: 'linear-gradient(rgba(66,64,64,0.15),rgba(66,64,64,0.15)), url(/img/hero-bg.png)' }}
    >
      <div className="flex flex-col gap-[22px] px-6 pt-[104px] pb-11">
        <span className="font-display text-[40px] font-extrabold leading-none text-white">Krisma</span>
        <h1 className="font-display text-[30px] font-medium leading-[1.1] text-white">{TAGLINE}</h1>
        <p className="font-body text-[16px] font-medium leading-[1.55] text-white">{SUB}</p>
        <a
          href="#contact"
          className="flex w-fit items-center gap-2 rounded-full bg-base px-[26px] py-[15px] text-[15px] font-semibold text-white hover:-translate-y-0.5"
        >
          Être notifié du lancement
          <ArrowUpRight size={16} />
        </a>
      </div>
      <div className="px-6 pb-10">
        <img src="/img/iphone-mockup.png" alt="Application Krisma" className="h-[402px] w-full rounded-2xl object-cover" />
      </div>
    </div>
  )
}

function DesktopHero() {
  const trackRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })

  // Phone: starts perfectly centered & solid, falls to the bottom and fades away (clipped by the canvas).
  // Finishes disappearing right before the pin releases, so the section holds until the parallax is over.
  const imgY = useTransform(scrollYProgress, [0, 1], [0, 660])
  const imgScale = useTransform(scrollYProgress, [0, 1], [1, 0.78])
  const imgOpacity = useTransform(scrollYProgress, [0.5, 0.98], [1, 0])

  // Text rises from the bottom (clip-reveal, no opacity fade), staggered
  const wmY = useTransform(scrollYProgress, [0.1, 0.55], ['120%', '0%'])
  const tagY = useTransform(scrollYProgress, [0.22, 0.68], ['120%', '0%'])
  const rightY = useTransform(scrollYProgress, [0.34, 0.82], ['120%', '0%'])

  // Arrow hint fades out immediately on scroll
  const hintOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0])

  return (
    <div ref={trackRef} className="relative hidden h-[260vh] lg:block">
      <div
        className="sticky top-0 h-screen overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'linear-gradient(rgba(66,64,64,0.15),rgba(66,64,64,0.15)), url(/img/hero-bg.png)' }}
      >
        <div className="mx-auto h-full max-w-[1440px]">
          <div className="relative h-full w-full">
            {/* Giant wordmark */}
            <div className="pointer-events-none absolute left-1/2 top-[14%] -translate-x-1/2 overflow-hidden">
              <motion.span
                style={{ y: wmY }}
                className="block select-none font-display text-[210px] font-bold leading-none tracking-[-4px] text-white"
              >
                Krisma
              </motion.span>
            </div>

            {/* Phone mockup — centered, falls away */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.img
                src="/img/iphone-mockup.png"
                alt="Application Krisma"
                style={{ y: imgY, scale: imgScale, opacity: imgOpacity }}
                className="w-[680px] rounded-2xl object-contain drop-shadow-2xl"
              />
            </div>

            {/* Tagline (bottom-left) */}
            <div className="absolute bottom-[200px] left-12 w-[380px] overflow-hidden pb-2">
              <motion.h1
                style={{ y: tagY }}
                className="font-display text-[44px] font-semibold leading-[1.1] text-white"
              >
                {TAGLINE}
              </motion.h1>
            </div>

            {/* Sub + CTA (right) */}
            <div className="absolute right-16 top-[620px] w-[380px] overflow-hidden pb-2">
              <motion.div style={{ y: rightY }} className="flex flex-col gap-8">
                <p className="font-body text-[20px] font-medium leading-[1.55] text-white">{SUB}</p>
                <a
                  href="#contact"
                  className="flex w-fit items-center gap-2 rounded-full bg-base px-[26px] py-[15px] text-[15px] font-semibold text-white transition-transform duration-300 hover:-translate-y-1"
                >
                  Être notifié du lancement
                  <ArrowUpRight size={16} />
                </a>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Arrow scroll hint */}
        <motion.div
          style={{ opacity: hintOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={30} strokeWidth={2.2} />
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <div id="hero">
      <MobileHero />
      <DesktopHero />
    </div>
  )
}
