const STEPS = [
  'Las apps con punto rojo son distractoras: siempre negocian antes de abrirse. Se configura en la pestaña Apps.',
  'Al abrirlas aparece el chat. Te puede negar las veces que quiera.',
  'Si te da minutos entrás con el timer arriba. Cuando se acaba, vuelve a negociar solo.',
  'En la pestaña Actitud cambiás su tono y cuánto cuesta convencerlo.'
]

/** "Cómo probarlo" instructions column — desktop only. */
export function SideNotes() {
  return (
    <div className="hidden w-[230px] flex-none flex-col gap-3 pt-6 min-[760px]:flex">
      <p className="font-mono text-[9.5px] tracking-[0.14em] text-mut2">CÓMO PROBARLO</p>
      {STEPS.map((step, i) => (
        <div key={step} className="flex gap-2.5">
          <span className="text-sm font-bold text-red">{i + 1}</span>
          <p className="text-[12.5px] leading-relaxed text-mut2">{step}</p>
        </div>
      ))}
      <div className="my-1 h-px bg-border2" />
      <p className="text-xs leading-relaxed text-mut2">En pantalla chica el celular desaparece y la app ocupa todo.</p>
    </div>
  )
}
