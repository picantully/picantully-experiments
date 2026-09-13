interface ToastProps {
  message: string
}

export function Toast({ message }: ToastProps) {
  if (!message) return null
  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-x-4 bottom-6 z-[60] animate-[pica-bubble_0.2s_ease_both] rounded-2xl border border-border2 bg-[rgba(20,12,12,0.96)] px-3.5 py-2.5 text-center text-xs text-[#cdc2c3] shadow-2xl"
    >
      {message}
    </div>
  )
}
