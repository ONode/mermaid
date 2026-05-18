import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { FlowSubgraphNode } from '../flow/types';
import { FlowNodeLabel } from './FlowNodeLabel';

export function FlowSubgraphNode({ data, selected }: NodeProps<FlowSubgraphNode>) {
  return (
    <div
      className={`flow-subgraph${selected ? ' flow-subgraph--selected' : ''}`}
      aria-label={`Subgraph ${data.title}`}
    >
      <Handle className="flow-handle" position={Position.Top} type="target" id="t" />
      <Handle className="flow-handle" position={Position.Left} type="target" id="l" />
      <Handle className="flow-handle" position={Position.Right} type="source" id="r" />
      <Handle className="flow-handle" position={Position.Bottom} type="source" id="b" />
      <FlowNodeLabel label={data.title} className="flow-subgraph__title" />
    </div>
  );
}
