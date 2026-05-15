import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { FlowNode } from '../flow/types';

function innerSurfaceStyle(data: FlowNode['data']): CSSProperties | undefined {
  const c = data.backgroundColor;
  if (typeof c === 'string' && c.length > 0) {
    return {
      background: c,
      borderColor: 'rgba(255, 255, 255, 0.14)',
    };
  }
  return undefined;
}

export function FlowShapeNode({ data, selected }: NodeProps<FlowNode>) {
  const surface = innerSurfaceStyle(data);

  if (data.shape === 'diamond') {
    return (
      <div className={`flow-node flow-node--diamond ${selected ? 'flow-node--selected' : ''}`}>
        <Handle className="flow-handle" position={Position.Top} type="target" />
        <Handle className="flow-handle" position={Position.Left} type="target" id="lt" />
        <div className="flow-node__diamond-inner" style={surface}>
          <span className="flow-node__label">{data.label}</span>
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
          <span className="flow-node__label">{data.label}</span>
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
          <span className="flow-node__label">{data.label}</span>
        </div>
        <Handle className="flow-handle" position={Position.Bottom} type="source" />
      </div>
    );
  }

  return (
    <div className={`flow-node flow-node--rect ${selected ? 'flow-node--selected' : ''}`}>
      <Handle className="flow-handle" position={Position.Top} type="target" />
      <div className="flow-node__rect-inner" style={surface}>
        <span className="flow-node__label">{data.label}</span>
      </div>
      <Handle className="flow-handle" position={Position.Bottom} type="source" />
    </div>
  );
}
