// Réseaux sociaux de KRISMA. Remplacer les `#` par les liens des comptes dès qu'ils existent.
export const SOCIALS = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/company/krisma/',
    d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  },
  {
    name: 'Instagram',
    href: '#',
    d: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zM16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4zM17.5 6.5h.01',
  },
  {
    name: 'TikTok',
    href: '#',
    d: 'M9 12a4 4 0 1 0 4 4V3c.5 2.5 2.5 4.5 5 5',
  },
]

export function Socials({ className = '', size = 24, gap = 'gap-4' }) {
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {SOCIALS.map(({ name, href, d }) => (
        <a
          key={name}
          href={href}
          aria-label={name}
          {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          className="hover:-translate-y-0.5 hover:opacity-70"
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={d} />
          </svg>
        </a>
      ))}
    </div>
  )
}
