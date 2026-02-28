/**
 * ULWILA Color Score Editor - Image Export Tests
 *
 * Unit tests for PNG and SVG export functionality.
 * Mocks browser DOM APIs (XMLSerializer, URL, canvas, Image) since
 * we run under jsdom which lacks full rendering support.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportSvg, exportPng } from '../imageExport';

// ---------------------------------------------------------------------------
// Helpers — build a minimal mock SVGSVGElement
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
// Shared mocks
// ---------------------------------------------------------------------------

let appendedChildren: Node[];
let removedChildren: Node[];
let revokedUrls: string[];

beforeEach(() => {
  appendedChildren = [];
  removedChildren = [];
  revokedUrls = [];

  // URL.createObjectURL / revokeObjectURL
  vi.stubGlobal(
    'URL',
    Object.assign({}, URL, {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn((url: string) => {
        revokedUrls.push(url);
      }),
    }),
  );

  // Spy on document.body.appendChild / removeChild / createElement('a')
  vi.spyOn(document.body, 'appendChild').mockImplementation((node: Node) => {
    appendedChildren.push(node);
    return node;
  });
  vi.spyOn(document.body, 'removeChild').mockImplementation((node: Node) => {
    removedChildren.push(node);
    return node;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ===========================================================================
// exportSvg
// ===========================================================================

describe('exportSvg', () => {
  it('serializes the SVG element and triggers a download', () => {
    const svg = createMockSvgElement();
    const clickSpy = vi.fn();

    // Intercept the anchor element created by triggerDownload
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    exportSvg(svg, 'My Score');

    // XMLSerializer should have been invoked (jsdom has it natively)
    expect(URL.createObjectURL).toHaveBeenCalled();

    // The Blob passed to createObjectURL should have correct MIME
    const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Blob;
    expect(blobArg.type).toBe('image/svg+xml;charset=utf-8');

    // Anchor click should have fired
    expect(clickSpy).toHaveBeenCalledOnce();

    // Anchor should have been appended then removed
    expect(appendedChildren).toHaveLength(1);
    expect(removedChildren).toHaveLength(1);

    // URL should have been revoked after download
    expect(revokedUrls).toContain('blob:mock-url');
  });

  it('uses the correct MIME type for SVG', () => {
    const svg = createMockSvgElement();
    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') el.click = vi.fn();
      return el;
    });

    exportSvg(svg, 'test');

    const blobArg = (URL.createObjectURL as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Blob;
    expect(blobArg.type).toBe('image/svg+xml;charset=utf-8');
  });

  it('generates correct filename from title', () => {
    const svg = createMockSvgElement();
    let capturedDownload = '';

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        el.click = vi.fn();
        // Capture the download attribute after it is set
        const origSet = Object.getOwnPropertyDescriptor(
          HTMLAnchorElement.prototype,
          'download',
        )?.set;
        Object.defineProperty(el, 'download', {
          set(v: string) {
            capturedDownload = v;
            origSet?.call(this, v);
          },
          get() {
            return capturedDownload;
          },
        });
      }
      return el;
    });

    exportSvg(svg, 'My Cool Score!');

    expect(capturedDownload).toBe('My_Cool_Score_.svg');
  });

  it('handles empty title by using "score" as default filename', () => {
    const svg = createMockSvgElement();
    let capturedDownload = '';

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        el.click = vi.fn();
        const origSet = Object.getOwnPropertyDescriptor(
          HTMLAnchorElement.prototype,
          'download',
        )?.set;
        Object.defineProperty(el, 'download', {
          set(v: string) {
            capturedDownload = v;
            origSet?.call(this, v);
          },
          get() {
            return capturedDownload;
          },
        });
      }
      return el;
    });

    exportSvg(svg, '');

    expect(capturedDownload).toBe('score.svg');
  });

  it('sanitizes special characters in title', () => {
    const svg = createMockSvgElement();
    let capturedDownload = '';

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === 'a') {
        el.click = vi.fn();
        const origSet = Object.getOwnPropertyDescriptor(
          HTMLAnchorElement.prototype,
          'download',
        )?.set;
        Object.defineProperty(el, 'download', {
          set(v: string) {
            capturedDownload = v;
            origSet?.call(this, v);
          },
          get() {
            return capturedDownload;
          },
        });
      }
      return el;
    });

    exportSvg(svg, 'Score #1 (draft)');

    expect(capturedDownload).toBe('Score__1__draft_.svg');
  });
});

// ===========================================================================
// exportPng
// ===========================================================================

describe('exportPng', () => {
  it('creates canvas at 2x resolution', async () => {
    const svg = createMockSvgElement(400, 300);

    // We need to capture the canvas dimensions and mock the Image load flow.
    let capturedCanvasWidth = 0;
    let capturedCanvasHeight = 0;

    const mockCtx = {
      scale: vi.fn(),
      drawImage: vi.fn(),
    };

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        if (tag === 'canvas') {
          const canvas = origCreateElement(tag, options);
          // Intercept width/height setters
          let w = 0;
          let h = 0;
          Object.defineProperty(canvas, 'width', {
            get: () => w,
            set: (v: number) => {
              w = v;
              capturedCanvasWidth = v;
            },
          });
          Object.defineProperty(canvas, 'height', {
            get: () => h,
            set: (v: number) => {
              h = v;
              capturedCanvasHeight = v;
            },
          });
          (canvas as HTMLCanvasElement).getContext = vi.fn(() => mockCtx) as unknown as typeof canvas.getContext;
          (canvas as HTMLCanvasElement).toBlob = vi.fn(
            (cb: BlobCallback, _type?: string) => {
              cb(new Blob(['png-data'], { type: 'image/png' }));
            },
          );
          return canvas;
        }
        if (tag === 'a') {
          const a = origCreateElement(tag, options);
          a.click = vi.fn();
          return a;
        }
        return origCreateElement(tag, options);
      },
    );

    // Mock Image constructor so we can control onload
    const originalImage = globalThis.Image;
    let imgInstance: { src: string; onload: (() => void) | null; onerror: (() => void) | null };
    vi.stubGlobal(
      'Image',
      vi.fn(() => {
        imgInstance = { src: '', onload: null, onerror: null };
        // Fire onload when src is set
        Object.defineProperty(imgInstance, 'src', {
          set(_v: string) {
            // Simulate async image load
            setTimeout(() => imgInstance.onload?.(), 0);
          },
          get() {
            return '';
          },
        });
        return imgInstance;
      }),
    );

    await exportPng(svg, 'Test');

    // Canvas should be 2x the SVG dimensions
    expect(capturedCanvasWidth).toBe(800);  // 400 * 2
    expect(capturedCanvasHeight).toBe(600); // 300 * 2

    // Context should have been scaled 2x
    expect(mockCtx.scale).toHaveBeenCalledWith(2, 2);
    expect(mockCtx.drawImage).toHaveBeenCalled();

    globalThis.Image = originalImage;
  });

  it('triggers PNG download with correct filename', async () => {
    const svg = createMockSvgElement(100, 100);
    let capturedDownload = '';

    const mockCtx = {
      scale: vi.fn(),
      drawImage: vi.fn(),
    };

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        if (tag === 'canvas') {
          const canvas = origCreateElement(tag, options);
          (canvas as HTMLCanvasElement).getContext = vi.fn(() => mockCtx) as unknown as typeof canvas.getContext;
          (canvas as HTMLCanvasElement).toBlob = vi.fn(
            (cb: BlobCallback, _type?: string) => {
              cb(new Blob(['png'], { type: 'image/png' }));
            },
          );
          return canvas;
        }
        if (tag === 'a') {
          const a = origCreateElement(tag, options);
          a.click = vi.fn();
          const origSet = Object.getOwnPropertyDescriptor(
            HTMLAnchorElement.prototype,
            'download',
          )?.set;
          Object.defineProperty(a, 'download', {
            set(v: string) {
              capturedDownload = v;
              origSet?.call(this, v);
            },
            get() {
              return capturedDownload;
            },
          });
          return a;
        }
        return origCreateElement(tag, options);
      },
    );

    vi.stubGlobal(
      'Image',
      vi.fn(() => {
        const inst = { src: '', onload: null as (() => void) | null, onerror: null as (() => void) | null };
        Object.defineProperty(inst, 'src', {
          set() {
            setTimeout(() => inst.onload?.(), 0);
          },
          get() {
            return '';
          },
        });
        return inst;
      }),
    );

    await exportPng(svg, 'My PNG Score');

    expect(capturedDownload).toBe('My_PNG_Score.png');
  });

  it('handles empty title for PNG export', async () => {
    const svg = createMockSvgElement(100, 100);
    let capturedDownload = '';

    const mockCtx = {
      scale: vi.fn(),
      drawImage: vi.fn(),
    };

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        if (tag === 'canvas') {
          const canvas = origCreateElement(tag, options);
          (canvas as HTMLCanvasElement).getContext = vi.fn(() => mockCtx) as unknown as typeof canvas.getContext;
          (canvas as HTMLCanvasElement).toBlob = vi.fn(
            (cb: BlobCallback, _type?: string) => {
              cb(new Blob(['png'], { type: 'image/png' }));
            },
          );
          return canvas;
        }
        if (tag === 'a') {
          const a = origCreateElement(tag, options);
          a.click = vi.fn();
          const origSet = Object.getOwnPropertyDescriptor(
            HTMLAnchorElement.prototype,
            'download',
          )?.set;
          Object.defineProperty(a, 'download', {
            set(v: string) {
              capturedDownload = v;
              origSet?.call(this, v);
            },
            get() {
              return capturedDownload;
            },
          });
          return a;
        }
        return origCreateElement(tag, options);
      },
    );

    vi.stubGlobal(
      'Image',
      vi.fn(() => {
        const inst = { src: '', onload: null as (() => void) | null, onerror: null as (() => void) | null };
        Object.defineProperty(inst, 'src', {
          set() {
            setTimeout(() => inst.onload?.(), 0);
          },
          get() {
            return '';
          },
        });
        return inst;
      }),
    );

    await exportPng(svg, '');

    expect(capturedDownload).toBe('score.png');
  });

  it('rejects when canvas context is unavailable', async () => {
    const svg = createMockSvgElement(100, 100);

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        if (tag === 'canvas') {
          const canvas = origCreateElement(tag, options);
          // Return null context to trigger error path
          (canvas as HTMLCanvasElement).getContext = vi.fn(() => null) as unknown as typeof canvas.getContext;
          return canvas;
        }
        if (tag === 'a') {
          const a = origCreateElement(tag, options);
          a.click = vi.fn();
          return a;
        }
        return origCreateElement(tag, options);
      },
    );

    vi.stubGlobal(
      'Image',
      vi.fn(() => {
        const inst = { src: '', onload: null as (() => void) | null, onerror: null as (() => void) | null };
        Object.defineProperty(inst, 'src', {
          set() {
            setTimeout(() => inst.onload?.(), 0);
          },
          get() {
            return '';
          },
        });
        return inst;
      }),
    );

    await expect(exportPng(svg, 'test')).rejects.toThrow(
      'Canvas context unavailable',
    );
  });

  it('rejects when image fails to load', async () => {
    const svg = createMockSvgElement(100, 100);

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        if (tag === 'canvas') {
          const canvas = origCreateElement(tag, options);
          (canvas as HTMLCanvasElement).getContext = vi.fn(() => ({
            scale: vi.fn(),
            drawImage: vi.fn(),
          })) as unknown as typeof canvas.getContext;
          return canvas;
        }
        if (tag === 'a') {
          const a = origCreateElement(tag, options);
          a.click = vi.fn();
          return a;
        }
        return origCreateElement(tag, options);
      },
    );

    // Make Image fire onerror instead of onload
    vi.stubGlobal(
      'Image',
      vi.fn(() => {
        const inst = { src: '', onload: null as (() => void) | null, onerror: null as (() => void) | null };
        Object.defineProperty(inst, 'src', {
          set() {
            setTimeout(() => inst.onerror?.(), 0);
          },
          get() {
            return '';
          },
        });
        return inst;
      }),
    );

    await expect(exportPng(svg, 'test')).rejects.toThrow(
      'SVG rendering failed',
    );
  });

  it('rejects when toBlob returns null', async () => {
    const svg = createMockSvgElement(100, 100);

    const mockCtx = {
      scale: vi.fn(),
      drawImage: vi.fn(),
    };

    const origCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(
      (tag: string, options?: ElementCreationOptions) => {
        if (tag === 'canvas') {
          const canvas = origCreateElement(tag, options);
          (canvas as HTMLCanvasElement).getContext = vi.fn(() => mockCtx) as unknown as typeof canvas.getContext;
          // toBlob returns null to simulate failure
          (canvas as HTMLCanvasElement).toBlob = vi.fn(
            (cb: BlobCallback) => {
              cb(null);
            },
          );
          return canvas;
        }
        if (tag === 'a') {
          const a = origCreateElement(tag, options);
          a.click = vi.fn();
          return a;
        }
        return origCreateElement(tag, options);
      },
    );

    vi.stubGlobal(
      'Image',
      vi.fn(() => {
        const inst = { src: '', onload: null as (() => void) | null, onerror: null as (() => void) | null };
        Object.defineProperty(inst, 'src', {
          set() {
            setTimeout(() => inst.onload?.(), 0);
          },
          get() {
            return '';
          },
        });
        return inst;
      }),
    );

    await expect(exportPng(svg, 'test')).rejects.toThrow(
      'PNG conversion failed',
    );
  });
});
