import type { Connection, EdgeChange, NodeChange } from '@xyflow/react';
import { useEffect, useId, useRef } from 'react';
import type { FlowEdge, FlowNode, FlowShape } from '../flow/types';
import { FlowCanvas } from './FlowCanvas';
import { NodeSelectionToolbar } from './NodeSelectionToolbar';

export type FlowCanvasPanelProps = {
  textEditMode: boolean;
  selectedCount: number;
  singleSelection: { id: string; label: string } | null;
  renameModalOpen: boolean;
  renameDraft: string;
  onRenameDraftChange: (value: string) => void;
  onOpenRenameModal: () => void;
  onConfirmRename: () => void;
  onCancelRenameModal: () => void;
  onPickFill: (value: string | null) => void;
  onPickShape: (shape: FlowShape) => void;
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
};

export function FlowCanvasPanel({
  textEditMode,
  selectedCount,
  singleSelection,
  renameModalOpen,
  renameDraft,
  onRenameDraftChange,
  onOpenRenameModal,
  onConfirmRename,
  onCancelRenameModal,
  onPickFill,
  onPickShape,
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}: FlowCanvasPanelProps) {
  const titleId = useId();
  const fieldId = useId();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

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
      <h1>// Canvas</h1>
      <div className="flow-panel-body">
        <div className="flow-canvas-stack">
          <FlowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
          />
          <div className="flow-canvas-overlay" aria-live="polite">
            <NodeSelectionToolbar
              selectedCount={selectedCount}
              singleSelection={singleSelection}
              onOpenRenameModal={onOpenRenameModal}
              onPickFill={onPickFill}
              onPickShape={onPickShape}
            />
          </div>
        </div>
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
              Rename node
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
