const star = (cx, cy, R) => {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? R * 0.42 : R
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`
  }
  return `${d}Z`
}
const V = (c) => c.map((f, i) => [(i * 32) / c.length, 0, 32 / c.length, 32, f])
const H = (c) => c.map((f, i) => [0, (i * 32) / c.length, 32, 32 / c.length, f])

const FLAGS = {
  ci: { r: V(['#f77f00', '#ffffff', '#009e60']) },
  sn: { r: V(['#00853f', '#fdef42', '#e31b23']), s: ['#00853f', 16, 16, 5] },
  ml: { r: V(['#14b53a', '#fcd116', '#ce1126']) },
  bf: { r: H(['#ef2b2d', '#009e49']), s: ['#fcd116', 16, 16, 6] },
  bj: { r: [[0, 0, 13, 32, '#008751'], [13, 0, 19, 16, '#fcd116'], [13, 16, 19, 16, '#e8112d']] },
  tg: { r: [...H(['#006a4e', '#ffce00', '#006a4e', '#ffce00', '#006a4e']), [0, 0, 17, 19.2, '#d21034']], s: ['#ffffff', 8.5, 9.6, 5] },
  cm: { r: V(['#007a5e', '#ce1126', '#fcd116']), s: ['#fcd116', 16, 16, 5] },
  ga: { r: H(['#009e60', '#fcd116', '#3a75c4']) },
}

export default function Flag({ code }) {
  const f = FLAGS[code]
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-black/10" aria-hidden>
      {f.r.map(([x, y, w, h, c], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={c} />
      ))}
      {f.s && <path d={star(f.s[1], f.s[2], f.s[3])} fill={f.s[0]} />}
    </svg>
  )
}
