import type { FlowNode } from './types';

export type ClassDefStyle = {
  fill?: string;
  stroke?: string;
  textColor?: string;
};

const CLASS_DEF = /^\s*classDef\s+(\w+)\s+(.+)$/i;
const CLASS_ASSIGN = /^\s*class\s+(.+)$/i;

function parseClassDefBody(body: string): ClassDefStyle {
  const style: ClassDefStyle = {};
  for (const part of body.split(',')) {
    const piece = part.trim();
    const m = /^(fill|stroke|color)\s*:\s*(.+)$/i.exec(piece);
    if (!m) {
      continue;
    }
    const value = m[2].trim();
    switch (m[1].toLowerCase()) {
      case 'fill':
        style.fill = value;
        break;
      case 'stroke':
        style.stroke = value;
        break;
      case 'color':
        style.textColor = value;
        break;
    }
  }
  return style;
}

export function parseClassDefLine(trimmed: string): { name: string; style: ClassDefStyle } | null {
  const m = CLASS_DEF.exec(trimmed);
  if (!m) {
    return null;
  }
  return { name: m[1], style: parseClassDefBody(m[2]) };
}

export function parseClassAssignLine(
  trimmed: string
): { nodeIds: string[]; className: string } | null {
  const m = CLASS_ASSIGN.exec(trimmed);
  if (!m) {
    return null;
  }
  const body = m[1].trim();
  const lastSpace = body.lastIndexOf(' ');
  if (lastSpace < 0) {
    return null;
  }
  const idsPart = body.slice(0, lastSpace);
  const className = body.slice(lastSpace + 1).trim();
  const nodeIds = idsPart
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (nodeIds.length === 0 || !className) {
    return null;
  }
  return { nodeIds, className };
}

export function applyClassToNodes(
  nodes: Map<string, FlowNode>,
  classDefs: Map<string, ClassDefStyle>,
  nodeIds: string[],
  className: string
): void {
  const def = classDefs.get(className);
  if (!def?.fill) {
    return;
  }
  for (const id of nodeIds) {
    const node = nodes.get(id);
    if (node?.type !== 'flow') {
      continue;
    }
    nodes.set(id, {
      ...node,
      data: { ...node.data, backgroundColor: def.fill },
    });
  }
}
