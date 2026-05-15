import mermaid from 'mermaid';
import { useCallback, useEffect, useRef, useState } from 'react';
import { serializeFlowchart } from '../flow/serializeFlowchart';
import type { FlowEdge, FlowNode } from '../flow/types';

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

type ChartThumbnailProps = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export function ChartThumbnail({ nodes, edges }: ChartThumbnailProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  const renderSeq = useRef(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) {
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting);
        if (hit) {
          setVisible(true);
        }
      },
      { root: null, rootMargin: '80px', threshold: 0.01 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const runRender = useCallback(async () => {
    const el = previewRef.current;
    if (!el) {
      return;
    }
    const text = serializeFlowchart(nodes, edges);
    const seq = ++renderSeq.current;
    el.removeAttribute('data-processed');
    el.textContent = text;
    el.classList.add('mermaid');

    try {
      await mermaid.run({ nodes: [el], suppressErrors: true });
    } catch (err) {
      if (seq === renderSeq.current) {
        el.removeAttribute('data-processed');
        el.replaceChildren();
        const p = document.createElement('p');
        p.className = 'chart-thumb__error';
        p.textContent = formatMermaidError(err);
        el.appendChild(p);
      }
    }
  }, [nodes, edges]);

  useEffect(() => {
    if (!visible) {
      return;
    }
    const t = window.setTimeout(() => {
      void runRender();
    }, 80);
    return () => window.clearTimeout(t);
  }, [visible, runRender]);

  return (
    <div ref={rootRef} className="chart-thumb" aria-hidden="true">
      <div className="chart-thumb__inner">
        <div ref={previewRef} className="chart-thumb__mermaid" />
      </div>
    </div>
  );
}
