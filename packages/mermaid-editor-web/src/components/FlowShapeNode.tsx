import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { FlowShapeNode } from '../flow/types';
import { FlowNodeLabel } from './FlowNodeLabel';

function innerSurfaceStyle(data: FlowShapeNode['data']): CSSProperties | undefined {
  const c = data.backgroundColor;
  if (typeof c === 'string' && c.length > 0) {
    return {
      background: c,
      borderColor: 'rgba(255, 255, 255, 0.14)',
    };
  }
  return undefined;
}

export function FlowShapeNode({ data, selected }: NodeProps<FlowShapeNode>) {
  const surface = innerSurfaceStyle(data);

  if (data.shape === 'diamond') {
    return (
      <div className={`flow-node flow-node--diamond ${selected ? 'flow-node--selected' : ''}`}>
        <Handle className="flow-handle" position={Position.Top} type="target" />
        <Handle className="flow-handle" position={Position.Left} type="target" id="lt" />
        <div className="flow-node__diamond-inner" style={surface}>
          <FlowNodeLabel label={data.label} />
        </div>
        <Handle className="flow-handle" position={Position.Right} type="source" />
        <Handle className="flow-handle" position={Position.Bottom} type="source" id="sb" />
      </div>
    );
  }

  if (data.shape === 'circle') {
    return (
      <div className={`flow-node flow-node--circle ${selected ? 'flow-node--selected' : ''}`}>
        <Handle className="flow-handle" position={Position.Top} type="target" />
        <div className="flow-node__circle-inner" style={surface}>
          <FlowNodeLabel label={data.label} />
        </div>
        <Handle className="flow-handle" position={Position.Bottom} type="source" />
      </div>
    );
  }

  if (data.shape === 'stadium') {
    return (
      <div className={`flow-node flow-node--stadium ${selected ? 'flow-node--selected' : ''}`}>
        <Handle className="flow-handle" position={Position.Top} type="target" />
        <div className="flow-node__stadium-inner" style={surface}>
          <FlowNodeLabel label={data.label} />
        </div>
        <Handle className="flow-handle" position={Position.Bottom} type="source" />
      </div>
    );
  }

  if (data.shape === 'cylinder') {
    return (
      <div className={`flow-node flow-node--cylinder ${selected ? 'flow-node--selected' : ''}`}>
        <Handle className="flow-handle" position={Position.Top} type="target" />
        <div className="flow-node__cylinder">
          <div className="flow-node__cylinder-cap" style={surface} aria-hidden="true" />
          <div className="flow-node__cylinder-body" style={surface}>
            <FlowNodeLabel label={data.label} />
          </div>
          <div className="flow-node__cylinder-base" style={surface} aria-hidden="true" />
        </div>
        <Handle className="flow-handle" position={Position.Bottom} type="source" />
      </div>
    );
  }

  return (
    <div className={`flow-node flow-node--rect ${selected ? 'flow-node--selected' : ''}`}>
      <Handle className="flow-handle" position={Position.Top} type="target" />
      <div className="flow-node__rect-inner" style={surface}>
        <FlowNodeLabel label={data.label} />
      </div>
      <Handle className="flow-handle" position={Position.Bottom} type="source" />
    </div>
  );
}
