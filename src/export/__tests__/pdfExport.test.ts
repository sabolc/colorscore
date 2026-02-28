/**
 * ULWILA Color Score Editor - PDF Export Tests
 *
 * Unit tests for A4 PDF export functionality.
 * Mocks jsPDF since we cannot render PDFs or use canvas under jsdom.
 * The canvas-based SVG rasterization is tested indirectly via the
 * addImage call.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — jsPDF (svg2pdf.js is no longer used)
// ---------------------------------------------------------------------------

const mockDoc = {
  setFontSize: vi.fn(),
  text: vi.fn(),
  addImage: vi.fn(),
  save: vi.fn(),
};

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => mockDoc),
}));

// Import after mocks are set up
import { exportPdf } from '../pdfExport';
import { jsPDF } from 'jspdf';

// ---------------------------------------------------------------------------
// Helpers — build a minimal mock SVGSVGElement with canvas support
// ---------------------------------------------------------------------------

function createMockSvgElement(
  width = 800,
  height = 600,
): SVGSVGElement {
  const svg = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'svg',
  ) as SVGSVGElement;
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));

  // jsdom does not populate baseVal from attributes, so we stub them.
  Object.defineProperty(svg, 'width', {
    value: { baseVal: { value: width } },
    writable: false,
  });
  Object.defineProperty(svg, 'height', {
    value: { baseVal: { value: height } },
    writable: false,
  });

  return svg;
}

// ---------------------------------------------------------------------------
// Mock canvas and Image for svgToCanvas
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Mock HTMLCanvasElement.toDataURL
  HTMLCanvasElement.prototype.toDataURL = vi.fn(
    () => 'data:image/png;base64,mockdata',
  );

  // Mock canvas getContext to return a mock 2d context
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    fillStyle: '',
    fillRect: vi.fn(),
    scale: vi.fn(),
    drawImage: vi.fn(),
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  // Mock Image to immediately trigger onload
  const OriginalImage = globalThis.Image;
  vi.spyOn(globalThis, 'Image').mockImplementation(() => {
    const img = new OriginalImage();
    // When src is set, trigger onload asynchronously
    const originalSrcDescriptor = Object.getOwnPropertyDescriptor(
      HTMLImageElement.prototype,
      'src',
    );
    Object.defineProperty(img, 'src', {
      set(value: string) {
        if (originalSrcDescriptor?.set) {
          originalSrcDescriptor.set.call(img, value);
        }
        // Trigger onload on next tick
        setTimeout(() => {
          if (img.onload) {
            (img.onload as () => void).call(img);
          }
        }, 0);
      },
      get() {
        return originalSrcDescriptor?.get?.call(img) ?? '';
      },
    });
    return img;
  });

  // Mock URL.createObjectURL and revokeObjectURL
  globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  globalThis.URL.revokeObjectURL = vi.fn();

  // Mock window.getComputedStyle to return empty values
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: () => '',
  } as unknown as CSSStyleDeclaration);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
// exportPdf
// ===========================================================================

describe('exportPdf', () => {
  it('creates an A4 portrait document', async () => {
    const svg = createMockSvgElement();

    await exportPdf(svg, 'Test Score');

    expect(jsPDF).toHaveBeenCalledWith({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  });

  it('adds title text centered at the top of the page', async () => {
    const svg = createMockSvgElement();

    await exportPdf(svg, 'My Song Title');

    expect(mockDoc.setFontSize).toHaveBeenCalledWith(16);
    expect(mockDoc.text).toHaveBeenCalledWith(
      'My Song Title',
      105, // pageWidth / 2 = 210 / 2
      25,  // margin(15) + 10
      { align: 'center' },
    );
  });

  it('uses "Untitled Score" when title is empty', async () => {
    const svg = createMockSvgElement();

    await exportPdf(svg, '');

    expect(mockDoc.text).toHaveBeenCalledWith(
      'Untitled Score',
      105,
      25,
      { align: 'center' },
    );
  });

  it('calls doc.addImage with PNG data', async () => {
    const svg = createMockSvgElement(800, 600);

    await exportPdf(svg, 'Test');

    expect(mockDoc.addImage).toHaveBeenCalledTimes(1);

    const callArgs = mockDoc.addImage.mock.calls[0];
    // First argument should be the data URL
    expect(callArgs[0]).toContain('data:image/png');
    // Second argument is format
    expect(callArgs[1]).toBe('PNG');
    // x, y, width, height should be numbers
    expect(typeof callArgs[2]).toBe('number'); // x
    expect(typeof callArgs[3]).toBe('number'); // y
    expect(typeof callArgs[4]).toBe('number'); // width
    expect(typeof callArgs[5]).toBe('number'); // height
  });

  it('positions image below title area', async () => {
    const svg = createMockSvgElement(800, 600);

    await exportPdf(svg, 'Test');

    const callArgs = mockDoc.addImage.mock.calls[0];
    const y = callArgs[3];
    // y should be margin(15) + titleAreaHeight(20) = 35
    expect(y).toBe(35);
  });

  it('calls doc.save with correct filename', async () => {
    const svg = createMockSvgElement();

    await exportPdf(svg, 'My Great Score');

    expect(mockDoc.save).toHaveBeenCalledWith('My_Great_Score.pdf');
  });

  it('handles empty title by using "score" as default filename', async () => {
    const svg = createMockSvgElement();

    await exportPdf(svg, '');

    expect(mockDoc.save).toHaveBeenCalledWith('score.pdf');
  });

  it('sanitizes special characters in filename', async () => {
    const svg = createMockSvgElement();

    await exportPdf(svg, 'Score #1 (draft)');

    expect(mockDoc.save).toHaveBeenCalledWith('Score__1__draft_.pdf');
  });

  it('sanitizes slashes and dots in filename', async () => {
    const svg = createMockSvgElement();

    await exportPdf(svg, 'path/to.file');

    expect(mockDoc.save).toHaveBeenCalledWith('path_to_file.pdf');
  });

  it('handles whitespace-only title as empty', async () => {
    const svg = createMockSvgElement();

    await exportPdf(svg, '   ');

    expect(mockDoc.text).toHaveBeenCalledWith(
      'Untitled Score',
      105,
      25,
      { align: 'center' },
    );
    expect(mockDoc.save).toHaveBeenCalledWith('score.pdf');
  });

  it('image width does not exceed content width', async () => {
    const svg = createMockSvgElement(800, 600);

    await exportPdf(svg, 'Test');

    const callArgs = mockDoc.addImage.mock.calls[0];
    const imgWidth = callArgs[4];
    // Content width = 210 - 2*15 = 180
    expect(imgWidth).toBeLessThanOrEqual(180);
    expect(imgWidth).toBeGreaterThan(0);
  });

  it('image height does not exceed available height', async () => {
    // Very tall SVG
    const svg = createMockSvgElement(800, 4000);

    await exportPdf(svg, 'Tall');

    const callArgs = mockDoc.addImage.mock.calls[0];
    const imgHeight = callArgs[5];
    // Available height = (297 - 2*15) - 20 = 247
    expect(imgHeight).toBeLessThanOrEqual(247);
    expect(imgHeight).toBeGreaterThan(0);
  });
});
