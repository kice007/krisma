import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loading } from './Layout'
import { PATHS, cleanUrl, linkError, resumePath, waitForSession } from './flow'

// Arrivée du lien de connexion : renvoie à la bonne étape selon l'état de l'inscription.
export default function Resume() {
  const navigate = useNavigate()
  useEffect(() => {
    const err = linkError()
    waitForSession().then(async (session) => {
      cleanUrl()
      if (!session) return navigate(err ? `${PATHS.login}?expired=1` : PATHS.login, { replace: true })
      navigate(await resumePath(), { replace: true })
    })
  }, [navigate])
  return <Loading />
}
