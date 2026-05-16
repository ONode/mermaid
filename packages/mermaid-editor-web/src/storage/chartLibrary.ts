import type { FlowchartDirection, FlowEdge, FlowNode, FlowNodeData } from '../flow/types';

export const CHART_LIBRARY_STORAGE_KEY = 'mermaid-editor-web:charts';

export const CHART_LIBRARY_VERSION = 1 as const;

export type PersistedNode = {
  id: string;
  type: 'flow';
  position: { x: number; y: number };
  data: FlowNodeData;
};

export type PersistedEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type ChartRecord = {
  id: string;
  name: string;
  updatedAt: number;
  /** Mermaid `flowchart …` direction; omitted in older saves defaults to `TD`. */
  flowDirection?: FlowchartDirection;
  nodes: PersistedNode[];
  edges: PersistedEdge[];
};

export type ChartLibraryFile = {
  version: typeof CHART_LIBRARY_VERSION;
  charts: ChartRecord[];
};

const SHAPES = new Set(['rect', 'stadium', 'diamond', 'circle']);
const FLOW_DIRECTIONS = new Set<FlowchartDirection>(['TD', 'LR', 'RL', 'TB', 'BT']);

export function chartFlowDirection(chart: ChartRecord): FlowchartDirection {
  const d = chart.flowDirection;
  return d !== undefined && FLOW_DIRECTIONS.has(d) ? d : 'TD';
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function isFlowNodeData(v: unknown): v is FlowNodeData {
  if (!isRecord(v)) {
    return false;
  }
  const label = v.label;
  const shape = v.shape;
  if (typeof label !== 'string' || typeof shape !== 'string' || !SHAPES.has(shape)) {
    return false;
  }
  if ('backgroundColor' in v && v.backgroundColor != null && typeof v.backgroundColor !== 'string') {
    return false;
  }
  return true;
}

function isPersistedNode(v: unknown): v is PersistedNode {
  if (!isRecord(v)) {
    return false;
  }
  if (typeof v.id !== 'string' || v.type !== 'flow') {
    return false;
  }
  const pos = v.position;
  if (!isRecord(pos) || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
    return false;
  }
  return isFlowNodeData(v.data);
}

function isPersistedEdge(v: unknown): v is PersistedEdge {
  if (!isRecord(v)) {
    return false;
  }
  if (
    typeof v.id !== 'string' ||
    typeof v.source !== 'string' ||
    typeof v.target !== 'string'
  ) {
    return false;
  }
  if (v.label !== undefined && typeof v.label !== 'string') {
    return false;
  }
  return true;
}

function isChartRecord(v: unknown): v is ChartRecord {
  if (!isRecord(v)) {
    return false;
  }
  if (typeof v.id !== 'string' || typeof v.name !== 'string' || typeof v.updatedAt !== 'number') {
    return false;
  }
  if (!Array.isArray(v.nodes) || !Array.isArray(v.edges)) {
    return false;
  }
  if (
    v.flowDirection !== undefined &&
    (typeof v.flowDirection !== 'string' || !FLOW_DIRECTIONS.has(v.flowDirection as FlowchartDirection))
  ) {
    return false;
  }
  return v.nodes.every(isPersistedNode) && v.edges.every(isPersistedEdge);
}

export function generateChartId(): string {
  return crypto.randomUUID();
}

export function stripNodeForPersist(n: FlowNode): PersistedNode {
  return {
    id: n.id,
    type: 'flow',
    position: { ...n.position },
    data: { ...n.data },
  };
}

export function stripEdgeForPersist(e: FlowEdge): PersistedEdge {
  const edge: PersistedEdge = {
    id: e.id,
    source: e.source,
    target: e.target,
  };
  if (typeof e.label === 'string' && e.label.length > 0) {
    edge.label = e.label;
  }
  return edge;
}

export function persistedToFlowNodes(nodes: PersistedNode[]): FlowNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: 'flow',
    position: { ...n.position },
    data: { ...n.data },
  }));
}

export function persistedToFlowEdges(edges: PersistedEdge[]): FlowEdge[] {
  return edges.map((e) => {
    const edge: FlowEdge = {
      id: e.id,
      source: e.source,
      target: e.target,
    };
    if (e.label !== undefined) {
      edge.label = e.label;
    }
    return edge;
  });
}

function emptyLibrary(): ChartLibraryFile {
  return { version: CHART_LIBRARY_VERSION, charts: [] };
}

export function loadLibrary(): ChartLibraryFile {
  if (typeof localStorage === 'undefined') {
    return emptyLibrary();
  }
  try {
    const raw = localStorage.getItem(CHART_LIBRARY_STORAGE_KEY);
    if (!raw || raw.trim() === '') {
      return emptyLibrary();
    }
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) {
      return emptyLibrary();
    }
    const version = parsed.version;
    if (version !== CHART_LIBRARY_VERSION) {
      return emptyLibrary();
    }
    const charts = parsed.charts;
    if (!Array.isArray(charts) || !charts.every(isChartRecord)) {
      return emptyLibrary();
    }
    return { version: CHART_LIBRARY_VERSION, charts };
  } catch {
    return emptyLibrary();
  }
}

export function saveLibrary(file: ChartLibraryFile): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(CHART_LIBRARY_STORAGE_KEY, JSON.stringify(file));
  } catch {
    // ignore quota / private mode
  }
}
