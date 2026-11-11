import { StrictMode, Suspense, lazy, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './i18n'
import { Loading } from './waitlist/Layout'

// Parcours waitlist chargé à la demande : la page d'accueil reste légère.
const Home = lazy(() => import('./waitlist/Home'))
const SignUp = lazy(() => import('./waitlist/SignUp'))
const Questionnaire = lazy(() => import('./waitlist/Questionnaire'))
const Verify = lazy(() => import('./waitlist/Verify'))
const Welcome = lazy(() => import('./waitlist/Welcome'))
const Login = lazy(() => import('./waitlist/Login'))
const Resume = lazy(() => import('./waitlist/Resume').then((m) => ({ default: m.Resume })))
const Member = lazy(() => import('./waitlist/Resume').then((m) => ({ default: m.MemberPlaceholder })))
const MapSoon = lazy(() => import('./waitlist/Resume').then((m) => ({ default: m.MapSoon })))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0)
  }, [pathname])
  return null
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/waitlist" element={<Home />} />
            <Route path="/waitlist/inscription" element={<SignUp />} />
            <Route path="/waitlist/questionnaire/:step" element={<Questionnaire />} />
            <Route path="/waitlist/verification" element={<Verify />} />
            <Route path="/waitlist/bienvenue" element={<Welcome />} />
            <Route path="/waitlist/reprise" element={<Resume />} />
            <Route path="/connexion" element={<Login />} />
            <Route path="/espace" element={<Member />} />
            <Route path="/carte" element={<MapSoon />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)
