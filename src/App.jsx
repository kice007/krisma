import Nav from './components/Nav'
import Hero from './sections/Hero'
import Pourquoi from './sections/Pourquoi'
import Features from './sections/Features'
import Industries from './sections/Industries'
import Team from './sections/Team'
// import Pricing from './sections/Pricing'
import Cta from './sections/Cta'
import Footer from './sections/Footer'

export default function App() {
  return (
    <div className="min-h-screen w-full overflow-x-clip bg-white">
      <Nav />
      <main>
        <Hero />
        <Pourquoi />
        <Features />
        <Industries />
        <Team />
        {/* <Pricing /> */}
        <Cta />
        <Footer />
      </main>
    </div>
  )
}
