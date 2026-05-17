import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type NodeMouseHandler,
  type NodeTypes,
} from '@xyflow/react';
import { useEffect } from 'react';
import type { FlowEdge, FlowNode } from '../flow/types';
import { FlowShapeNode } from './FlowShapeNode';

const nodeTypes = { flow: FlowShapeNode } satisfies NodeTypes;

type FlowCanvasProps = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeDoubleClick?: NodeMouseHandler<FlowNode>;
  keyboardShortcutsEnabled?: boolean;
  canCopySelection?: boolean;
  canPasteSelection?: boolean;
  onCopySelection?: () => void;
  onPasteSelection?: () => void;
};

function isEditableTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest('input, textarea, select, [contenteditable="true"]') !== null
  );
}

function FlowCanvasKeyboardShortcuts({
  enabled,
  canCopySelection,
  canPasteSelection,
  onCopySelection,
  onPasteSelection,
}: {
  enabled: boolean;
  canCopySelection: boolean;
  canPasteSelection: boolean;
  onCopySelection: () => void;
  onPasteSelection: () => void;
}) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || isEditableTarget(e.target)) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'c' && canCopySelection) {
        e.preventDefault();
        onCopySelection();
      } else if (key === 'v' && canPasteSelection) {
        e.preventDefault();
        onPasteSelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, canCopySelection, canPasteSelection, onCopySelection, onPasteSelection]);

  return null;
}

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeDoubleClick,
  keyboardShortcutsEnabled = false,
  canCopySelection = false,
  canPasteSelection = false,
  onCopySelection,
  onPasteSelection,
}: FlowCanvasProps) {
  return (
    <div className="flow-canvas-wrap">
      <ReactFlowProvider>
        {keyboardShortcutsEnabled && onCopySelection && onPasteSelection ? (
          <FlowCanvasKeyboardShortcuts
            enabled={keyboardShortcutsEnabled}
            canCopySelection={canCopySelection}
            canPasteSelection={canPasteSelection}
            onCopySelection={onCopySelection}
            onPasteSelection={onPasteSelection}
          />
        ) : null}
        <ReactFlow
          colorMode="dark"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={onNodeDoubleClick}
          nodeTypes={nodeTypes}
          deleteKeyCode={['Backspace', 'Delete']}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          snapToGrid
          snapGrid={[16, 16]}
          multiSelectionKeyCode="Shift"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(245, 248, 194, 0.07)" gap={16} size={1} />
          <Controls showInteractive={false} />
          <MiniMap pannable zoomable className="flow-minimap" />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
}
