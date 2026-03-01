# ULWILA Color Score Editor

A web-based music notation editor using the ULWILA color system — a 7-color method for teaching music to children, including those with disabilities.

## About the ULWILA Method

The **ULWILA method** (named after **Ul**lrich and **Wi**lbert) is a color-based music notation system developed by German special education teacher **Heinrich Ullrich**. It was adapted for Hungarian use by **Vető Anna** in the 1990s and is widely used in Hungary for teaching music to children with intellectual disabilities, kindergartners, families, and anyone who cannot or does not want to learn traditional staff notation.

The key insight: **you only need to identify colors to read this notation.** No understanding of staff lines, clefs, or key signatures is required. The colors progressively darken from high to low pitch.

### Note-to-Color Mapping (C Major Scale)

| Note (German) | Solfège | Color | Hex |
|---|---|---|---|
| C | Do / Dó | Black | `#1A1A1A` |
| D | Ré | Brown | `#8B4513` |
| E | Mi | Blue | `#0000CD` |
| F | Fa / Fá | Green | `#228B22` |
| G | Sol / Szó | Red | `#DC143C` |
| A | La / Lá | Orange | `#FF8C00` |
| H (B) | Si / Ti | Yellow | `#FFD700` |

### Octave Indicators

The same 7 colors are reused across octaves. Octaves are distinguished by a small dot in the center of the colored circle:

| Octave | Indicator |
|---|---|
| Lower octave | Small **black** dot in center |
| Main/middle octave | No dot (plain colored circle) |
| Upper octave | Small **white** dot in center |

### Accented Notes (Sharps)

Black piano keys (sharps/flats) are represented as two-color semicircle noteheads — the left half uses the lower neighbor's ULWILA color, the right half uses the upper neighbor's color. For example, C♯ is rendered as a half-black, half-brown circle.

## Features

- **Two rendering modes**: Standard 5-line staff notation (Mode A) with colored noteheads, and simplified colored circles (Mode B) — the original ULWILA layout
- **Accented notes (sharps)**: Rendered as split semicircle noteheads showing both neighboring pitches
- **Full note editing**: Add, edit, and delete notes and rests with pitch, duration, octave, and lyrics
- **Export**: PDF (print-ready A4), PNG, and SVG export
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

## Adding a Language

1. Create `src/i18n/<code>.ts` implementing the `Translations` interface
2. Add the language code to `SupportedLanguage` in `src/i18n/types.ts`
3. Register it in `src/i18n/LanguageContext.tsx` (import, dictionary, supported list)

## References

- Vető Anna & Ullrich, Heinrich (1997): *ULWILA Színeskotta. Tanári kézikönyv zeneoktatáshoz.* Budapest: Down Alapítvány Kiadó.
- Down Alapítvány — [ULWILA Színeskotta](https://www.downalapitvany.hu/node/145)
- Bakos Anita (2014): [Zenetanulás színesen](https://www.parlando.hu/2014/2014-3/Bakos_Anita_Zenetanulas.pdf) (Parlando)
- [Színes kotta blog](https://www.szineskotta.com/) by Hangayné Márta Dóra

## License

MIT
