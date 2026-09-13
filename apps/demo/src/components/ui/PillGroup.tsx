interface PillOption<T> {
  value: T
  label: string
}

interface PillGroupProps<T extends string | number> {
  options: readonly PillOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/** Segmented single-select row — used for focus length, hardness, etc. */
export function PillGroup<T extends string | number>({ options, value, onChange, ariaLabel }: PillGroupProps<T>) {
  return (
    <div className="flex gap-1.5" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={String(opt.value)}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={
              'flex-1 rounded-xl px-2 py-2.5 text-center text-xs transition-colors ' +
              (active ? 'bg-red font-semibold text-white' : 'border border-[#2a2223] bg-[#1d1516] text-mut')
            }
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
