import type { DemoState } from '../../../state/types'
import type { DemoActions } from '../../../state/useDemoState'
import { ActitudTab } from './ActitudTab'
import { AppsTab } from './AppsTab'
import { CasaTab } from './CasaTab'
import { FocoTab } from './FocoTab'
import { Tabbar } from './Tabbar'

interface PicantullyAppProps {
  state: DemoState
  actions: DemoActions
}

/** The Picantully settings app itself, opened from the phone's home screen or dock. */
export function PicantullyApp({ state, actions }: PicantullyAppProps) {
  return (
    <div className="absolute inset-0 flex flex-col bg-bg2 animate-[pica-in_0.25s_ease_both]">
      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-12">
        {state.tab === 'casa' && <CasaTab state={state} actions={actions} />}
        {state.tab === 'apps' && <AppsTab state={state} actions={actions} />}
        {state.tab === 'foco' && <FocoTab state={state} actions={actions} />}
        {state.tab === 'actitud' && <ActitudTab state={state} actions={actions} />}
      </div>
      <Tabbar activeTab={state.tab} onSelect={actions.setTab} />
    </div>
  )
}
