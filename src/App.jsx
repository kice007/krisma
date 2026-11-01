import { useState } from 'react'
import { MotionConfig } from 'framer-motion'
import Nav from './components/Nav'
import Hero from './sections/Hero'
import Presentation from './sections/Presentation'
import Parcours from './sections/Parcours'
import Bento from './sections/Bento'
import PartnersCard from './sections/PartnersCard'
import Advantages from './sections/Advantages'
import Countries from './sections/Countries'
import PhotoBand from './sections/PhotoBand'
import Status from './sections/Status'
import Team from './sections/Team'
import Faq from './sections/Faq'
import Waitlist from './sections/Waitlist'
import Footer from './sections/Footer'

export default function App() {
  const [vote, setVote] = useState(null)
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen w-full overflow-x-clip bg-white">
        <Nav />
        <main>
          <Hero />
          <Presentation />
          <Parcours />
          <Bento />
          <PartnersCard />
          <Advantages />
          <Countries vote={vote} setVote={setVote} />
          <PhotoBand />
          <Status />
          <Team />
          <Faq />
          <Waitlist vote={vote} />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  )
}
