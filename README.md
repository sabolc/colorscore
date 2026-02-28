# ULWILA Color Score Editor

A web-based music notation editor using the ULWILA color system — a 7-color method for teaching music to children, including those with disabilities.

## Features

- **Two rendering modes**: Standard 5-line staff notation (Mode A) and simplified colored circles (Mode B)
- **ULWILA color mapping**: Each pitch has a unique color — C (black), D (brown), E (blue), F (green), G (red), A (orange), H/B (yellow)
- **Accented notes (sharps)**: Rendered as split semicircle noteheads showing both pitches
- **Full note editing**: Add, edit, and delete notes and rests with pitch, duration, octave, and lyrics
- **Export**: PDF, PNG, and SVG export
- **Save/Load**: JSON-based score persistence
- **Multilingual**: English and Hungarian UI with localized solfège names (extensible to more languages)

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## Build

```bash
npm run build    # Production build → dist/
npm run test     # Run tests (Vitest)
```

## Tech Stack

- React 18 + TypeScript
- Vite 5
- SVG rendering (no canvas dependencies for notation)
- jsPDF + html2canvas for export
- Vitest + Testing Library for tests

## Color Map

| Pitch | Color | Hex |
|-------|-------|-----|
| C | Black | `#1A1A1A` |
| D | Brown | `#8B4513` |
| E | Blue | `#0000CD` |
| F | Green | `#228B22` |
| G | Red | `#DC143C` |
| A | Orange | `#FF8C00` |
| H (B) | Yellow | `#FFD700` |

## Adding a Language

1. Create `src/i18n/<code>.ts` implementing the `Translations` interface
2. Add the language code to `SupportedLanguage` in `src/i18n/types.ts`
3. Register it in `src/i18n/LanguageContext.tsx` (import, dictionary, supported list)

## License

MIT
