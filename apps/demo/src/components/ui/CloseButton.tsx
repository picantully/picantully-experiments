interface CloseButtonProps {
  onClick: () => void
  /** Button copy — "Cerrar" for tab screens, "Salir" for the chat screen. */
  label?: string
}

/** Shared dismiss button used by the Picantully tab headers and the chat screen. */
export function CloseButton({ onClick, label = 'Cerrar' }: CloseButtonProps) {
  return (
    <button type="button" onClick={onClick} className="text-xs text-mut2">
      {label}
    </button>
  )
}
