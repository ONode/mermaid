const BR_TAG = /<br\s*\/?>/gi;

/** Decode common Mermaid quoted-string escapes. */
export function unquoteMermaidString(s: string): string {
  return s
    .replace(/\\\\/g, '\u0000')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\u0000/g, '\\');
}

/** Turn Mermaid/HTML line breaks into `\n` for canvas display. */
export function normalizeLabelLineBreaks(label: string): string {
  return label.replace(BR_TAG, '\n').replace(/\\n/g, '\n');
}
