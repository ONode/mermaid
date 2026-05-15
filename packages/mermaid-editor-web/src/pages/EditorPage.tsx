import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
} from '@xyflow/react';
import mermaid from 'mermaid';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlowCanvasPanel } from '../components/FlowCanvasPanel';
import { MermaidSourcePanel } from '../components/MermaidSourcePanel';
import { createInitialEdges, createInitialNodes } from '../flow/defaultGraph';
import { parseFlowchartMinimal } from '../flow/parseFlowchartMinimal';
import { serializeFlowchart } from '../flow/serializeFlowchart';
import {
  persistedToFlowEdges,
  persistedToFlowNodes,
  type ChartRecord,
} from '../storage/chartLibrary';
import type { FlowEdge, FlowNode, FlowShape } from '../flow/types';

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

function mergeNodePositions(prev: FlowNode[], next: FlowNode[]): FlowNode[] {
  const pos = new Map(prev.map((n) => [n.id, n.position]));
  return next.map((n) => ({ ...n, position: pos.get(n.id) ?? n.position }));
}

const SAVE_DEBOUNCE_MS = 500;

export type EditorPageProps = {
  chart: ChartRecord;
  onBack: () => void;
  onSaveGraph: (nodes: FlowNode[], edges: FlowEdge[]) => void;
};

