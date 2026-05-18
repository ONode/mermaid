import { unquoteMermaidString } from './mermaidText';

export function slugSubgraphId(title: string): string {
  const slug = title
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return slug.length > 0 ? slug : 'subgraph';
}

/** Parse `subgraph …` line body (after the `subgraph` keyword). */
export function parseSubgraphHeader(body: string): { id: string; title: string } {
  const trimmed = body.trim();

  let m = /^(\w+)\s*\[\s*([^\]]+?)\s*\]\s*$/.exec(trimmed);
  if (m) {
    const title = unquoteBracketTitle(m[2].trim());
    return { id: m[1], title };
  }

  m = /^"((?:\\.|[^"\\])*)"\s*$/.exec(trimmed);
  if (m) {
    const title = unquoteMermaidString(m[1]);
    return { id: slugSubgraphId(title), title };
  }

  m = /^(\w+)\s*$/.exec(trimmed);
  if (m) {
    return { id: m[1], title: m[1] };
  }

  return { id: slugSubgraphId(trimmed), title: trimmed };
}

function unquoteBracketTitle(raw: string): string {
  if (raw.startsWith('"') && raw.endsWith('"') && raw.length >= 2) {
    return unquoteMermaidString(raw.slice(1, -1));
  }
  return raw;
}

export function uniqueSubgraphId(baseId: string, used: Set<string>): string {
  if (!used.has(baseId)) {
    return baseId;
  }
  let i = 2;
  while (used.has(`${baseId}_${i}`)) {
    i += 1;
  }
  return `${baseId}_${i}`;
}
