import { MotionConfig } from 'framer-motion'
import Nav from './components/Nav'
import Hero from './sections/Hero'
import Presentation from './sections/Presentation'
import Parcours from './sections/Parcours'
import Bento from './sections/Bento'
import PartnersCard from './sections/PartnersCard'
import Advantages from './sections/Advantages'
import PhotoBand from './sections/PhotoBand'
import Team from './sections/Team'
import Faq from './sections/Faq'
import Waitlist from './sections/Waitlist'
import Footer from './sections/Footer'

export default function App() {
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
          <Team />
          <PhotoBand />
          <Faq />
          <Waitlist />
        </main>
        <Footer />
      </div>
    </MotionConfig>
  )
}
