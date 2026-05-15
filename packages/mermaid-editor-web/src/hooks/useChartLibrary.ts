import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CHART_LIBRARY_STORAGE_KEY,
  CHART_LIBRARY_VERSION,
  type ChartRecord,
  generateChartId,
  loadLibrary,
  persistedToFlowEdges,
  persistedToFlowNodes,
  saveLibrary,
  stripEdgeForPersist,
  stripNodeForPersist,
} from '../storage/chartLibrary';
import type { FlowEdge, FlowNode } from '../flow/types';

function sortChartsByUpdated(a: ChartRecord, b: ChartRecord): number {
  return b.updatedAt - a.updatedAt;
}

export function useChartLibrary() {
  const [charts, setCharts] = useState<ChartRecord[]>(() => loadLibrary().charts);

  const reloadFromStorage = useCallback(() => {
    setCharts(loadLibrary().charts);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CHART_LIBRARY_STORAGE_KEY) {
        reloadFromStorage();
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [reloadFromStorage]);

  const createChart = useCallback((input: {
    name: string;
    nodes: FlowNode[];
    edges: FlowEdge[];
  }): ChartRecord => {
    const now = Date.now();
    const record: ChartRecord = {
      id: generateChartId(),
      name: input.name,
      updatedAt: now,
      nodes: input.nodes.map(stripNodeForPersist),
      edges: input.edges.map(stripEdgeForPersist),
    };
    setCharts((prev) => {
      const next = [...prev, record].sort(sortChartsByUpdated);
      saveLibrary({ version: CHART_LIBRARY_VERSION, charts: next });
      return next;
    });
    return record;
  }, []);

  const updateChart = useCallback(
    (
      id: string,
      patch: Partial<Pick<ChartRecord, 'name' | 'nodes' | 'edges' | 'updatedAt'>>
    ): void => {
      setCharts((prev) => {
        const next = prev
          .map((c) => {
            if (c.id !== id) {
              return c;
            }
            return {
              ...c,
              ...patch,
              updatedAt: patch.updatedAt ?? Date.now(),
              ...(patch.nodes !== undefined
                ? { nodes: patch.nodes.map((n) => ({ ...n })) }
                : {}),
              ...(patch.edges !== undefined
                ? { edges: patch.edges.map((e) => ({ ...e })) }
                : {}),
            };
          })
          .sort(sortChartsByUpdated);
        saveLibrary({ version: CHART_LIBRARY_VERSION, charts: next });
        return next;
      });
    },
    []
  );

  const updateChartGraph = useCallback(
    (id: string, nodes: FlowNode[], edges: FlowEdge[]): void => {
      updateChart(id, {
        nodes: nodes.map(stripNodeForPersist),
        edges: edges.map(stripEdgeForPersist),
        updatedAt: Date.now(),
      });
    },
    [updateChart]
  );

  const renameChart = useCallback(
    (id: string, name: string): void => {
      const trimmed = name.trim();
      if (!trimmed) {
        return;
      }
      updateChart(id, { name: trimmed });
    },
    [updateChart]
  );

  const deleteChart = useCallback((id: string): void => {
    setCharts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveLibrary({ version: CHART_LIBRARY_VERSION, charts: next });
      return next;
    });
  }, []);

  const getChart = useCallback((id: string): ChartRecord | undefined => {
    return charts.find((c) => c.id === id);
  }, [charts]);

  const toFlowState = useCallback((record: ChartRecord) => {
    return {
      nodes: persistedToFlowNodes(record.nodes),
      edges: persistedToFlowEdges(record.edges),
    };
  }, []);

  const sortedCharts = useMemo(() => [...charts].sort(sortChartsByUpdated), [charts]);

  return {
    charts: sortedCharts,
    createChart,
    updateChart,
    updateChartGraph,
    renameChart,
    deleteChart,
    getChart,
    toFlowState,
    reloadFromStorage,
  };
}
