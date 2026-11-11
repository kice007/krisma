export default function Eyebrow({ children, dark }) {
  return (
    <span className={`inline-flex items-center gap-2 font-body text-[15px] font-medium ${dark ? 'text-white' : 'text-noir'}`}>
      <span className={`h-2.5 w-2.5 rounded-full border-[2.5px] ${dark ? 'border-white' : 'border-noir'}`} />
      {children}
    </span>
  )
}
