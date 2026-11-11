import { Link } from 'react-router-dom'

const TONES = {
  orange: 'bg-marque text-white hover:bg-[#f06e1b]',
  noir: 'bg-noir text-white hover:bg-[#2b2b2b]',
  blanc: 'bg-white text-noir hover:bg-clair',
}

export default function Button({ href = '/waitlist', tone = 'orange', children, className = '', onClick, type }) {
  const cls = `group inline-flex items-center justify-center gap-2.5 rounded-full px-[26px] font-body text-[15px] font-semibold hover:-translate-y-0.5 ${TONES[tone]} ${className}`
  const inner = children
  if (type) {
    return (
      <button type={type} onClick={onClick} className={`cursor-pointer ${cls}`}>
        {inner}
      </button>
    )
  }
  // Liens internes (« /waitlist ») : navigation sans rechargement
  if (href.startsWith('/')) {
    return (
      <Link to={href} onClick={onClick} className={cls}>
        {inner}
      </Link>
    )
  }
  return (
    <a href={href} onClick={onClick} className={cls}>
      {inner}
    </a>
  )
}
