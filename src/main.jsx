import { StrictMode, Suspense, lazy, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './i18n'
import { Loading } from './waitlist/Layout'

// Parcours waitlist et espace membre chargés à la demande : la page d'accueil reste légère.
const Home = lazy(() => import('./waitlist/Home'))
const SignUp = lazy(() => import('./waitlist/SignUp'))
const Questionnaire = lazy(() => import('./waitlist/Questionnaire'))
const Verify = lazy(() => import('./waitlist/Verify'))
const Welcome = lazy(() => import('./waitlist/Welcome'))
const Login = lazy(() => import('./waitlist/Login'))
const Resume = lazy(() => import('./waitlist/Resume'))
const Shell = lazy(() => import('./member/Shell'))
const Dashboard = lazy(() => import('./member/Dashboard'))
const Points = lazy(() => import('./member/Points'))
const Profile = lazy(() => import('./member/Profile'))
const Leaderboard = lazy(() => import('./member/Leaderboard'))
const Rules = lazy(() => import('./member/Rules'))
const MapPage = lazy(() => import('./member/map/MapPage'))
const RequireMember = lazy(() => import('./member/Shell').then((m) => ({ default: m.RequireMember })))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0)
  }, [pathname])
  return null
}

const member = (el) => <RequireMember>{el}</RequireMember>

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
            <Route element={<Shell />}>
              <Route path="/espace" element={member(<Dashboard />)} />
              <Route path="/espace/points" element={member(<Points />)} />
              <Route path="/espace/profil" element={member(<Profile />)} />
              <Route path="/classement" element={<Leaderboard />} />
              <Route path="/reglement" element={<Rules />} />
              <Route path="/carte" element={<MapPage />} />
            </Route>
            <Route path="/confidentialite" element={<Navigate to="/reglement#donnees" replace />} />
            <Route path="/conditions" element={<Navigate to="/reglement" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  </StrictMode>,
)
