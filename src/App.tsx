import { LanguageProvider } from './i18n'
import { ScoreProvider } from './store/ScoreContext'
import { SelectionProvider } from './store/SelectionContext'
import AppShell from './components/AppShell'

function App() {
  return (
    <LanguageProvider>
      <ScoreProvider>
        <SelectionProvider>
          <AppShell />
        </SelectionProvider>
      </ScoreProvider>
    </LanguageProvider>
  )
}

export default App
