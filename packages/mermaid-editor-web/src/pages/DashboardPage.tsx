import { ChartThumbnail } from '../components/ChartThumbnail';
import { ThemeToggleButton } from '../components/ThemeToggleButton';
import { useAppTheme } from '../context/AppThemeContext';
import {
  chartFlowDirection,
  persistedToFlowEdges,
  persistedToFlowNodes,
  type ChartRecord,
} from '../storage/chartLibrary';

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) {
    return 'just now';
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return `${min}m ago`;
  }
  const hr = Math.floor(min / 60);
  if (hr < 48) {
    return `${hr}h ago`;
  }
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

type DashboardPageProps = {
  charts: ChartRecord[];
  onCreateChart: () => void;
  onOpenChart: (id: string) => void;
  onEditChart: (id: string) => void;
  onRenameChart: (id: string, name: string) => void;
  onDeleteChart: (id: string) => void;
};

export function DashboardPage({
  charts,
  onCreateChart,
  onOpenChart,
  onEditChart,
  onRenameChart,
  onDeleteChart,
}: DashboardPageProps) {
  const { theme, toggleTheme } = useAppTheme();

  return (
    <div className="app-root app-root--dashboard">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__wordmark">
            <span className="app-header__wordmark-accent">MERMAID</span>
            <span className="app-header__wordmark-rest">EDITOR</span>
          </span>
          <span className="app-header__tag">WEB</span>
        </div>
        <div className="app-header__right">
          <div className="app-header__actions">
            <ThemeToggleButton theme={theme} onToggle={toggleTheme} />
            <button type="button" className="app-header__btn-accent" onClick={onCreateChart}>
              Create chart
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-main__head">
          <h1 className="dashboard-main__title">Charts</h1>
          <p className="dashboard-main__subtitle">Stored in this browser (localStorage).</p>
        </div>

        {charts.length === 0 ? (
          <div className="dashboard-empty">
            <p className="dashboard-empty__text">No charts yet.</p>
            <button type="button" className="app-header__btn-accent" onClick={onCreateChart}>
              Create your first chart
            </button>
          </div>
        ) : (
          <ul className="dashboard-grid">
            {charts.map((chart) => (
              <li key={chart.id} className="dashboard-card">
                <button
                  type="button"
                  className="dashboard-card__preview"
                  onClick={() => onOpenChart(chart.id)}
                  aria-label={`Preview chart ${chart.name}`}
                >
                  <ChartThumbnail
                    nodes={persistedToFlowNodes(chart.nodes)}
                    edges={persistedToFlowEdges(chart.edges)}
                    flowDirection={chartFlowDirection(chart)}
                  />
                </button>
                <div className="dashboard-card__body">
                  <div className="dashboard-card__title-row">
                    <span className="dashboard-card__name" title={chart.name}>
                      {chart.name}
                    </span>
                    <span className="dashboard-card__time tabular-nums">
                      {formatRelativeTime(chart.updatedAt)}
                    </span>
                  </div>
                  <div className="dashboard-card__actions">
                    <button type="button" onClick={() => onOpenChart(chart.id)}>
                      Open
                    </button>
                    <button type="button" onClick={() => onEditChart(chart.id)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = window.prompt('Rename chart', chart.name);
                        if (next !== null) {
                          onRenameChart(chart.id, next);
                        }
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className="dashboard-card__btn-danger"
                      onClick={() => {
                        if (window.confirm(`Delete “${chart.name}”? This cannot be undone.`)) {
                          onDeleteChart(chart.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="app-statusbar">
        <span>
          <span className="app-statusbar__dot" aria-hidden="true">
            ●
          </span>{' '}
          LIBRARY
        </span>
        <span className="tabular-nums">{charts.length} CHART{charts.length === 1 ? '' : 'S'}</span>
      </footer>
    </div>
  );
}
