import { createContext, useContext, useEffect, useState } from 'react'

export const translations = {
  fr: {
    nav: {
      links: [
        { label: 'Fonctionnalités', href: '#features' },
        { label: 'Services', href: '#industries' },
        { label: 'Tarifs', href: '#tarifs' },
        { label: 'Équipe', href: '#equipe' },
        { label: 'Contact', href: '#contact' },
      ],
      notify: 'Être notifié',
      notifyLaunch: 'Être notifié du lancement',
    },
    hero: {
      tagline: 'La banque de la diaspora africaine.',
      sub: 'Compte bancaire européen, transferts entre l’Afrique et l’Europe, comptes bloqués, tout en une application.',
      cta: 'Être notifié du lancement',
      appAlt: 'Application Krisma',
    },
    pourquoi: {
      badge: 'Pourquoi Krisma',
      heading: 'Conçue par la diaspora, pour la diaspora.',
      aiTag: 'IA',
      aiText: 'Un assistant multilingue à votre service',
      paragraph:
        'Les banques traditionnelles ne comprennent pas votre réalité. Krisma oui. Frais transparents, transferts instantanés, et un assistant qui parle votre langue.',
      checks: [
        'Taux de conversion affichés avant chaque envoi',
        'Carte Mastercard acceptée partout en Europe',
        'Construisez votre score de crédit dès votre arrivée en Europe',
        'Accédez à des prêts adaptés à votre situation',
      ],
      more: 'En savoir plus',
    },
    features: {
      badge: 'Nos fonctionnalités',
      heading: 'Une banque conçue pour vous.',
      visaTitle: 'Visa étudiant',
      visaDesc:
        'Compte bloqué en 24h depuis l’Afrique. Attestation officielle. Vous n’avez pas le montant complet ? Krisma Visa Flex complète le reste.',
      compteTitle: 'Compte bancaire européen',
      compteDesc:
        'IBAN européen, carte Mastercard / Visa virtuelle et physique. Ouvrez votre compte depuis l’Afrique avant votre départ',
      transfersTitle: "Transferts entre l'Afrique et l'Europe",
      transfersDesc:
        'Envoyez et recevez de l’argent dans les deux sens, instantanément et aux meilleurs taux',
      garantieTitle: 'Garantie locative',
      garantieDesc: 'Trouvez votre logement en France sans garant sur place.',
      assistantTitle: 'Assistant personnel IA multilingue',
      assistantDesc: 'Disponible 24h/24',
    },
    industries: {
      badge: 'Profils',
      heading: 'Des services pensés pour chaque profil',
      paragraph:
        'Que vous étudiez à l’étranger, souteniez votre famille ou lanciez votre activité, Krisma s’adapte à votre réalité.',
      cta: 'Être notifié',
      studentsTitle: 'Pour les étudiants',
      studentsDesc:
        'Ouvrez votre compte depuis l’Afrique, obtenez votre visa étudiant avec compte bloqué et trouvez un logement sans garant sur place.',
      familiesTitle: 'Pour les familles',
      familiesDesc:
        "Restez connectés à ceux que vous aimez. Envoyez et recevez de l'argent instantanément dans les deux sens.",
      diasporaTitle: 'Pour la diaspora',
      diasporaDesc:
        "La banque qui vous accompagne de votre premier jour en Europe jusqu'à votre réussite.",
    },
    team: {
      badge: 'Notre équipe',
      heading: 'Une équipe multicontinentale.',
      paragraph:
        'Fondée par des membres de la diaspora africaine, Krisma est opérée depuis Paris et Abidjan.',
      roles: ['CEO & CO-FONDATEUR', 'CTO & CO-FONDATEUR', 'LEAD MOBILE'],
      seeAll: 'Voir toute l’équipe',
    },
    cta: {
      youSend: 'Vous envoyez',
      theyReceive: 'Ils reçoivent',
      rate: 'Taux du jour · 1 € = 655,96 F',
      confirm: 'Confirmer l’envoi',
      spending: 'Dépenses cette semaine',
      remaining: '124 € restants à dépenser',
      rows: [
        { n: 'Envoi à Maman', d: 'Abidjan · Orange Money', a: '- 120,90 €' },
        { n: 'Café Starbucks', d: 'Yuzu Cold Brew', a: '- 4,20 €' },
      ],
      heading: 'Être notifié du lancement.',
      paragraph:
        'Laissez votre email pour être informé du lancement. Vos données ne seront jamais partagées ni revendues.',
      placeholder: 'Entrez votre email…',
      send: 'Envoyer',
      soon: 'Bientôt sur',
    },
    footer: {
      heading: 'La banque de la diaspora africaine',
      paragraph:
        "La banque qui vous accompagne de votre premier jour en Europe jusqu'à votre réussite",
      cols: [
        { h: 'Produit', labels: ['Compte européen', 'Transferts', 'Visa étudiant', 'Garantie locative'] },
        { h: 'Liens', labels: ['Équipe', 'Tarifs', 'Contact'] },
        { h: 'Légal', labels: ['CGU', 'Confidentialité', 'Cookies', 'Mentions légales'] },
      ],
      copyright: '© 2026 Krisma — Tous droits réservés.',
    },
  },

  en: {
    nav: {
      links: [
        { label: 'Features', href: '#features' },
        { label: 'Services', href: '#industries' },
        { label: 'Pricing', href: '#tarifs' },
        { label: 'Team', href: '#equipe' },
        { label: 'Contact', href: '#contact' },
      ],
      notify: 'Get notified',
      notifyLaunch: 'Get notified at launch',
    },
    hero: {
      tagline: 'The bank for the African diaspora.',
      sub: 'A European bank account, transfers between Africa and Europe, blocked accounts — all in one app.',
      cta: 'Get notified at launch',
      appAlt: 'Krisma app',
    },
    pourquoi: {
      badge: 'Why Krisma',
      heading: 'Built by the diaspora, for the diaspora.',
      aiTag: 'AI',
      aiText: 'A multilingual assistant at your service',
      paragraph:
        'Traditional banks don’t understand your reality. Krisma does. Transparent fees, instant transfers, and an assistant that speaks your language.',
      checks: [
        'Conversion rates shown before every transfer',
        'Mastercard accepted everywhere in Europe',
        'Build your credit score from the day you arrive in Europe',
        'Access loans tailored to your situation',
      ],
      more: 'Learn more',
    },
    features: {
      badge: 'Our features',
      heading: 'A bank built for you.',
      visaTitle: 'Student visa',
      visaDesc:
        'Blocked account in 24h from Africa. Official certificate. Don’t have the full amount? Krisma Visa Flex covers the rest.',
      compteTitle: 'European bank account',
      compteDesc:
        'European IBAN, virtual and physical Mastercard / Visa card. Open your account from Africa before you leave.',
      transfersTitle: 'Transfers between Africa and Europe',
      transfersDesc:
        'Send and receive money both ways, instantly and at the best rates',
      garantieTitle: 'Rental guarantee',
      garantieDesc: 'Find housing in France without a local guarantor.',
      assistantTitle: 'Multilingual AI personal assistant',
      assistantDesc: 'Available 24/7',
    },
    industries: {
      badge: 'Profiles',
      heading: 'Services designed for every profile',
      paragraph:
        'Whether you’re studying abroad, supporting your family or launching your business, Krisma adapts to your reality.',
      cta: 'Get notified',
      studentsTitle: 'For students',
      studentsDesc:
        'Open your account from Africa, get your student visa with a blocked account, and find housing without a local guarantor.',
      familiesTitle: 'For families',
      familiesDesc:
        'Stay connected to those you love. Send and receive money instantly, both ways.',
      diasporaTitle: 'For the diaspora',
      diasporaDesc:
        'The bank that supports you from your first day in Europe to your success.',
    },
    team: {
      badge: 'Our team',
      heading: 'A multicontinental team.',
      paragraph:
        'Founded by members of the African diaspora, Krisma is operated from Paris and Abidjan.',
      roles: ['CEO & CO-FOUNDER', 'CTO & CO-FOUNDER', 'MOBILE LEAD'],
      seeAll: 'Meet the whole team',
    },
    cta: {
      youSend: 'You send',
      theyReceive: 'They receive',
      rate: 'Today’s rate · 1 € = 655.96 F',
      confirm: 'Confirm transfer',
      spending: 'Spending this week',
      remaining: '124 € left to spend',
      rows: [
        { n: 'Sent to Mum', d: 'Abidjan · Orange Money', a: '- 120.90 €' },
        { n: 'Starbucks coffee', d: 'Yuzu Cold Brew', a: '- 4.20 €' },
      ],
      heading: 'Get notified at launch.',
      paragraph:
        'Leave your email to hear when we launch. Your data will never be shared or sold.',
      placeholder: 'Enter your email…',
      send: 'Send',
      soon: 'Coming soon to',
    },
    footer: {
      heading: 'The bank for the African diaspora',
      paragraph:
        'The bank that supports you from your first day in Europe to your success',
      cols: [
        { h: 'Product', labels: ['European account', 'Transfers', 'Student visa', 'Rental guarantee'] },
        { h: 'Links', labels: ['Team', 'Pricing', 'Contact'] },
        { h: 'Legal', labels: ['Terms', 'Privacy', 'Cookies', 'Legal notice'] },
      ],
      copyright: '© 2026 Krisma — All rights reserved.',
    },
  },
}

const LangContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'fr'
    return localStorage.getItem('krisma-lang') || 'fr'
  })

  useEffect(() => {
    localStorage.setItem('krisma-lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  const toggle = () => setLang((l) => (l === 'fr' ? 'en' : 'fr'))

  return (
    <LangContext.Provider value={{ lang, setLang, toggle, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
