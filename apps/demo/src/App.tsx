import { PhoneShell } from './components/layout/PhoneShell'
import { SideNotes } from './components/layout/SideNotes'
import { TopBar } from './components/layout/TopBar'
import { AppOpenScreen } from './components/screens/AppOpenScreen'
import { ChatScreen } from './components/screens/ChatScreen'
import { HomeScreen } from './components/screens/HomeScreen'
import { PicantullyApp } from './components/screens/picantully/PicantullyApp'
import { PomodoroScreen } from './components/screens/PomodoroScreen'
import { useDemoState } from './state/useDemoState'

export function App() {
  const { state, actions } = useDemoState()

  return (
    <div
      className="flex min-h-screen flex-col items-center gap-3.5 px-4 pb-6 pt-5"
      style={{ background: 'radial-gradient(800px 520px at 50% -8%, #2a0c0a 0%, #0d0708 55%, #080506 100%)' }}
    >
      <TopBar />
      <div className="flex w-full max-w-[960px] items-start justify-center gap-8">
        <PhoneShell toast={state.toast} onHomeGesture={actions.goHome}>
          {state.screen === 'home' && <HomeScreen state={state} actions={actions} />}
          {state.screen === 'chat' && <ChatScreen state={state} actions={actions} />}
          {state.screen === 'app' && <AppOpenScreen state={state} actions={actions} />}
          {state.screen === 'pomodoro' && <PomodoroScreen state={state} actions={actions} />}
          {state.screen === 'picantully' && <PicantullyApp state={state} actions={actions} />}
        </PhoneShell>
        <SideNotes />
      </div>
    </div>
  )
}
