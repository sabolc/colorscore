/**
 * ULWILA Color Score Editor - Image Export
 *
 * PNG and SVG export functions for the score canvas.
 * Works with any SVGSVGElement — no dependency on a specific renderer.
 */

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
 * Trigger a browser download for a Blob with the given filename.
 * Creates a temporary anchor element, clicks it, then cleans up.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export the score SVG as a PNG image file.
 *
 * Renders the SVG to an off-screen canvas at 2x resolution for crisp output,
 * then triggers a browser download of the resulting PNG blob.
 *
 * @param svgElement - The SVG element to export
 * @param title - The score title, used to derive the download filename
 */
export async function exportPng(
  svgElement: SVGSVGElement,
  title: string,
): Promise<void> {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  const canvas = document.createElement('canvas');
  const width = svgElement.width.baseVal.value || 800;
  const height = svgElement.height.baseVal.value || 600;

  // 2x resolution for crisp output
  canvas.width = width * 2;
  canvas.height = height * 2;

  return new Promise<void>((resolve, reject) => {
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.scale(2, 2);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('PNG conversion failed'));
          return;
        }
        triggerDownload(blob, sanitizeFilename(title) + '.png');
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG rendering failed'));
    };

    img.src = url;
  });
}

/**
 * Export the score SVG as an SVG file.
 *
 * Serializes the SVG DOM to a string and triggers a browser download
 * with the correct MIME type.
 *
 * @param svgElement - The SVG element to export
 * @param title - The score title, used to derive the download filename
 */
export function exportSvg(
  svgElement: SVGSVGElement,
  title: string,
): void {
  const svgData = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgData], {
    type: 'image/svg+xml;charset=utf-8',
  });
  triggerDownload(blob, sanitizeFilename(title) + '.svg');
}
