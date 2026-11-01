const P = {
  LinkedIn: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4z',
  X: 'M4 4l16 16M20 4L4 20',
  Instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zM16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4zM17.5 6.5h.01',
  YouTube: 'M2.5 7.1a2.8 2.8 0 0 1 2-2C6.2 4.6 12 4.6 12 4.6s5.8 0 7.5.5a2.8 2.8 0 0 1 2 2 29 29 0 0 1 0 9.8 2.8 2.8 0 0 1-2 2c-1.7.5-7.5.5-7.5.5s-5.8 0-7.5-.5a2.8 2.8 0 0 1-2-2 29 29 0 0 1 0-9.8zM10 15.5l5.2-3.5L10 8.5z',
}

export function Socials({ className = '', size = 24, gap = 'gap-4' }) {
  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {Object.entries(P).map(([name, d]) => (
        <a key={name} href="#" aria-label={name} className="hover:-translate-y-0.5 hover:opacity-70">
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d={d} />
          </svg>
        </a>
      ))}
    </div>
  )
}
