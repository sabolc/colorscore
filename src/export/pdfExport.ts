/**
 * ULWILA Color Score Editor - PDF Export
 *
 * A4 PDF export using jsPDF.
 * Renders the SVG to a canvas first (to resolve CSS styles), then embeds
 * the raster image in the PDF. This avoids svg2pdf.js compatibility issues
 * with CSS modules and computed styles.
 */

import { jsPDF } from 'jspdf';
import { getCurrentTranslations } from '../i18n';

/** A4 page dimensions in millimetres. */
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;
const CONTENT_HEIGHT = PAGE_HEIGHT - 2 * MARGIN;

/** Vertical space reserved for the title block (mm). */
const TITLE_AREA_HEIGHT = 20;

/**
 * Sanitize a title string into a safe filename.
 * Replaces any non-alphanumeric character with an underscore.
 * Falls back to "score" when the title is empty or blank.
 */
function sanitizeFilename(title: string): string {
  const trimmed = (title || '').trim();
  if (!trimmed) return 'score';
  return trimmed.replace(/[^a-z0-9]/gi, '_');
}

/**
 * Render an SVG element to a canvas, inlining computed CSS styles
 * so the rasterization is accurate even with CSS modules.
 */
function svgToCanvas(
  svgElement: SVGSVGElement,
  scale: number,
): Promise<HTMLCanvasElement> {
  // Clone the SVG so we don't modify the live DOM
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Inline computed styles on all elements so they survive serialization
  const sourceElements = svgElement.querySelectorAll('*');
  const cloneElements = clone.querySelectorAll('*');
  for (let i = 0; i < sourceElements.length; i++) {
    const computed = window.getComputedStyle(sourceElements[i]);
    const target = cloneElements[i] as SVGElement | HTMLElement;
    const props = [
      'fill', 'stroke', 'stroke-width', 'opacity', 'font-size',
      'font-family', 'font-weight', 'text-anchor', 'dominant-baseline',
      'cursor', 'display', 'visibility',
    ];
    for (const prop of props) {
      const value = computed.getPropertyValue(prop);
      if (value) {
        target.style.setProperty(prop, value);
      }
    }
  }

  const svgData = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgData], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(svgBlob);

  const width = svgElement.width.baseVal.value || 800;
  const height = svgElement.height.baseVal.value || 600;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const img = new Image();

  return new Promise<HTMLCanvasElement>((resolve, reject) => {
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG rendering failed'));
    };

    img.src = url;
  });
}

/**
 * Export the score as a PDF file.
 *
 * - A4 page size (210 x 297 mm) with 15 mm margins
 * - Song title centred at the top of page 1
 * - SVG rendered to a high-res canvas, then embedded as a PNG image
 * - Scales to fit within the available content area
 * - Downloads as `<title>.pdf`
 *
 * @param svgElement - The SVG element containing the rendered score
 * @param title - The score title, placed at the top and used for the filename
 */
export async function exportPdf(
  svgElement: SVGSVGElement,
  title: string,
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // --- Title ---
  const t = getCurrentTranslations();
  const displayTitle = (title || '').trim() || t.export.untitledScore;
  doc.setFontSize(16);
  doc.text(displayTitle, PAGE_WIDTH / 2, MARGIN + 10, {
    align: 'center',
  });

  // --- Render SVG to canvas at 3x for quality ---
  const canvas = await svgToCanvas(svgElement, 3);

  // --- Calculate placement ---
  const svgWidth = svgElement.width.baseVal.value || 800;
  const svgHeight = svgElement.height.baseVal.value || 600;
  const aspectRatio = svgHeight / svgWidth;

  const svgStartY = MARGIN + TITLE_AREA_HEIGHT;
  const availableHeight = CONTENT_HEIGHT - TITLE_AREA_HEIGHT;

  let imgWidth = CONTENT_WIDTH;
  let imgHeight = CONTENT_WIDTH * aspectRatio;

  // If taller than available space, scale down to fit
  if (imgHeight > availableHeight) {
    imgHeight = availableHeight;
    imgWidth = availableHeight / aspectRatio;
  }

  // Center horizontally if narrower than content width
  const imgX = MARGIN + (CONTENT_WIDTH - imgWidth) / 2;

  // Add the canvas as a PNG image
  const imgData = canvas.toDataURL('image/png');
  doc.addImage(imgData, 'PNG', imgX, svgStartY, imgWidth, imgHeight);

  // --- Download ---
  const filename = sanitizeFilename(title) + '.pdf';
  doc.save(filename);
}
