import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type NodeTypes,
} from '@xyflow/react';
import type { FlowEdge, FlowNode } from '../flow/types';
import { FlowShapeNode } from './FlowShapeNode';

const nodeTypes = { flow: FlowShapeNode } satisfies NodeTypes;

type FlowCanvasProps = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<FlowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
};

export function FlowCanvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect }: FlowCanvasProps) {
  return (
    <div className="flow-canvas-wrap">
      <ReactFlowProvider>
        <ReactFlow
          colorMode="dark"
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
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
