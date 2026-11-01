// Blurry orange light beams from the top-left corner of the dark blocks.
export default function Rays({ desktop, mobile }) {
  return (
    <>
      <img src={`/img/landing/${desktop}.webp`} alt="" className="breathe absolute inset-0 hidden h-full w-full lg:block" />
      <img src={`/img/landing/${mobile}.webp`} alt="" className="breathe absolute inset-0 h-full w-full lg:hidden" />
    </>
  )
}
