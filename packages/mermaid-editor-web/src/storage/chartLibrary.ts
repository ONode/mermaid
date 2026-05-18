import { applyFlowEdgeStyle } from '../flow/edgeStyle';
import type {
  FlowchartDirection,
  FlowEdge,
  FlowEdgeData,
  FlowEdgeLineStyle,
  FlowEdgePathType,
  FlowNode,
  FlowNodeData,
} from '../flow/types';

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
  pathType?: FlowEdgePathType;
  lineStyle?: FlowEdgeLineStyle;
  strokeColor?: string;
  arrowStart?: boolean;
  arrowEnd?: boolean;
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

const SHAPES = new Set(['rect', 'stadium', 'cylinder', 'diamond', 'circle']);
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
  if (v.pathType !== undefined && typeof v.pathType !== 'string') {
    return false;
  }
  if (v.lineStyle !== undefined && typeof v.lineStyle !== 'string') {
    return false;
  }
  if (v.strokeColor !== undefined && typeof v.strokeColor !== 'string') {
    return false;
  }
  if (v.arrowStart !== undefined && typeof v.arrowStart !== 'boolean') {
    return false;
  }
  if (v.arrowEnd !== undefined && typeof v.arrowEnd !== 'boolean') {
    return false;
  }
  return true;
}

function persistedEdgeData(e: PersistedEdge): FlowEdgeData | undefined {
  const data: FlowEdgeData = {};
  if (e.pathType !== undefined) {
    data.pathType = e.pathType;
  }
  if (e.lineStyle !== undefined) {
    data.lineStyle = e.lineStyle;
  }
  if (e.strokeColor !== undefined) {
    data.strokeColor = e.strokeColor;
  }
  if (e.arrowStart !== undefined) {
    data.arrowStart = e.arrowStart;
  }
  if (e.arrowEnd !== undefined) {
    data.arrowEnd = e.arrowEnd;
  }
  return Object.keys(data).length > 0 ? data : undefined;
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
  const d = e.data;
  if (d?.pathType !== undefined) {
    edge.pathType = d.pathType;
  }
  if (d?.lineStyle !== undefined) {
    edge.lineStyle = d.lineStyle;
  }
  if (typeof d?.strokeColor === 'string' && d.strokeColor.length > 0) {
    edge.strokeColor = d.strokeColor;
  }
  if (d?.arrowStart !== undefined) {
    edge.arrowStart = d.arrowStart;
  }
  if (d?.arrowEnd !== undefined) {
    edge.arrowEnd = d.arrowEnd;
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
    const data = persistedEdgeData(e);
    return applyFlowEdgeStyle({
      id: e.id,
      source: e.source,
      target: e.target,
      ...(e.label !== undefined ? { label: e.label } : {}),
      ...(data !== undefined ? { data } : {}),
    });
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
