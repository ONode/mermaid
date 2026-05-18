import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MermaidPreviewPanel,
  type MermaidPreviewPanelHandle,
} from '../components/MermaidPreviewPanel';
import type { ChartRecord } from '../storage/chartLibrary';
import {
  copyMermaidSource,
  exportMmdFile,
  exportPdfFile,
  exportPngFile,
  exportSvgFile,
  findRenderedSvg,
  previewExportBackground,
  sanitizeExportBaseName,
} from '../utils/mermaidPreviewExport';

export type MermaidPreviewPageProps = {
  chart: ChartRecord;
  /** Mermaid source to render (typically live from the editor). */
  source: string;
  backLabel?: string;
  onBack: () => void;
};

/**
 * Full-page Mermaid render for the current chart.
 */
export function MermaidPreviewPage({
  chart,
  source,
  backLabel = '← Editor',
  onBack,
}: MermaidPreviewPageProps) {
  const previewRef = useRef<MermaidPreviewPanelHandle | null>(null);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  const exportBaseName = sanitizeExportBaseName(chart.name);

  const getRenderedSvg = useCallback(() => {
    const container = previewRef.current?.getPreviewContainer();
    if (!container) {
      return null;
    }
    return findRenderedSvg(container);
  }, []);

  useEffect(() => {
    if (!exportMenuOpen) {
      return;
    }
    const onDocPointerDown = (e: PointerEvent) => {
      const el = exportMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
    };
  }, [exportMenuOpen]);

  useEffect(() => {
    if (!exportMenuOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExportMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [exportMenuOpen]);

  const runSvgExport = useCallback(
    (action: (svg: SVGSVGElement, filename: string, bg: string) => void | Promise<void>) => {
      const svg = getRenderedSvg();
      if (!svg) {
        window.alert('Nothing to export yet. Fix any render errors and try again.');
        return;
      }
      const bg = previewExportBackground();
      void Promise.resolve(action(svg, `${exportBaseName}.svg`, bg)).catch((err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        window.alert(message);
      });
    },
    [exportBaseName, getRenderedSvg]
  );

  const onExportPdf = useCallback(() => {
    setExportMenuOpen(false);
    const svg = getRenderedSvg();
    if (!svg) {
      window.alert('Nothing to export yet. Fix any render errors and try again.');
      return;
    }
    const bg = previewExportBackground();
    void exportPdfFile(svg, `${exportBaseName}.pdf`, bg).catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      window.alert(message);
    });
  }, [exportBaseName, getRenderedSvg]);

  const onExportSvg = useCallback(() => {
    setExportMenuOpen(false);
    runSvgExport((svg) => {
      exportSvgFile(svg, `${exportBaseName}.svg`);
    });
  }, [exportBaseName, runSvgExport]);

  const onExportPng = useCallback(() => {
    setExportMenuOpen(false);
    runSvgExport((svg, _filename, bg) => exportPngFile(svg, `${exportBaseName}.png`, bg));
  }, [exportBaseName, runSvgExport]);

  const onExportMmd = useCallback(() => {
    setExportMenuOpen(false);
    exportMmdFile(source, `${exportBaseName}.mmd`);
  }, [exportBaseName, source]);

  const onCopyCode = useCallback(() => {
    setExportMenuOpen(false);
    void copyMermaidSource(source);
  }, [source]);

  return (
    <div className="app-root app-root--mermaid-preview-page">
      <header className="app-header">
        <div className="app-header__brand">
          <button type="button" className="app-header__back" onClick={onBack}>
            {backLabel}
          </button>
          <span className="app-header__sep" aria-hidden="true">
            |
          </span>
          <span className="app-header__wordmark">
            <span className="app-header__wordmark-accent">MERMAID</span>
            <span className="app-header__wordmark-rest">PREVIEW</span>
          </span>
          <span className="app-header__tag">WEB</span>
          <span className="app-header__chart-name" title={chart.name}>
            {chart.name}
          </span>
        </div>
        <div className="app-header__right">
          <div className="app-header__actions">
            <div className="app-header__add-node" ref={exportMenuRef}>
              <button
                type="button"
                className={`app-header__add-node-toggle${exportMenuOpen ? ' app-header__add-node-toggle--open' : ''}`}
                aria-expanded={exportMenuOpen}
                aria-haspopup="menu"
                aria-controls="mermaid-preview-export-menu"
                onClick={() => setExportMenuOpen((o) => !o)}
              >
                Export <span aria-hidden="true">▾</span>
              </button>
              {exportMenuOpen ? (
                <div
                  id="mermaid-preview-export-menu"
                  className="app-header__add-node-menu app-header__add-node-menu--align-end"
                  role="menu"
                  aria-label="Export diagram"
                >
                  <button
                    type="button"
                    className="app-header__add-node-menuitem"
                    role="menuitem"
                    onClick={onExportPdf}
                  >
                    Export PDF
                  </button>
                  <button
                    type="button"
                    className="app-header__add-node-menuitem"
                    role="menuitem"
                    onClick={onExportSvg}
                  >
                    Export SVG
                  </button>
                  <button
                    type="button"
                    className="app-header__add-node-menuitem"
                    role="menuitem"
                    onClick={onExportPng}
                  >
                    Export PNG
                  </button>
                  <button
                    type="button"
                    className="app-header__add-node-menuitem"
                    role="menuitem"
                    onClick={onExportMmd}
                  >
                    Export MMD
                  </button>
                  <button
                    type="button"
                    className="app-header__add-node-menuitem"
                    role="menuitem"
                    onClick={onCopyCode}
                  >
                    Copy code
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mermaid-preview-page">
        <MermaidPreviewPanel
          ref={previewRef}
          source={source}
          className="mermaid-preview-page__panel"
        />
      </main>

      <footer className="app-statusbar">
        <span>
          <span className="app-statusbar__dot" aria-hidden="true">
            ●
          </span>{' '}
          MERMAID_RENDER
        </span>
        <span className="tabular-nums">MODE: PREVIEW</span>
      </footer>
    </div>
  );
}
