// Mentions légales et politique de confidentialité (FR / EN).
// Source : Krisma-prototype/KRISMA_Mentions_legales_Confidentialite.md (client),
// complété avec les données réellement collectées par le site (voir donnees-collectees.md).
// Blocs : 'p' paragraphe, 'ul' liste, 'table' tableau [en-têtes, lignes], 'dl' liste titre / texte.

const UPDATED = { fr: '17 novembre 2026', en: '17 November 2026' }
const EMAIL = 'contact@krisma.io'

const fr = {
  updated: `Dernière mise à jour : ${UPDATED.fr}`,
  toc: 'Sur cette page',
  contact: 'Une question ?',
  contactText: `Écris-nous à ${EMAIL}.`,
  other: { mentions: 'Mentions légales', privacy: 'Politique de confidentialité', rules: 'Règles de la campagne' },
  mentions: {
    title: 'Mentions légales',
    intro: 'Conformément à l’article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN), voici les informations relatives au site krisma.io.',
    sections: [
      {
        id: 'editeur',
        title: 'Éditeur du site',
        blocks: [
          ['p', 'KRISMA, société par actions simplifiée unipersonnelle (SASU) au capital de 100 €.'],
          ['ul', ['Siège social : 47 rue Vivienne, 75002 Paris, France', 'Immatriculée au RCS de Paris sous le numéro 109 830 299', `Contact : ${EMAIL}`]],
        ],
      },
      { id: 'publication', title: 'Directeur de la publication', blocks: [['p', 'Christian EHOUMAN, Président de KRISMA.']] },
      {
        id: 'hebergeur',
        title: 'Hébergement',
        blocks: [
          ['dl', [
            ['Site', 'Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis — vercel.com'],
            ['Données', 'Supabase Inc., base de données hébergée dans l’Union européenne (Irlande) — supabase.com'],
          ]],
        ],
      },
      {
        id: 'statut',
        title: 'Statut de KRISMA',
        blocks: [
          ['p', 'KRISMA est une société en cours de développement. Elle n’est ni un établissement de crédit, ni un établissement de paiement, ni un établissement de monnaie électronique. Aucun service financier n’est proposé à ce jour sur ce site. Les services décrits seront fournis, à leur lancement, par des partenaires agréés, dont l’identité et le statut réglementaire seront alors précisés.'],
          ['p', 'Les prix et fonctionnalités présentés sur le site sont indicatifs et peuvent évoluer avant le lancement.'],
        ],
      },
      {
        id: 'propriete',
        title: 'Propriété intellectuelle',
        blocks: [['p', 'La marque KRISMA, le logo, les textes, visuels et éléments graphiques de ce site sont la propriété de KRISMA. Toute reproduction ou utilisation sans autorisation écrite préalable est interdite.']],
      },
      { id: 'contact', title: 'Contact', blocks: [['p', `Pour toute question sur le site : ${EMAIL}.`]] },
    ],
  },
  privacy: {
    title: 'Politique de confidentialité',
    intro: 'KRISMA collecte uniquement les données nécessaires pour gérer sa liste d’attente et vous informer du lancement. Elle ne les vend pas et ne les cède à aucun tiers à des fins commerciales.',
    sections: [
      {
        id: 'responsable',
        title: 'Responsable du traitement',
        blocks: [['p', `KRISMA SASU, 47 rue Vivienne, 75002 Paris — RCS Paris 109 830 299 — ${EMAIL}`]],
      },
      {
        id: 'donnees',
        title: 'Données collectées',
        blocks: [
          ['p', 'Lors de votre inscription à la liste d’attente, nous collectons :'],
          ['dl', [
            ['Identité et accès', 'prénom, nom, adresse e-mail, mot de passe (stocké sous forme hachée, jamais lisible par KRISMA).'],
            ['Profil', 'ville de résidence (avec les coordonnées géographiques de la ville, pas votre adresse), pays d’origine, situation actuelle, langue du site.'],
            ['Vos réponses au questionnaire', 'fréquence d’envoi et de réception d’argent entre l’Europe et l’Afrique et pays concernés, fréquence d’achat et budget mensuel dans les commerces de proximité, intérêt pour les transferts instantanés, le cashback et les autres services KRISMA, avis sur le prix envisagé et usage prévu.'],
            ['Consentements', 'acceptation du règlement et de cette politique, accord ou non pour recevoir les actualités, avec leur date.'],
            ['Donnée technique', 'adresse IP au moment de l’inscription.'],
          ]],
          ['p', 'Pendant la campagne, nous enregistrons aussi :'],
          ['dl', [
            ['Parrainage', 'votre code de parrainage et, si vous êtes arrivé·e par le lien d’un proche, l’identité de votre parrain.'],
            ['Points et classement', 'l’historique de vos points et votre rang.'],
            ['KRISMA Map', 'les commerces que vous proposez (nom, catégorie, adresse, position) et vos votes.'],
            ['Chat du site', 'les questions que vous posez à l’équipe et ses réponses, la page d’où vous écrivez, et l’adresse IP d’envoi (pour limiter les abus). Si vous n’êtes pas inscrit·e, vous pouvez laisser une adresse e-mail facultative : elle sert uniquement à vous envoyer la réponse.'],
          ]],
        ],
      },
      {
        id: 'public',
        title: 'Données visibles publiquement',
        blocks: [
          ['ul', [
            'Dans le classement : votre prénom suivi de l’initiale de votre nom (par exemple « Awa K. »), votre ville et vos points.',
            'Sur la page de la liste d’attente : le prénom et l’initiale du nom des derniers inscrits, sans la ville.',
            'Sur KRISMA Map : les commerces proposés, avec le prénom et l’initiale du nom de la personne qui les a proposés.',
          ]],
          ['p', 'Votre nom complet, votre adresse e-mail et vos réponses au questionnaire ne sont jamais publics.'],
        ],
      },
      {
        id: 'finalites',
        title: 'Finalités et base légale',
        blocks: [
          ['table', [['Finalité', 'Base légale'], [
            ['Gérer votre inscription et votre accès à la liste d’attente', 'Votre consentement'],
            ['Faire fonctionner la campagne : points, classement, parrainage, KRISMA Map', 'Exécution du règlement de la campagne que vous avez accepté'],
            ['Vous informer du lancement et de l’avancement de KRISMA', 'Votre consentement'],
            ['Étudier vos réponses au questionnaire pour concevoir l’offre (services, prix, commerces partenaires)', 'Votre consentement'],
            ['Analyser de façon agrégée les inscriptions (pays d’origine, situation, ville) pour préparer le lancement', 'Intérêt légitime de KRISMA'],
            ['Répondre aux questions posées dans le chat', 'Votre demande (intérêt légitime de KRISMA)'],
            ['Sécuriser le formulaire et le chat et prévenir les inscriptions frauduleuses (adresse IP, vérification anti-robot)', 'Intérêt légitime de KRISMA'],
          ]]],
          ['p', `Vous pouvez retirer votre consentement à tout moment : dans votre espace (Profil, rubrique Notifications), par le lien « Gérer mes préférences » présent dans nos e-mails, ou en écrivant à ${EMAIL}.`],
        ],
      },
      {
        id: 'conservation',
        title: 'Durée de conservation',
        blocks: [['p', 'Vos données sont conservées jusqu’au lancement des services KRISMA, puis 24 mois après celui-ci, sauf si vous demandez leur suppression plus tôt. Elles sont ensuite supprimées.']],
      },
      {
        id: 'destinataires',
        title: 'Destinataires et sous-traitants',
        blocks: [
          ['p', 'Vos données sont accessibles uniquement à l’équipe KRISMA et aux prestataires techniques suivants, qui agissent sur nos instructions :'],
          ['table', [['Prestataire', 'Rôle', 'Localisation'], [
            ['Supabase', 'Base de données et comptes (inscriptions)', 'Union européenne (Irlande)'],
            ['Vercel Inc.', 'Hébergement du site', 'États-Unis'],
            ['Resend', 'Envoi des e-mails', 'États-Unis'],
            ['Cloudflare (Turnstile)', 'Vérification anti-robot à l’inscription et à la connexion', 'États-Unis'],
            ['Komoot (Photon) et OpenStreetMap', 'Recherche de ville et d’adresse', 'Union européenne (Allemagne)'],
            ['OpenFreeMap', 'Fond de carte de KRISMA Map, chargé par votre navigateur', 'Union européenne'],
          ]]],
          ['p', 'Lorsque des données sont traitées hors de l’Union européenne, ce transfert est encadré par les garanties prévues par le RGPD, notamment les clauses contractuelles types de la Commission européenne.'],
        ],
      },
      {
        id: 'droits',
        title: 'Vos droits',
        blocks: [
          ['p', `Conformément au Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés, vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité de vos données. Pour les exercer, écrivez à ${EMAIL}. Nous répondons sous un mois.`],
          ['p', 'Depuis votre espace (Profil), vous pouvez aussi télécharger vos données (PDF ou Excel), modifier votre nom et vos préférences, et supprimer votre compte.'],
          ['p', 'Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL (cnil.fr).'],
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies',
        blocks: [['p', 'Le site krisma.io n’utilise aucun cookie de mesure d’audience ni de publicité. Seuls des éléments strictement nécessaires au fonctionnement technique du site sont enregistrés dans votre navigateur (session de connexion, langue choisie, conversation du chat le temps de l’onglet) ; ils ne requièrent pas votre consentement.']],
      },
      { id: 'age', title: 'Âge minimum', blocks: [['p', 'L’inscription à la liste d’attente est réservée aux personnes âgées d’au moins 16 ans.']] },
      { id: 'modification', title: 'Modification', blocks: [['p', 'Cette politique pourra être mise à jour, notamment au lancement des services. La date de dernière mise à jour figure en haut de cette page.']] },
    ],
  },
}

const en = {
  updated: `Last updated: ${UPDATED.en}`,
  toc: 'On this page',
  contact: 'A question?',
  contactText: `Write to us at ${EMAIL}.`,
  other: { mentions: 'Legal notice', privacy: 'Privacy policy', rules: 'Campaign rules' },
  mentions: {
    title: 'Legal notice',
    intro: 'In accordance with Article 6 of French law no. 2004-575 of 21 June 2004 on confidence in the digital economy (LCEN), here is the information about the krisma.io website.',
    sections: [
      {
        id: 'editeur',
        title: 'Publisher',
        blocks: [
          ['p', 'KRISMA, a French single-shareholder simplified joint-stock company (SASU) with a share capital of €100.'],
          ['ul', ['Registered office: 47 rue Vivienne, 75002 Paris, France', 'Registered with the Paris Trade and Companies Register (RCS) under number 109 830 299', `Contact: ${EMAIL}`]],
        ],
      },
      { id: 'publication', title: 'Publication director', blocks: [['p', 'Christian EHOUMAN, President of KRISMA.']] },
      {
        id: 'hebergeur',
        title: 'Hosting',
        blocks: [
          ['dl', [
            ['Website', 'Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, United States — vercel.com'],
            ['Data', 'Supabase Inc., database hosted in the European Union (Ireland) — supabase.com'],
          ]],
        ],
      },
      {
        id: 'statut',
        title: 'KRISMA’s status',
        blocks: [
          ['p', 'KRISMA is a company in development. It is neither a credit institution, nor a payment institution, nor an electronic money institution. No financial service is offered on this website at this time. The services described will be provided, at launch, by licensed partners, whose identity and regulatory status will be specified then.'],
          ['p', 'Prices and features shown on the website are indicative and may change before launch.'],
        ],
      },
      {
        id: 'propriete',
        title: 'Intellectual property',
        blocks: [['p', 'The KRISMA brand, logo, texts, visuals and graphic elements of this website are the property of KRISMA. Any reproduction or use without prior written permission is prohibited.']],
      },
      { id: 'contact', title: 'Contact', blocks: [['p', `For any question about the website: ${EMAIL}.`]] },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    intro: 'KRISMA only collects the data needed to run its waitlist and to let you know about the launch. It does not sell it and does not share it with any third party for commercial purposes.',
    sections: [
      {
        id: 'responsable',
        title: 'Data controller',
        blocks: [['p', `KRISMA SASU, 47 rue Vivienne, 75002 Paris, France — RCS Paris 109 830 299 — ${EMAIL}`]],
      },
      {
        id: 'donnees',
        title: 'Data we collect',
        blocks: [
          ['p', 'When you join the waitlist, we collect:'],
          ['dl', [
            ['Identity and access', 'first name, last name, email address, password (stored hashed, never readable by KRISMA).'],
            ['Profile', 'city of residence (with the city’s geographic coordinates, not your address), country of origin, current situation, website language.'],
            ['Your questionnaire answers', 'how often you send and receive money between Europe and Africa and the countries involved, how often and how much you spend in local shops each month, interest in instant transfers, cashback and other KRISMA services, opinion on the planned price and intended use.'],
            ['Consents', 'acceptance of the rules and of this policy, whether or not you agree to receive news, with their date.'],
            ['Technical data', 'IP address at sign-up.'],
          ]],
          ['p', 'During the campaign, we also record:'],
          ['dl', [
            ['Referrals', 'your referral code and, if you joined through a friend’s link, who referred you.'],
            ['Points and ranking', 'your points history and your rank.'],
            ['KRISMA Map', 'the shops you suggest (name, category, address, location) and your votes.'],
            ['Website chat', 'the questions you ask the team and its answers, the page you write from, and the sending IP address (to limit abuse). If you have not signed up, you may leave an optional email address: it is only used to send you the answer.'],
          ]],
        ],
      },
      {
        id: 'public',
        title: 'Publicly visible data',
        blocks: [
          ['ul', [
            'In the leaderboard: your first name followed by the initial of your last name (for example “Awa K.”), your city and your points.',
            'On the waitlist page: the first name and last-name initial of the latest members, without their city.',
            'On KRISMA Map: suggested shops, with the first name and last-name initial of the person who suggested them.',
          ]],
          ['p', 'Your full name, email address and questionnaire answers are never public.'],
        ],
      },
      {
        id: 'finalites',
        title: 'Purposes and legal basis',
        blocks: [
          ['table', [['Purpose', 'Legal basis'], [
            ['Managing your sign-up and access to the waitlist', 'Your consent'],
            ['Running the campaign: points, leaderboard, referrals, KRISMA Map', 'Performance of the campaign rules you accepted'],
            ['Keeping you informed about KRISMA’s launch and progress', 'Your consent'],
            ['Studying your questionnaire answers to design the offer (services, price, partner shops)', 'Your consent'],
            ['Analysing sign-ups in aggregate (country of origin, situation, city) to prepare the launch', 'KRISMA’s legitimate interest'],
            ['Answering questions asked in the chat', 'Your request (KRISMA’s legitimate interest)'],
            ['Securing the form and the chat and preventing fraudulent sign-ups (IP address, bot check)', 'KRISMA’s legitimate interest'],
          ]]],
          ['p', `You can withdraw your consent at any time: in your space (Profile, Notifications), through the “Manage my preferences” link in our emails, or by writing to ${EMAIL}.`],
        ],
      },
      {
        id: 'conservation',
        title: 'Retention period',
        blocks: [['p', 'Your data is kept until KRISMA’s services launch, then for 24 months afterwards, unless you ask for it to be deleted sooner. It is then deleted.']],
      },
      {
        id: 'destinataires',
        title: 'Recipients and processors',
        blocks: [
          ['p', 'Your data is only accessible to the KRISMA team and to the following technical providers, who act on our instructions:'],
          ['table', [['Provider', 'Role', 'Location'], [
            ['Supabase', 'Database and accounts (sign-ups)', 'European Union (Ireland)'],
            ['Vercel Inc.', 'Website hosting', 'United States'],
            ['Resend', 'Sending emails', 'United States'],
            ['Cloudflare (Turnstile)', 'Bot check at sign-up and log-in', 'United States'],
            ['Komoot (Photon) and OpenStreetMap', 'City and address search', 'European Union (Germany)'],
            ['OpenFreeMap', 'KRISMA Map base map, loaded by your browser', 'European Union'],
          ]]],
          ['p', 'When data is processed outside the European Union, the transfer is governed by the safeguards provided by the GDPR, in particular the European Commission’s standard contractual clauses.'],
        ],
      },
      {
        id: 'droits',
        title: 'Your rights',
        blocks: [
          ['p', `Under the General Data Protection Regulation (GDPR) and the French Data Protection Act, you have the right to access, rectify, erase, restrict, object to and port your data. To exercise these rights, write to ${EMAIL}. We reply within one month.`],
          ['p', 'From your space (Profile), you can also download your data (PDF or Excel), change your name and preferences, and delete your account.'],
          ['p', 'If you believe your rights are not respected, you can file a complaint with the CNIL, the French data protection authority (cnil.fr).'],
        ],
      },
      {
        id: 'cookies',
        title: 'Cookies',
        blocks: [['p', 'The krisma.io website uses no audience measurement or advertising cookies. Only items strictly necessary for the website to work are stored in your browser (log-in session, chosen language, chat conversation for the duration of the tab); they do not require your consent.']],
      },
      { id: 'age', title: 'Minimum age', blocks: [['p', 'The waitlist is open to people aged 16 and over.']] },
      { id: 'modification', title: 'Changes', blocks: [['p', 'This policy may be updated, in particular when the services launch. The date of the last update appears at the top of this page.']] },
    ],
  },
}

export const LEGAL = { fr, en }
