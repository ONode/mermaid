import type { NodeProps } from '@xyflow/react';
import type { FlowSubgraphNode } from '../flow/types';
import { FlowNodeLabel } from './FlowNodeLabel';

export function FlowSubgraphNode({ data, selected }: NodeProps<FlowSubgraphNode>) {
  return (
    <div
      className={`flow-subgraph${selected ? ' flow-subgraph--selected' : ''}`}
      aria-label={`Subgraph ${data.title}`}
    >
      <FlowNodeLabel label={data.title} className="flow-subgraph__title" />
    </div>
  );
}
