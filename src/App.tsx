import { LanguageProvider } from './i18n'
import { ScoreProvider } from './store/ScoreContext'
import { SelectionProvider } from './store/SelectionContext'
import { NoteInputProvider } from './store/NoteInputContext'
import AppShell from './components/AppShell'

function App() {
  return (
    <LanguageProvider>
      <ScoreProvider>
        <SelectionProvider>
          <NoteInputProvider>
          <AppShell />
          </NoteInputProvider>
        </SelectionProvider>
      </ScoreProvider>
    </LanguageProvider>
  )
}

export default App
