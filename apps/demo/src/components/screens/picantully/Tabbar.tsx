import type { PicantullyTab } from '../../../state/types'

const TABS: { id: PicantullyTab; label: string; glyph: string }[] = [
  { id: 'casa', label: 'Casa', glyph: '⌂' },
  { id: 'apps', label: 'Apps', glyph: '▦' },
  { id: 'foco', label: 'Foco', glyph: '◷' },
  { id: 'actitud', label: 'Actitud', glyph: '☺' }
]

interface TabbarProps {
  activeTab: PicantullyTab
  onSelect: (tab: PicantullyTab) => void
}

export function Tabbar({ activeTab, onSelect }: TabbarProps) {
  return (
    <nav className="flex border-t border-[#1f1819] bg-[rgba(12,8,9,0.96)] px-1.5 pb-3 pt-2">
      {TABS.map((tab) => {
        const active = tab.id === activeTab
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect(tab.id)}
            aria-current={active ? 'page' : undefined}
            className={`flex flex-1 flex-col items-center gap-0.5 py-1 text-[9.5px] ${active ? 'text-[#ff5247]' : 'text-[#6d6162]'}`}
          >
            <span className="text-[15px] leading-none">{tab.glyph}</span>
            {tab.label}
          </button>
        )
      })}
    </nav>
  )
}
