import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ScoreProvider } from '../../store/ScoreContext'
import { SelectionProvider } from '../../store/SelectionContext'
import { LanguageProvider } from '../../i18n'
import AppShell from '../AppShell'

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <LanguageProvider>
      <ScoreProvider>
        <SelectionProvider>
          {ui}
        </SelectionProvider>
      </ScoreProvider>
    </LanguageProvider>
  )
}

describe('AppShell', () => {
  it('renders all component slots', () => {
    renderWithProviders(<AppShell />)

    expect(screen.getByTestId('toolbar-slot')).toBeInTheDocument()
    expect(screen.getByTestId('note-input-slot')).toBeInTheDocument()
    expect(screen.getByTestId('canvas-slot')).toBeInTheDocument()
  })

  it('renders the Toolbar with title input', () => {
    renderWithProviders(<AppShell />)

    const titleInput = screen.getByLabelText('Score title')
    expect(titleInput).toBeInTheDocument()
  })

  it('renders the NoteInputPanel with add-note button', () => {
    renderWithProviders(<AppShell />)

    const addNoteButton = screen.getByLabelText('Add note to score')
    expect(addNoteButton).toBeInTheDocument()
  })

  it('renders the ScoreCanvas with staff renderer', () => {
    renderWithProviders(<AppShell />)

    const staffRenderer = screen.getByTestId('staff-renderer')
    expect(staffRenderer).toBeInTheDocument()
  })
})
