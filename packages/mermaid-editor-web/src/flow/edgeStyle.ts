import { MarkerType, type EdgeMarker } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type {
  FlowEdge,
  FlowEdgeArrowMode,
  FlowEdgeData,
  FlowEdgeLineStyle,
  FlowEdgePathType,
  FlowEdgeStrokeWeight,
} from './types';

const DEFAULT_PATH_TYPE: FlowEdgePathType = 'smoothstep';
const DEFAULT_LINE_STYLE: FlowEdgeLineStyle = 'solid';
const DEFAULT_STROKE_WEIGHT: FlowEdgeStrokeWeight = 'normal';
const DEFAULT_ARROW_END = true;
const DEFAULT_ARROW_START = false;

const ARROW_MARKER: EdgeMarker = {
  type: MarkerType.ArrowClosed,
  width: 18,
  height: 18,
};

export type ResolvedFlowEdgeData = {
  pathType: FlowEdgePathType;
  lineStyle: FlowEdgeLineStyle;
  strokeWeight: FlowEdgeStrokeWeight;
  strokeColor: string | null;
  arrowStart: boolean;
  arrowEnd: boolean;
};

export function arrowModeFromFlags(arrowStart: boolean, arrowEnd: boolean): FlowEdgeArrowMode {
  if (arrowStart && arrowEnd) {
    return 'both';
  }
  if (arrowStart) {
    return 'start';
  }
  if (arrowEnd) {
    return 'end';
  }
  return 'none';
}

export function flagsFromArrowMode(mode: FlowEdgeArrowMode): { arrowStart: boolean; arrowEnd: boolean } {
  switch (mode) {
    case 'both':
      return { arrowStart: true, arrowEnd: true };
    case 'start':
      return { arrowStart: true, arrowEnd: false };
    case 'end':
      return { arrowStart: false, arrowEnd: true };
    case 'none':
      return { arrowStart: false, arrowEnd: false };
  }
}

export function resolveFlowEdgeData(edge: FlowEdge): ResolvedFlowEdgeData {
  const d: FlowEdgeData = edge.data ?? {};
  return {
    pathType: d.pathType ?? DEFAULT_PATH_TYPE,
    lineStyle: d.lineStyle ?? DEFAULT_LINE_STYLE,
    strokeWeight: d.strokeWeight ?? DEFAULT_STROKE_WEIGHT,
    strokeColor: typeof d.strokeColor === 'string' && d.strokeColor.length > 0 ? d.strokeColor : null,
    arrowStart: d.arrowStart ?? DEFAULT_ARROW_START,
    arrowEnd: d.arrowEnd ?? DEFAULT_ARROW_END,
  };
}

function edgeStyleFromData(data: ResolvedFlowEdgeData): CSSProperties | undefined {
  const style: CSSProperties = {};
  if (data.strokeColor) {
    style.stroke = data.strokeColor;
  }
  if (data.lineStyle === 'dashed') {
    style.strokeDasharray = '6 4';
  }
  if (data.strokeWeight === 'thick') {
    style.strokeWidth = 2.5;
  }
  return Object.keys(style).length > 0 ? style : undefined;
}

function compactEdgeData(data: ResolvedFlowEdgeData): FlowEdgeData {
  const next: FlowEdgeData = {};
  if (data.pathType !== DEFAULT_PATH_TYPE) {
    next.pathType = data.pathType;
  }
  if (data.lineStyle !== DEFAULT_LINE_STYLE) {
    next.lineStyle = data.lineStyle;
  }
  if (data.strokeWeight !== DEFAULT_STROKE_WEIGHT) {
    next.strokeWeight = data.strokeWeight;
  }
  if (data.strokeColor) {
    next.strokeColor = data.strokeColor;
  }
  if (data.arrowStart !== DEFAULT_ARROW_START) {
    next.arrowStart = data.arrowStart;
  }
  if (data.arrowEnd !== DEFAULT_ARROW_END) {
    next.arrowEnd = data.arrowEnd;
  }
  return next;
}

/** Apply React Flow edge type, markers, and stroke from `edge.data` styling fields. */
export function applyFlowEdgeStyle(edge: FlowEdge): FlowEdge {
  const resolved = resolveFlowEdgeData(edge);
  return {
    ...edge,
    type: resolved.pathType,
    style: edgeStyleFromData(resolved),
    markerEnd: resolved.arrowEnd ? ARROW_MARKER : undefined,
    markerStart: resolved.arrowStart ? ARROW_MARKER : undefined,
    data: compactEdgeData(resolved),
  };
}

export function createFlowEdge(partial: Omit<FlowEdge, 'data'> & { data?: FlowEdgeData }): FlowEdge {
  return applyFlowEdgeStyle({
    ...partial,
    data: partial.data,
  });
}

export function patchFlowEdgeData(edge: FlowEdge, patch: Partial<FlowEdgeData>): FlowEdge {
  const current = resolveFlowEdgeData(edge);
  const merged: ResolvedFlowEdgeData = {
    pathType: patch.pathType ?? current.pathType,
    lineStyle: patch.lineStyle ?? current.lineStyle,
    strokeWeight: patch.strokeWeight ?? current.strokeWeight,
    strokeColor:
      patch.strokeColor === null
        ? null
        : patch.strokeColor !== undefined
          ? patch.strokeColor
          : current.strokeColor,
    arrowStart: patch.arrowStart ?? current.arrowStart,
    arrowEnd: patch.arrowEnd ?? current.arrowEnd,
  };
  return applyFlowEdgeStyle({ ...edge, data: compactEdgeData(merged) });
}
