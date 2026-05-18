import type { Connection, EdgeChange, EdgeMouseHandler, NodeChange, NodeMouseHandler } from '@xyflow/react';
import mermaid from 'mermaid';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useAppTheme } from '../context/AppThemeContext';
import {
  readStoredSelectionToolbarLayout,
  storeSelectionToolbarLayout,
  type SelectionToolbarLayout,
} from '../selectionToolbarLayout';
import type { ResolvedFlowEdgeData } from '../flow/edgeStyle';
import type {
  FlowEdge,
  FlowEdgeArrowMode,
  FlowEdgeLineStyle,
  FlowEdgePathType,
  FlowNode,
  FlowShape,
} from '../flow/types';
import { FlowCanvas } from './FlowCanvas';
import { NodeSelectionToolbar, type FlowRenameTarget } from './NodeSelectionToolbar';

function formatMermaidCanvasError(err: unknown): string {
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

export type FlowCanvasPanelProps = {
  textEditMode: boolean;
  mermaidChartPreview: boolean;
  mermaidPreviewSource: string;
  selectedCount: number;
  selectedNodeCount: number;
  selectedEdgeCount: number;
  singleEdgeStyle: ResolvedFlowEdgeData | null;
  canCopySelection: boolean;
  canPasteSelection: boolean;
  onCopySelection: () => void;
  onPasteSelection: () => void;
  singleRenameTarget: FlowRenameTarget | null;
  renameModalOpen: boolean;
  renameModalKind: 'node' | 'edge';
  renameDraft: string;
  onRenameDraftChange: (value: string) => void;
  onOpenRenameModal: () => void;
  onNodeDoubleClick: NodeMouseHandler<FlowNode>;
  onEdgeDoubleClick: EdgeMouseHandler<FlowEdge>;
  onConfirmRename: () => void;
  onCancelRenameModal: () => void;
  onPickFill: (value: string | null) => void;
  onPickShape: (shape: FlowShape) => void;
  onPickArrowMode: (mode: FlowEdgeArrowMode) => void;
  onPickPathType: (pathType: FlowEdgePathType) => void;
  onPickLineStyle: (lineStyle: FlowEdgeLineStyle) => void;
  onPickEdgeColor: (color: string | null) => void;
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
};

export function FlowCanvasPanel({
  textEditMode,
  mermaidChartPreview,
  mermaidPreviewSource,
  selectedCount,
  selectedNodeCount,
  selectedEdgeCount,
  singleEdgeStyle,
  canCopySelection,
  canPasteSelection,
  onCopySelection,
  onPasteSelection,
  singleRenameTarget,
  renameModalOpen,
  renameModalKind,
  renameDraft,
  onRenameDraftChange,
  onOpenRenameModal,
  onNodeDoubleClick,
  onEdgeDoubleClick,
  onConfirmRename,
  onCancelRenameModal,
  onPickFill,
  onPickShape,
  onPickArrowMode,
  onPickPathType,
  onPickLineStyle,
  onPickEdgeColor,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: FlowCanvasPanelProps) {
  const { theme } = useAppTheme();
  const titleId = useId();
  const fieldId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const mermaidCanvasRef = useRef<HTMLDivElement | null>(null);
  const mermaidRenderSeq = useRef(0);
  const [mermaidCanvasError, setMermaidCanvasError] = useState<string | null>(null);
  const [toolbarLayout, setToolbarLayout] = useState<SelectionToolbarLayout>(() =>
    readStoredSelectionToolbarLayout()
  );

  const toggleToolbarLayout = useCallback(() => {
    setToolbarLayout((current) => {
      const next: SelectionToolbarLayout = current === 'horizontal' ? 'vertical' : 'horizontal';
      storeSelectionToolbarLayout(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!mermaidChartPreview) {
      setMermaidCanvasError(null);
      return;
    }
    const el = mermaidCanvasRef.current;
    if (!el) {
      return;
    }

    const seq = ++mermaidRenderSeq.current;
    el.removeAttribute('data-processed');
    el.textContent = mermaidPreviewSource;
    el.classList.add('mermaid');

    void (async () => {
      try {
        await mermaid.run({ nodes: [el], suppressErrors: false });
        if (seq === mermaidRenderSeq.current) {
          setMermaidCanvasError(null);
        }
      } catch (err) {
        if (seq === mermaidRenderSeq.current) {
          setMermaidCanvasError(formatMermaidCanvasError(err));
          el.removeAttribute('data-processed');
          el.replaceChildren();
        }
      }
    })();

    return () => {
      mermaidRenderSeq.current += 1;
    };
  }, [mermaidChartPreview, mermaidPreviewSource, theme]);

  useEffect(() => {
    if (!renameModalOpen) {
      return;
    }
    const ta = textareaRef.current;
    if (ta) {
      ta.focus();
      ta.select();
    }
  }, [renameModalOpen]);

  useEffect(() => {
    if (!renameModalOpen) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancelRenameModal();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [renameModalOpen, onCancelRenameModal]);

  return (
    <section className={`panel panel--flow ${textEditMode ? 'panel--flow-disabled' : ''}`}>
      <h1>{mermaidChartPreview ? '// Canvas — Mermaid' : '// Canvas'}</h1>
      <div className="flow-panel-body">
        {mermaidChartPreview ? (
          <div className="flow-mermaid-chart-preview">
            {mermaidCanvasError ? <p className="error flow-mermaid-chart-preview__error">{mermaidCanvasError}</p> : null}
            <div className="flow-mermaid-chart-preview__scroll">
              <div ref={mermaidCanvasRef} className="flow-mermaid-chart-preview__host" />
            </div>
          </div>
        ) : (
          <div className="flow-canvas-stack">
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDoubleClick={onNodeDoubleClick}
              onEdgeDoubleClick={onEdgeDoubleClick}
              keyboardShortcutsEnabled={!textEditMode && !renameModalOpen}
              canCopySelection={canCopySelection}
              canPasteSelection={canPasteSelection}
              onCopySelection={onCopySelection}
              onPasteSelection={onPasteSelection}
            />
            <div
              className={`flow-canvas-overlay flow-canvas-overlay--toolbar-${toolbarLayout}`}
              aria-live="polite"
            >
              <NodeSelectionToolbar
                selectedCount={selectedCount}
                selectedNodeCount={selectedNodeCount}
                selectedEdgeCount={selectedEdgeCount}
                singleRenameTarget={singleRenameTarget}
                singleEdgeStyle={singleEdgeStyle}
                onOpenRenameModal={onOpenRenameModal}
                onPickFill={onPickFill}
                onPickShape={onPickShape}
                onPickArrowMode={onPickArrowMode}
                onPickPathType={onPickPathType}
                onPickLineStyle={onPickLineStyle}
                onPickEdgeColor={onPickEdgeColor}
                layout={toolbarLayout}
                onToggleLayout={toggleToolbarLayout}
              />
            </div>
          </div>
        )}
      </div>

      {renameModalOpen ? (
        <div
          className="flow-rename-modal"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              onCancelRenameModal();
            }
          }}
        >
          <div
            className="flow-rename-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
          >
            <h2 id={titleId} className="flow-rename-modal__title">
              {renameModalKind === 'edge' ? 'Edge label' : 'Rename node'}
            </h2>
            <label className="flow-rename-modal__label" htmlFor={fieldId}>
              Label
            </label>
            <textarea
              ref={textareaRef}
              id={fieldId}
              className="flow-rename-modal__textarea"
              rows={4}
              value={renameDraft}
              onChange={(e) => onRenameDraftChange(e.target.value)}
            />
            <div className="flow-rename-modal__actions">
              <button type="button" className="flow-rename-modal__btn flow-rename-modal__btn--primary" onClick={onConfirmRename}>
                OK
              </button>
              <button type="button" className="flow-rename-modal__btn" onClick={onCancelRenameModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
