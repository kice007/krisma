// "K KRISMA" and VISA printed along the tilted hero card.
export function CardMarks({ logo, visa, k, size, gap, visaSize }) {
  return (
    <>
      <span className="absolute flex origin-top-left items-center" style={{ left: logo[0], top: logo[1], gap, transform: 'rotate(78.7deg)' }}>
        <img src="/img/landing/k-white.png" alt="" style={{ width: k[0], height: k[1] }} className="max-w-none object-contain" />
        <span className="font-display font-bold text-white" style={{ fontSize: size }}>
          KRISMA
        </span>
      </span>
      <span
        className="absolute origin-top-left font-display font-extrabold italic text-white"
        style={{ left: visa[0], top: visa[1], fontSize: visaSize, transform: 'rotate(78.94deg)' }}
      >
        VISA
      </span>
    </>
  )
}
