import { useCallback, useEffect, useState } from 'react';
import { AppThemeProvider } from './context/AppThemeContext';
import { useChartLibrary } from './hooks/useChartLibrary';
import { createInitialEdges, createInitialNodes } from './flow/defaultGraph';
import { serializeFlowchart } from './flow/serializeFlowchart';
import {
  chartFlowDirection,
  persistedToFlowEdges,
  persistedToFlowNodes,
} from './storage/chartLibrary';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';
import { MermaidPreviewPage } from './pages/MermaidPreviewPage';
import type { FlowchartDirection, FlowEdge, FlowNode } from './flow/types';

export default function App() {
  return (
    <AppThemeProvider>
      <AppShell />
    </AppThemeProvider>
  );
}

function AppShell() {
  const {
    charts,
    createChart,
    updateChartGraph,
    renameChart,
    deleteChart,
    getChart,
  } = useChartLibrary();

  const [view, setView] = useState<'dashboard' | 'editor' | 'mermaidPreview'>('dashboard');
  const [activeChartId, setActiveChartId] = useState<string | null>(null);
  const [mermaidPreviewSource, setMermaidPreviewSource] = useState<string | null>(null);
  const [previewReturnView, setPreviewReturnView] = useState<'dashboard' | 'editor'>('editor');

  const activeChart = activeChartId ? getChart(activeChartId) : undefined;

  useEffect(() => {
    if ((view === 'editor' || view === 'mermaidPreview') && activeChartId && !getChart(activeChartId)) {
      setView('dashboard');
      setActiveChartId(null);
      setMermaidPreviewSource(null);
    }
  }, [view, activeChartId, charts, getChart]);

  const onSaveGraph = useCallback(
    (nodes: FlowNode[], edges: FlowEdge[], flowDirection: FlowchartDirection) => {
      if (activeChartId) {
        updateChartGraph(activeChartId, nodes, edges, flowDirection);
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

  const handleOpenChart = useCallback(
    (id: string) => {
      const chart = getChart(id);
      if (!chart) {
        return;
      }
      setActiveChartId(id);
      setMermaidPreviewSource(
        serializeFlowchart(
          persistedToFlowNodes(chart.nodes),
          persistedToFlowEdges(chart.edges),
          chartFlowDirection(chart)
        )
      );
      setPreviewReturnView('dashboard');
      setView('mermaidPreview');
    },
    [getChart]
  );

  const handleEditChart = useCallback((id: string) => {
    setActiveChartId(id);
    setMermaidPreviewSource(null);
    setView('editor');
  }, []);

  const handleBackFromEditor = useCallback(() => {
    setMermaidPreviewSource(null);
    setView('dashboard');
    setActiveChartId(null);
  }, []);

  const handleBackFromMermaidPreview = useCallback(() => {
    setMermaidPreviewSource(null);
    setView(previewReturnView);
    if (previewReturnView === 'dashboard') {
      setActiveChartId(null);
    }
  }, [previewReturnView]);

  const handleOpenMermaidPreview = useCallback((mermaidSource: string) => {
    setMermaidPreviewSource(mermaidSource);
    setPreviewReturnView('editor');
    setView('mermaidPreview');
  }, []);

  if (view === 'mermaidPreview' && activeChart) {
    const previewSource =
      mermaidPreviewSource ??
      serializeFlowchart(
        persistedToFlowNodes(activeChart.nodes),
        persistedToFlowEdges(activeChart.edges),
        chartFlowDirection(activeChart)
      );
    return (
      <MermaidPreviewPage
        key={`preview-${activeChart.id}`}
        chart={activeChart}
        source={previewSource}
        backLabel={previewReturnView === 'dashboard' ? '← Charts' : '← Editor'}
        onBack={handleBackFromMermaidPreview}
      />
    );
  }

  if (view === 'editor' && activeChart) {
    return (
      <EditorPage
        key={activeChart.id}
        chart={activeChart}
        onBack={handleBackFromEditor}
        onSaveGraph={onSaveGraph}
        onOpenMermaidPreview={handleOpenMermaidPreview}
      />
    );
  }

  return (
    <DashboardPage
      charts={charts}
      onCreateChart={handleCreateChart}
      onOpenChart={handleOpenChart}
      onEditChart={handleEditChart}
      onRenameChart={renameChart}
      onDeleteChart={(id) => {
        deleteChart(id);
        if (activeChartId === id) {
          setActiveChartId(null);
          setMermaidPreviewSource(null);
          setView('dashboard');
        }
      }}
    />
  );
}