export function EditorPage({ chart, onBack, onSaveGraph }: EditorPageProps) {
  const initialNodes = useMemo(() => persistedToFlowNodes(chart.nodes), [chart.nodes]);
  const initialEdges = useMemo(() => persistedToFlowEdges(chart.edges), [chart.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>(initialEdges);
  const [textEditMode, setTextEditMode] = useState(false);
  const [draft, setDraft] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const selectedCount = useMemo(() => nodes.filter((n) => n.selected).length, [nodes]);
  const singleSelection = useMemo(() => {
    const sel = nodes.filter((n) => n.selected);
    if (sel.length !== 1) {
      return null;
    }
    const n = sel[0];
    return { id: n.id, label: n.data.label };
  }, [nodes]);

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameDraft, setRenameDraft] = useState('');
  const renameTargetIdRef = useRef<string | null>(null);
  const generated = useMemo(() => serializeFlowchart(nodes, edges), [nodes, edges]);
  const previewText = textEditMode ? draft : generated;

  const previewRef = useRef<HTMLDivElement | null>(null);
  const renderSeq = useRef(0);
  const [mermaidError, setMermaidError] = useState<string | null>(null);
  const [sourceCollapsed, setSourceCollapsed] = useState(false);
  const [addNodeMenuOpen, setAddNodeMenuOpen] = useState(false);
  const addNodeMenuRef = useRef<HTMLDivElement | null>(null);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      onSaveGraph(nodes, edges);
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [nodes, edges, onSaveGraph]);

  const runRender = useCallback(async (text: string) => {
    const el = previewRef.current;
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
      void runRender(previewText);
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [previewText, runRender]);

  useEffect(() => {
    if (textEditMode) {
      setAddNodeMenuOpen(false);
    }
  }, [textEditMode]);

  useEffect(() => {
    if (!renameModalOpen) {
      return;
    }
    const target = renameTargetIdRef.current;
    if (!target || !singleSelection || singleSelection.id !== target) {
      setRenameModalOpen(false);
      renameTargetIdRef.current = null;
      setRenameDraft('');
    }
  }, [renameModalOpen, singleSelection]);

  useEffect(() => {
    if (!addNodeMenuOpen) {
      return;
    }
    const onDocPointerDown = (e: PointerEvent) => {
      const el = addNodeMenuRef.current;
      if (el && !el.contains(e.target as Node)) {
        setAddNodeMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointerDown);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown);
    };
  }, [addNodeMenuOpen]);

  useEffect(() => {
    if (!addNodeMenuOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAddNodeMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [addNodeMenuOpen]);

  const onConnect = useCallback(
    (c: Connection) => {
      setEdges((eds) => addEdge({ ...c, id: `e-${c.source}-${c.target}-${eds.length}` }, eds));
    },
    [setEdges]
  );

  const addNodeOfShape = useCallback(
    (shape: FlowShape) => {
      const id = `N${Date.now()}`;
      const label = shape === 'diamond' ? 'Decision?' : 'New node';
      setNodes((ns) => [
        ...ns,
        {
          id,
          type: 'flow',
          position: { x: 80 + (ns.length % 4) * 40, y: 40 + ns.length * 12 },
          data: { label, shape },
        },
      ]);
    },
    [setNodes]
  );

  const applyFillToSelection = useCallback(
    (fill: string | null) => {
      setNodes((ns) =>
        ns.map((n) => {
          if (!n.selected) {
            return n;
          }
          if (fill === null) {
            const nextData = { ...n.data };
            delete nextData.backgroundColor;
            return { ...n, data: nextData };
          }
          return { ...n, data: { ...n.data, backgroundColor: fill } };
        })
      );
    },
    [setNodes]
  );

  const applyShapeToSelection = useCallback(
    (shape: FlowShape) => {
      setNodes((ns) => ns.map((n) => (n.selected ? { ...n, data: { ...n.data, shape } } : n)));
    },
    [setNodes]
  );

  const openRenameModal = useCallback(() => {
    if (!singleSelection) {
      return;
    }
    renameTargetIdRef.current = singleSelection.id;
    setRenameDraft(singleSelection.label);
    setRenameModalOpen(true);
  }, [singleSelection]);

  const confirmRename = useCallback(() => {
    const id = renameTargetIdRef.current;
    if (!id) {
      return;
    }
    setNodes((ns) =>
      ns.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: renameDraft } } : n))
    );
    renameTargetIdRef.current = null;
    setRenameModalOpen(false);
    setRenameDraft('');
  }, [renameDraft, setNodes]);

  const cancelRenameModal = useCallback(() => {
    renameTargetIdRef.current = null;
    setRenameModalOpen(false);
    setRenameDraft('');
  }, []);

  const resetDiagram = useCallback(() => {
    const n = createInitialNodes();
    const e = createInitialEdges();
    setNodes(n);
    setEdges(e);
    setParseError(null);
    if (textEditMode) {
      setDraft(serializeFlowchart(n, e));
    }
  }, [setEdges, setNodes, textEditMode]);

  const copyMermaid = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(generated);
    } catch {
      window.prompt('Copy Mermaid source:', generated);
    }
  }, [generated]);

  const downloadMermaid = useCallback(() => {
    const blob = new Blob([generated], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'diagram.mmd';
    a.click();
    URL.revokeObjectURL(url);
  }, [generated]);

  const enterTextMode = () => {
    renameTargetIdRef.current = null;
    setRenameModalOpen(false);
    setRenameDraft('');
    setDraft(generated);
    setParseError(null);
    setTextEditMode(true);
  };

  const cancelTextMode = () => {
    setTextEditMode(false);
    setParseError(null);
  };

  const applyTextMode = () => {
    const r = parseFlowchartMinimal(draft);
    if (!r.ok) {
      setParseError(r.error);
      return;
    }
    setNodes((prev) => mergeNodePositions(prev, r.nodes));
    setEdges(r.edges);
    setTextEditMode(false);
    setParseError(null);
  };

  const handleBack = useCallback(() => {
    onSaveGraph(nodesRef.current, edgesRef.current);
    onBack();
  }, [onBack, onSaveGraph]);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="app-header__brand">
          <button type="button" className="app-header__back" onClick={handleBack}>
            ← Dashboard
          </button>
          <span className="app-header__sep" aria-hidden="true">
            |
          </span>
          <span className="app-header__wordmark">
            <span className="app-header__wordmark-accent">MERMAID</span>
            <span className="app-header__wordmark-rest">EDITOR</span>
          </span>
          <span className="app-header__tag">WEB</span>
          <span className="app-header__chart-name" title={chart.name}>
            {chart.name}
          </span>
        </div>
        <div className="app-header__right">
          <span className="app-header__status app-header__status--ok">
            {textEditMode ? 'SOURCE [EDIT]' : 'CANVAS [READY]'}
          </span>
          <span className="app-header__sep" aria-hidden="true">
            |
          </span>
          <div className="app-header__actions">
            <div className="app-header__add-node" ref={addNodeMenuRef}>
              <button
                type="button"
                className={`app-header__add-node-toggle${addNodeMenuOpen ? ' app-header__add-node-toggle--open' : ''}`}
                aria-expanded={addNodeMenuOpen}
                aria-haspopup="menu"
                aria-controls="add-node-menu"
                disabled={textEditMode}
                onClick={() => setAddNodeMenuOpen((o) => !o)}
              >
                Add node <span aria-hidden="true">▾</span>
              </button>
              {addNodeMenuOpen ? (
                <div
                  id="add-node-menu"
                  className="app-header__add-node-menu"
                  role="menu"
                  aria-label="Node shape"
                >
                  <button
                    type="button"
                    className="app-header__add-node-menuitem"
                    role="menuitem"
                    onClick={() => {
                      addNodeOfShape('rect');
                      setAddNodeMenuOpen(false);
                    }}
                  >
                    Rectangle
                  </button>
                  <button
                    type="button"
                    className="app-header__add-node-menuitem"
                    role="menuitem"
                    onClick={() => {
                      addNodeOfShape('stadium');
                      setAddNodeMenuOpen(false);
                    }}
                  >
                    Stadium
                  </button>
                  <button
                    type="button"
                    className="app-header__add-node-menuitem"
                    role="menuitem"
                    onClick={() => {
                      addNodeOfShape('diamond');
                      setAddNodeMenuOpen(false);
                    }}
                  >
                    Decision (diamond)
                  </button>
                  <button
                    type="button"
                    className="app-header__add-node-menuitem"
                    role="menuitem"
                    onClick={() => {
                      addNodeOfShape('circle');
                      setAddNodeMenuOpen(false);
                    }}
                  >
                    Circle
                  </button>
                </div>
              ) : null}
            </div>
            <button type="button" onClick={resetDiagram}>
              Reset
            </button>
          </div>
        </div>
      </header>

      <div
        className={`app-grid ${sourceCollapsed ? 'app-grid--source-collapsed' : ''}`}
      >
        <MermaidSourcePanel
          collapsed={sourceCollapsed}
          onToggleCollapsed={() => setSourceCollapsed((c) => !c)}
          textEditMode={textEditMode}
          previewText={previewText}
          onDraftChange={setDraft}
          parseError={parseError}
          onCopyMermaid={copyMermaid}
          onDownloadMermaid={downloadMermaid}
          onEnterTextMode={enterTextMode}
          onApplyTextMode={applyTextMode}
          onCancelTextMode={cancelTextMode}
        />

        <FlowCanvasPanel
          textEditMode={textEditMode}
          selectedCount={selectedCount}
          singleSelection={singleSelection}
          renameModalOpen={renameModalOpen}
          renameDraft={renameDraft}
          onRenameDraftChange={setRenameDraft}
          onOpenRenameModal={openRenameModal}
          onConfirmRename={confirmRename}
          onCancelRenameModal={cancelRenameModal}
          onPickFill={applyFillToSelection}
          onPickShape={applyShapeToSelection}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        />

        <section className="panel panel--preview">
          <h1>// Mermaid preview</h1>
          {mermaidError ? <p className="error">{mermaidError}</p> : null}
          <div className="preview-wrap" ref={previewRef} />
        </section>
      </div>

      <footer className="app-statusbar">
        <span>
          <span className="app-statusbar__dot" aria-hidden="true">
            ●
          </span>{' '}
          MERMAID_RENDER
        </span>
        <span className="tabular-nums">{textEditMode ? 'MODE: TEXT' : 'MODE: VISUAL'}</span>
      </footer>
    </div>
  );
}
