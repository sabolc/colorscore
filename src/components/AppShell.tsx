import './AppShell.css'
import NoteInputPanel from './NoteInputPanel'
import { Toolbar } from './Toolbar'
import { ScoreCanvas } from './ScoreCanvas'
import { NoteEditor } from './NoteEditor'
import { LyricsEditor } from './LyricsEditor'

function AppShell() {
  return (
    <div className="app-shell">
      <div className="toolbar-slot" data-testid="toolbar-slot">
        <Toolbar />
      </div>
      <div className="note-input-panel" data-testid="note-input-slot">
        <NoteInputPanel />
      </div>
      <div className="editor-panel" data-testid="editor-slot">
        <NoteEditor />
        <LyricsEditor />
      </div>
      <div className="score-canvas-slot" data-testid="canvas-slot">
        <ScoreCanvas />
      </div>
    </div>
  )
}

export default AppShell
