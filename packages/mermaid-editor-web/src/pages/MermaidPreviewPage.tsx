import { MermaidPreviewPanel } from '../components/MermaidPreviewPanel';
import type { ChartRecord } from '../storage/chartLibrary';

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
      </header>

      <main className="mermaid-preview-page">
        <MermaidPreviewPanel source={source} className="mermaid-preview-page__panel" />
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
