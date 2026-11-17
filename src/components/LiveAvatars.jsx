import { avatarColor } from '../lib/publicStats'

// Pastilles des derniers inscrits (initiale du prénom). Uniquement de vrais
// inscrits : sans inscrit, une seule pastille noire avec le K de KRISMA.
export default function LiveAvatars({ latest, ring = 'border-[#f1f1f1]' }) {
  const names = latest.slice(0, 3).map((x) => x.name)
  return (
    <div className="flex -space-x-2.5" aria-hidden>
      {names.length === 0 ? (
        <span className={`flex h-9 w-9 items-center justify-center rounded-full border-2 bg-noir ${ring}`}>
          <img src="/img/landing/k-white.png" alt="" className="h-[15px] w-3 object-contain" />
        </span>
      ) : (
        names.map((n, i) => (
          <span key={i} className={`flex h-9 w-9 items-center justify-center rounded-full border-2 font-body text-[13px] font-bold text-white ${ring}`} style={{ background: avatarColor(i) }}>
            {n.trim()[0]?.toUpperCase()}
          </span>
        ))
      )}
    </div>
  )
}
