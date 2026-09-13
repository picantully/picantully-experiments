import picantito from '../../assets/picantito-character.png'

/** Chrome above the phone frame — desktop only, hidden full-bleed on mobile. */
export function TopBar() {
  return (
    <div className="hidden w-full max-w-[960px] items-center justify-between gap-4 min-[760px]:flex">
      <div className="flex items-center gap-2">
        <div
          className="flex h-[26px] w-[26px] items-center justify-center overflow-hidden rounded-lg"
          style={{ background: 'linear-gradient(160deg,#ff4136,#a5150e)' }}
        >
          <img src={picantito} alt="" className="h-[23px] w-[23px] object-contain object-[center_20%]" />
        </div>
        <span className="font-display text-[15.5px] font-bold tracking-tight">Picantully</span>
        <span className="rounded-full border border-[#45201d] px-2 py-1 font-mono text-[9.5px] tracking-[0.14em] text-[#ff6b60]">
          DEMO APP
        </span>
      </div>
      <p className="text-xs text-mut2">Tocá una app con punto rojo y negociá.</p>
    </div>
  )
}
