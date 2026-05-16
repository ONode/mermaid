import mermaid from 'mermaid';
import { useCallback, useEffect, useRef, useState } from 'react';

function formatMermaidError(err: unknown): string {
  if (typeof err === 'string') {
    return err;
  }
  if (err instanceof Error) {
    return err.message;
  }
  if (
    err &&
    typeof err === 'object' &&
    'str' in err &&
    typeof (err as { str: unknown }).str === 'string'
  ) {
    return (err as { str: string }).str;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

const RENDER_DEBOUNCE_MS = 250;

export type MermaidPreviewPanelProps = {
  /** Mermaid diagram definition (e.g. flowchart TD …). */
  source: string;
};

/**
 * Bottom grid panel: debounced `mermaid.run` for the given source string.
 */
export function MermaidPreviewPanel({ source }: MermaidPreviewPanelProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderSeq = useRef(0);
  const [mermaidError, setMermaidError] = useState<string | null>(null);

  const runRender = useCallback(async (text: string) => {
    const el = containerRef.current;
    if (!el) {
      return;
    }

    const seq = ++renderSeq.current;
    el.removeAttribute('data-processed');
    el.textContent = text;
    el.classList.add('mermaid');

    try {
      await mermaid.run({ nodes: [el], suppressErrors: false });
      if (seq === renderSeq.current) {
        setMermaidError(null);
      }
    } catch (err) {
      if (seq === renderSeq.current) {
        setMermaidError(formatMermaidError(err));
        el.removeAttribute('data-processed');
        el.replaceChildren();
      }
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void runRender(source);
    }, RENDER_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(handle);
    };
  }, [source, runRender]);

  return (
    <section className="panel panel--preview">
      <h1>// Mermaid preview</h1>
      {mermaidError ? <p className="error">{mermaidError}</p> : null}
      <div className="preview-wrap" ref={containerRef} />
    </section>
  );
}
