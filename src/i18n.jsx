import { createContext, useContext, useEffect, useState } from 'react'

export const translations = {
  fr: {
    meta: { title: 'KRISMA — La finance sans frontières' },
    nav: {
      links: [
        { label: 'Accueil', href: '#hero' },
        { label: 'Fonctionnalités', href: '#fonctionnalites' },
        { label: 'Pour qui ?', href: '#parcours' },
        { label: 'Partenaires', href: '#partenaires' },
        { label: 'Équipe', href: '#equipe' },
        { label: 'FAQ', href: '#faq' },
      ],
      cta: "Rejoindre la liste d'attente",
      open: 'Ouvrir le menu',
      close: 'Fermer le menu',
      language: 'Langue',
    },
    hero: {
      title: ['Plus loin,', 'toujours ensemble.'],
      sub: "Le compte et la carte pour vivre en Europe et rester connecté à l'Afrique.",
      perks: ['Simple au quotidien', "Connecté à l'Afrique", 'Pensé pour votre avenir'],
    },
    presentation: {
      lead: "Un compte européen, une carte pour vos dépenses, des transferts entre l'Europe et l'Afrique et des avantages chez nos partenaires.",
      rest: 'KRISMA propose une nouvelle manière de gérer votre argent, où que la vie vous mène.',
    },
    parcours: {
      title: ['Une solution pour chaque étape', 'de votre parcours'],
      sub: 'KRISMA commence avec les étudiants et la diaspora africaine, et ambitionne de servir à terme les voyageurs.',
      here: 'Ici',
      there: 'Là-bas',
      steps: [
        { n: '01', title: 'Vous arrivez en Europe', text: 'Préparez votre nouvelle vie avec une solution financière conçue pour accompagner votre installation.', tag: 'Étudiants internationaux', short: 'Étudiants internationaux' },
        { n: '02', title: 'Vous vivez entre deux continents', text: "Gérez votre quotidien en Europe tout en restant connecté financièrement à l'Afrique.", tag: 'Diaspora africaine', short: 'Diaspora africaine' },
        { n: '03', title: 'Vous voyagez en Europe', text: 'À terme, KRISMA pourrait proposer des solutions adaptées aux séjours temporaires.', tag: 'Voyageurs et touristes (à venir)', short: 'Voyageurs (à venir)' },
      ],
    },
    bento: {
      title: ['Un compte, une carte, des transferts', 'et des avantages'],
      account: {
        title: 'Un compte européen',
        text: 'Un IBAN et une carte pour gérer votre quotidien.',
        balance: 'Solde total',
        deposit: 'Déposer',
        send: 'Envoyer',
        spending: 'Dépenses',
        income: 'Revenus',
        month: 'Ce mois-ci',
      },
      partners: { title: 'KRISMA Partners', text: 'Du cashback chez les commerçants partenaires.' },
      offer: {
        title: 'Offre envisagée',
        badge: 'En étude',
        price: '4,99 €',
        per: '/ mois',
        free: '3 premiers mois gratuits envisagés',
        note: "Tarif indicatif, susceptible d'évoluer avant le lancement. Les éventuels frais de transfert seront présentés séparément.",
      },
      transfer: {
        title: 'Transferts internationaux',
        text: "Envoyez de l'argent vers l'Afrique, simplement.",
        send: 'Vous envoyez',
        receive: 'Le bénéficiaire reçoit',
        fee: 'Frais 1,99 €',
        rate: '1 € = 655,00 XOF',
        cta: 'Continuer',
      },
      community: { title: 'Communauté', text: 'Des solutions pensées pour rester connecté à vos proches.' },
    },
    partners: {
      eyebrow: 'KRISMA Partners',
      title: ['Votre carte pourrait', 'vous rapporter plus.'],
      text: 'Restaurants, commerces, services du quotidien… KRISMA ambitionne de développer un réseau de partenaires pour récompenser vos achats éligibles.',
      cta: 'Devenir partenaire',
    },
    advantages: {
      eyebrow: 'KRISMA Partners',
      title: ['Un réseau de partenaires', 'pour récompenser vos achats'],
      items: [
        { title: 'Cashback', text: 'chez nos partenaires' },
        { title: 'Des avantages', text: 'sur vos achats du quotidien' },
        { title: 'Un réseau de commerçants', text: "à travers l'Europe" },
        { title: 'Des offres exclusives', text: 'pour la communauté KRISMA' },
      ],
    },
    photoAlt: 'Un jeune homme africain sourit dans une rue parisienne',
    team: {
      title: 'Le premier cercle',
      text: 'Fondée par des membres de la diaspora africaine',
      roles: ['CEO & co-fondateur', 'CTO & co-fondateur', 'Lead mobile'],
    },
    faq: {
      title: 'Questions fréquentes',
      all: 'Voir toutes les questions',
      items: [
        { q: 'Quand KRISMA sera-t-il disponible ?', a: "KRISMA est en préparation et les services présentés ne sont pas encore disponibles. Rejoignez la liste d'attente pour être prévenu du lancement." },
        { q: 'Comment pourrai-je ouvrir un compte ?', a: "Les modalités d'ouverture seront précisées avant le lancement. Les inscrits à la liste d'attente seront informés en premier." },
        { q: 'Quels pays seront couverts au lancement ?', a: "La liste n'est pas encore arrêtée. Rejoignez la liste d'attente pour être informé en premier." },
        { q: 'KRISMA est-elle une banque ?', a: 'KRISMA est une fintech en phase de développement. Nous avançons avec des partenaires réglementés pour proposer une solution fiable, sécurisée et conforme.' },
        { q: 'Combien coûtera KRISMA ?', a: "L'offre envisagée est de 4,99 € par mois, avec 3 premiers mois gratuits. Ce tarif est indicatif et susceptible d'évoluer avant le lancement." },
      ],
    },
    waitlist: {
      title: 'Soyez parmi les premiers.',
      text: "Rejoignez la liste d'attente et participez à la construction de votre future expérience financière.",
      placeholder: 'Votre adresse e-mail',
      cta: "Rejoindre la liste d'attente",
      consent: 'Je souhaite également recevoir des actualités sur KRISMA Partners (commerçants).',
      success: 'Merci ! Votre inscription est bien prise en compte.',
    },
    footer: {
      tagline: ['Plus loin.', 'Toujours ensemble.'],
      columns: [
        { h: 'Produit', links: ['Fonctionnalités', 'Pour qui ?', 'KRISMA Partners', 'Tarifs (en étude)'], href: ['#fonctionnalites', '#parcours', '#partenaires', '#fonctionnalites'] },
        { h: 'Entreprise', links: ['Carrières', 'Investisseurs', 'Devenir partenaire'], href: ['#', '#', '#partenaires'] },
        { h: 'Ressources', links: ['FAQ', "Centre d'aide", 'Blog (à venir)', 'Contact'], href: ['#faq', '#', '#', '#contact'] },
      ],
      legalTitle: 'Légal',
      legal: ['Confidentialité', "Conditions d'utilisation", 'Mentions légales'],
      copyright: '© 2026 KRISMA. Tous droits réservés.',
    },
  },

  en: {
    meta: { title: 'KRISMA — Finance without borders' },
    nav: {
      links: [
        { label: 'Home', href: '#hero' },
        { label: 'Features', href: '#fonctionnalites' },
        { label: "Who it's for", href: '#parcours' },
        { label: 'Partners', href: '#partenaires' },
        { label: 'Team', href: '#equipe' },
        { label: 'FAQ', href: '#faq' },
      ],
      cta: 'Join the waitlist',
      open: 'Open menu',
      close: 'Close menu',
      language: 'Language',
    },
    hero: {
      title: ['Further,', 'together!'],
      sub: 'The account and card to live in Europe and stay connected to Africa.',
      perks: ['Simple every day', 'Connected to Africa', 'Built for your future'],
    },
    presentation: {
      lead: 'A European account, a card for your spending, transfers between Europe and Africa, and rewards with our partners.',
      rest: 'KRISMA is building a new way to manage your money, wherever life takes you.',
    },
    parcours: {
      title: ['A solution for every step', 'of your journey'],
      sub: 'KRISMA starts with students and the African diaspora, and aims to serve travellers in time.',
      here: 'Here',
      there: 'There',
      steps: [
        { n: '01', title: "You're arriving in Europe", text: 'Prepare your new life with a financial solution designed to support your move.', tag: 'International students', short: 'International students' },
        { n: '02', title: 'You live between two continents', text: 'Manage your daily life in Europe while staying financially connected to Africa.', tag: 'African diaspora', short: 'African diaspora' },
        { n: '03', title: "You're travelling in Europe", text: 'In time, KRISMA could offer solutions suited to temporary stays.', tag: 'Travellers and tourists (coming soon)', short: 'Travellers (coming soon)' },
      ],
    },
    bento: {
      title: ['An account, a card, transfers', 'and rewards'],
      account: {
        title: 'A European account',
        text: 'An IBAN and a card to manage your everyday life.',
        balance: 'Total balance',
        deposit: 'Deposit',
        send: 'Send',
        spending: 'Spending',
        income: 'Income',
        month: 'This month',
      },
      partners: { title: 'KRISMA Partners', text: 'Cashback at partner merchants.' },
      offer: {
        title: 'Planned offer',
        badge: 'Under review',
        price: '€4.99',
        per: '/ month',
        free: 'First 3 months free planned',
        note: 'Indicative price, subject to change before launch. Any transfer fees will be shown separately.',
      },
      transfer: {
        title: 'International transfers',
        text: 'Send money to Africa, simply.',
        send: 'You send',
        receive: 'Recipient gets',
        fee: 'Fee €1.99',
        rate: '€1 = 655.00 XOF',
        cta: 'Continue',
      },
      community: { title: 'Community', text: 'Solutions designed to keep you connected to your loved ones.' },
    },
    partners: {
      eyebrow: 'KRISMA Partners',
      title: ['Your card could', 'earn you more.'],
      text: 'Restaurants, shops, everyday services… KRISMA aims to build a partner network that rewards your eligible purchases.',
      cta: 'Become a partner',
    },
    advantages: {
      eyebrow: 'KRISMA Partners',
      title: ['A partner network', 'that rewards your purchases'],
      items: [
        { title: 'Cashback', text: 'with our partners' },
        { title: 'Rewards', text: 'on your everyday purchases' },
        { title: 'A merchant network', text: 'across Europe' },
        { title: 'Exclusive offers', text: 'for the KRISMA community' },
      ],
    },

    photoAlt: 'A young African man smiling on a Paris street',
    team: {
      title: 'The inner circle',
      text: 'Founded by members of the African diaspora',
      roles: ['CEO & co-founder', 'CTO & co-founder', 'Mobile lead'],
    },
    faq: {
      title: 'Frequently asked questions',
      all: 'See all questions',
      items: [
        { q: 'When will KRISMA be available?', a: 'KRISMA is in preparation and the services shown are not available yet. Join the waitlist to hear about the launch.' },
        { q: 'How will I open an account?', a: 'Account opening details will be shared before launch. People on the waitlist will be told first.' },
        { q: 'Which countries will be covered at launch?', a: "The list isn't final yet. Join the waitlist to be the first to know." },
        { q: 'Is KRISMA a bank?', a: 'KRISMA is a fintech in development. We are working with regulated partners to offer a reliable, secure and compliant solution.' },
        { q: 'How much will KRISMA cost?', a: 'The planned offer is €4.99 per month, with the first 3 months free. This price is indicative and may change before launch.' },
      ],
    },
    waitlist: {
      title: 'Be among the first.',
      text: 'Join the waitlist and help shape your future financial experience.',
      placeholder: 'Your email address',
      cta: 'Join the waitlist',
      consent: 'I would also like to receive news about KRISMA Partners (merchants).',
      success: 'Thank you! Your sign-up has been received.',
    },
    footer: {
      tagline: ['Further.', 'Always together.'],
      columns: [
        { h: 'Product', links: ['Features', "Who it's for", 'KRISMA Partners', 'Pricing (under review)'], href: ['#fonctionnalites', '#parcours', '#partenaires', '#fonctionnalites'] },
        { h: 'Company', links: ['Careers', 'Investors', 'Become a partner'], href: ['#', '#', '#partenaires'] },
        { h: 'Resources', links: ['FAQ', 'Help centre', 'Blog (coming soon)', 'Contact'], href: ['#faq', '#', '#', '#contact'] },
      ],
      legalTitle: 'Legal',
      legal: ['Privacy', 'Terms of use', 'Legal notice'],
      copyright: '© 2026 KRISMA. All rights reserved.',
    },
  },
}

const LangContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('krisma-lang') : null
    return saved === 'en' ? 'en' : 'fr'
  })

  useEffect(() => {
    localStorage.setItem('krisma-lang', lang)
    document.documentElement.lang = lang
    document.title = translations[lang].meta.title
  }, [lang])

  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used within LanguageProvider')
  return ctx
}
