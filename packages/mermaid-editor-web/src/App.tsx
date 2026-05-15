import { useCallback, useEffect, useState } from 'react';
import { useChartLibrary } from './hooks/useChartLibrary';
import { createInitialEdges, createInitialNodes } from './flow/defaultGraph';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import type { FlowEdge, FlowNode } from './flow/types';

export default function App() {
  const {
    charts,
    createChart,
    updateChartGraph,
    renameChart,
    deleteChart,
    getChart,
  } = useChartLibrary();

  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [activeChartId, setActiveChartId] = useState<string | null>(null);

  const activeChart = activeChartId ? getChart(activeChartId) : undefined;

  useEffect(() => {
    if (view === 'editor' && activeChartId && !getChart(activeChartId)) {
      setView('dashboard');
      setActiveChartId(null);
    }
  }, [view, activeChartId, charts, getChart]);

  const onSaveGraph = useCallback(
    (nodes: FlowNode[], edges: FlowEdge[]) => {
      if (activeChartId) {
        updateChartGraph(activeChartId, nodes, edges);
      }
    },
    [activeChartId, updateChartGraph]
  );

  const handleCreateChart = useCallback(() => {
    const record = createChart({
      name: 'Untitled diagram',
      nodes: createInitialNodes(),
      edges: createInitialEdges(),
    });
    setActiveChartId(record.id);
    setView('editor');
  }, [createChart]);

  const handleOpenChart = useCallback((id: string) => {
    setActiveChartId(id);
    setView('editor');
  }, []);

  const handleBackFromEditor = useCallback(() => {
    setView('dashboard');
    setActiveChartId(null);
  }, []);

  if (view === 'editor' && activeChart) {
    return (
      <EditorPage
        key={activeChart.id}
        chart={activeChart}
        onBack={handleBackFromEditor}
        onSaveGraph={onSaveGraph}
      />
    );
  }

  return (
    <DashboardPage
      charts={charts}
      onCreateChart={handleCreateChart}
      onOpenChart={handleOpenChart}
      onRenameChart={renameChart}
      onDeleteChart={(id) => {
        deleteChart(id);
        if (activeChartId === id) {
          setActiveChartId(null);
          setView('dashboard');
        }
      }}
    />
  );
}
