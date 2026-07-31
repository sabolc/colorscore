"""Render KEZIKONYV.md to a printable A4 PDF.

Uses PyMuPDF's Story layout engine. Three things need care:

* Hungarian needs Latin Extended-A (ő, ű), which the built-in Base-14 fonts do
  not carry — so a system TrueType font is embedded.
* The manual uses musical and symbol glyphs (U+1D106/7 repeat signs, the open
  box for a space) that even Arial lacks. Those are swapped for readable
  equivalents rather than left to render as empty boxes.
* Story collapses whitespace even inside <pre>, which would run the screen
  diagram together into one line.
"""

from __future__ import annotations

import pathlib
import re
import sys

import fitz
import markdown

SRC = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(sys.argv[2])
FONT_DIR = pathlib.Path("C:/Windows/Fonts")

NBSP = "\u00a0"

# Glyphs no ordinary text font carries, mapped to something printable
GLYPH_FALLBACKS = {
    "\U0001D106": "|:",   # repeat start
    "\U0001D107": ":|",   # repeat end
    "\u2423": "( )",      # open box, used for the space marker
}

CSS = """
body { font-family: manual; font-size: 10pt; line-height: 1.45; color: #1a1a1a; }
h1 { font-size: 20pt; margin: 0 0 4pt 0; color: #000; }
h2 { font-size: 14pt; margin: 16pt 0 4pt 0; color: #000; }
h3 { font-size: 11.5pt; margin: 10pt 0 3pt 0; color: #000; }
p  { margin: 0 0 6pt 0; }
ul, ol { margin: 0 0 6pt 0; }
li { margin: 0 0 2pt 0; }
code { font-family: mono; font-size: 9pt; background: #f2f2f2; }
pre { font-family: mono; font-size: 8pt; background: #f6f6f6; padding: 5pt;
      margin: 0 0 8pt 0; line-height: 1.3; }
blockquote { margin: 6pt 0 8pt 0; padding: 4pt 8pt; background: #eef4fb;
             border-left: 3px solid #4a7fbf; }
table { width: 100%; margin: 0 0 8pt 0; }
th { text-align: left; font-size: 9pt; background: #ececec; padding: 3pt; }
td { font-size: 9pt; padding: 3pt; vertical-align: top; }
hr { margin: 10pt 0; }
a { color: #1a4f8a; }
"""


def keep_preformatting(match: re.Match[str]) -> str:
    """Make a code block's line breaks and indentation survive Story layout."""
    inner = match.group(1).replace(" ", NBSP).replace("\n", "<br/>")
    return f"<pre>{inner}</pre>"


def main() -> None:
    text = SRC.read_text(encoding="utf-8")
    for bad, good in GLYPH_FALLBACKS.items():
        text = text.replace(bad, good)

    # The in-page table of contents is navigation for a web page; in print the
    # PDF outline does the same job without eating a page.
    start = text.find("## Tartalom")
    end = text.find("---", start)
    if start != -1 and end != -1:
        text = text[:start] + text[end + 3 :]

    body = markdown.markdown(text, extensions=["tables", "sane_lists", "fenced_code"])
    body = re.sub(r"<pre><code>(.*?)</code></pre>", keep_preformatting, body, flags=re.S)

    archive = fitz.Archive()
    archive.add(FONT_DIR / "arial.ttf", "manual.ttf")
    archive.add(FONT_DIR / "arialbd.ttf", "manual-bold.ttf")
    archive.add(FONT_DIR / "consola.ttf", "mono.ttf")

    css = (
        "@font-face { font-family: manual; src: url(manual.ttf); }\n"
        "@font-face { font-family: manual; font-weight: bold; src: url(manual-bold.ttf); }\n"
        "@font-face { font-family: mono; src: url(mono.ttf); }\n" + CSS
    )

    story = fitz.Story(html=f"<body>{body}</body>", user_css=css, archive=archive)

    # Lay out into a staging file first; the footer pass then writes OUT once,
    # which avoids replacing a file Windows may still hold open.
    staging = OUT.with_name(OUT.stem + "-staging.pdf")
    writer = fitz.DocumentWriter(staging)

    page_rect = fitz.paper_rect("a4")
    content = page_rect + (50, 45, -50, -50)

    pages = 0
    more = True
    while more:
        device = writer.begin_page(page_rect)
        more, _ = story.place(content)
        story.draw(device)
        writer.end_page()
        pages += 1
    writer.close()

    # Footer page numbers, added after layout so the total is known
    doc = fitz.open(staging)
    for i, page in enumerate(doc, start=1):
        page.insert_text(
            (page_rect.width / 2 - 20, page_rect.height - 28),
            f"{i} / {pages}",
            fontsize=8,
            color=(0.45, 0.45, 0.45),
        )
    # Whole TrueType fonts are embedded by default; subsetting drops the
    # thousands of glyphs a Hungarian manual never uses.
    try:
        doc.subset_fonts()
    except Exception:
        pass  # cosmetic only — a larger file still prints correctly

    doc.set_metadata({"title": "ULWILA Szines Kotta Szerkeszto - Kezikonyv"})
    doc.save(OUT)
    doc.close()
    try:
        staging.unlink()
    except OSError:
        pass  # scratch file; Windows may still hold it

    print(f"kesz: {OUT}  ({pages} oldal, {OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
