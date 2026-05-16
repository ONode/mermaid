import type { FlowchartDirection, FlowEdge, FlowNode } from './types';

function escapeQuotedLabel(label: string): string {
  return label.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Use Mermaid quoted form when plain `[…]` / `{…}` text would lose clarity or risk parse issues. */
function formatRectLabel(label: string): string {
  if (/[\n[\]"<>()]|^\s|\s$/.test(label)) {
    return `"${escapeQuotedLabel(label)}"`;
  }
  return label;
}

function formatDiamondLabel(label: string): string {
  if (/[\n{}<>()"]|^\s|\s$/.test(label)) {
    return `"${escapeQuotedLabel(label)}"`;
  }
  return label;
}

function formatStadiumLabel(label: string): string {
  if (/[\n[\]"<>()]|^\s|\s$/.test(label)) {
    return `"${escapeQuotedLabel(label)}"`;
  }
  return label;
}

function formatCircleLabel(label: string): string {
  if (/[\n")]|^\s|\s$/.test(label) || label.includes(')')) {
    return `"${escapeQuotedLabel(label)}"`;
  }
  return label;
}

function formatNodeLine(node: FlowNode): string {
  const { label, shape } = node.data;
  if (shape === 'diamond') {
    const inner = formatDiamondLabel(label);
    return `    ${node.id}{${inner}}`;
  }
  if (shape === 'circle') {
    const inner = formatCircleLabel(label);
    return `    ${node.id}((${inner}))`;
  }
  if (shape === 'stadium') {
    const inner = formatStadiumLabel(label);
    return `    ${node.id}([${inner}])`;
  }
  const inner = formatRectLabel(label);
  return `    ${node.id}[${inner}]`;
}

function formatEdgeLine(edge: FlowEdge): string {
  const label =
    typeof edge.label === 'string' && edge.label.length > 0 ? edge.label : undefined;
  if (label !== undefined) {
    const safe = /[\n|<>()"]/.test(label)
      ? `"${escapeQuotedLabel(label)}"`
      : label;
    return `    ${edge.source} -->|${safe}| ${edge.target}`;
  }
  return `    ${edge.source} --> ${edge.target}`;
}

/**
 * Deterministic `flowchart …` text from React Flow nodes and edges.
 */
export function serializeFlowchart(
  nodes: FlowNode[],
  edges: FlowEdge[],
  direction: FlowchartDirection = 'TD'
): string {
  const sortedNodes = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  const sortedEdges = [...edges].sort((a, b) => {
    const s = a.source.localeCompare(b.source);
    if (s !== 0) {
      return s;
    }
    const t = a.target.localeCompare(b.target);
    if (t !== 0) {
      return t;
    }
    return a.id.localeCompare(b.id);
  });

  const styleLines = sortedNodes
    .filter((n) => {
      const c = n.data.backgroundColor;
      return typeof c === 'string' && c.length > 0;
    })
    .map((n) => `    style ${n.id} fill:${n.data.backgroundColor}`);

  const lines = [
    `flowchart ${direction}`,
    ...sortedNodes.map(formatNodeLine),
    ...sortedEdges.map(formatEdgeLine),
    ...styleLines,
  ];
  return `${lines.join('\n')}\n`;
}
