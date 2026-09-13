/** Fake iOS-style status bar + dynamic island — pure decoration, fixed 9:41/84% like the source mockup. */
export function StatusBar() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-11 items-center justify-between px-5 text-[12.5px] font-semibold text-white">
        <span>9:41</span>
        <span className="font-mono text-[10px] tracking-[0.1em] opacity-75">▮▮▮ 84%</span>
      </div>
      <div className="pointer-events-none absolute left-1/2 top-2 z-40 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black max-[759px]:hidden" />
    </>
  )
}
