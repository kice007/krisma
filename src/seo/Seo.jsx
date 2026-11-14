import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLang } from '../i18n'
import { SITE, pageFor } from './pages'

function meta(selector, attrs) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement(selector.startsWith('link') ? 'link' : 'meta')
    document.head.appendChild(el)
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
}

// Titre de l'onglet, description, aperçu de partage, adresse canonique et
// indexation, mis à jour à chaque page et à chaque changement de langue.
export default function Seo() {
  const { pathname } = useLocation()
  const { lang } = useLang()
  useEffect(() => {
    const page = pageFor(pathname)
    const t = page[lang] || page.fr
    const url = SITE.url + (page.index ? (page.path === '/' ? '/' : page.path) : pathname)
    document.title = t.title
    document.documentElement.lang = lang
    meta('meta[name="description"]', { name: 'description', content: t.description })
    meta('meta[name="robots"]', { name: 'robots', content: page.index ? 'index, follow, max-image-preview:large' : 'noindex, nofollow' })
    meta('link[rel="canonical"]', { rel: 'canonical', href: url })
    meta('meta[property="og:title"]', { property: 'og:title', content: t.title })
    meta('meta[property="og:description"]', { property: 'og:description', content: t.description })
    meta('meta[property="og:url"]', { property: 'og:url', content: url })
    meta('meta[property="og:image"]', { property: 'og:image', content: SITE.url + page.image })
    meta('meta[property="og:locale"]', { property: 'og:locale', content: SITE.locale[lang] })
    meta('meta[name="twitter:title"]', { name: 'twitter:title', content: t.title })
    meta('meta[name="twitter:description"]', { name: 'twitter:description', content: t.description })
    meta('meta[name="twitter:image"]', { name: 'twitter:image', content: SITE.url + page.image })
  }, [pathname, lang])
  return null
}
