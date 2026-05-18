import type { ResolvedFlowEdgeData } from '../flow/edgeStyle';
import { FLOW_SHAPE_OPTIONS, PRESET_NODE_FILLS } from '../flow/presets';
import type { FlowEdgeArrowMode, FlowEdgeLineStyle, FlowEdgePathType, FlowShape } from '../flow/types';
import { EdgeSelectionToolbar } from './EdgeSelectionToolbar';
import { SelectionToolbarLayoutToggle } from './SelectionToolbarLayoutToggle';
import type { SelectionToolbarLayout } from '../selectionToolbarLayout';

export type FlowRenameTarget = {
  kind: 'node' | 'edge';
  id: string;
  label: string;
};

type NodeSelectionToolbarProps = {
  selectedCount: number;
  selectedNodeCount: number;
  selectedEdgeCount: number;
  singleRenameTarget: FlowRenameTarget | null;
  singleEdgeStyle: ResolvedFlowEdgeData | null;
  onOpenRenameModal: () => void;
  onPickFill: (value: string | null) => void;
  onPickShape: (shape: FlowShape) => void;
  onPickArrowMode: (mode: FlowEdgeArrowMode) => void;
  onPickPathType: (pathType: FlowEdgePathType) => void;
  onPickLineStyle: (lineStyle: FlowEdgeLineStyle) => void;
  onPickEdgeColor: (color: string | null) => void;
  layout: SelectionToolbarLayout;
  onToggleLayout: () => void;
};

export function NodeSelectionToolbar({
  selectedCount,
  selectedNodeCount,
  selectedEdgeCount,
  singleRenameTarget,
  singleEdgeStyle,
  onOpenRenameModal,
  onPickFill,
  onPickShape,
  onPickArrowMode,
  onPickPathType,
  onPickLineStyle,
  onPickEdgeColor,
  layout,
  onToggleLayout,
}: NodeSelectionToolbarProps) {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <div
      className={`flow-selection-toolbar flow-selection-toolbar--${layout}`}
      role="toolbar"
      aria-label="Canvas selection"
    >
      <span className="flow-selection-toolbar__meta">
        {selectedCount} selected
      </span>
      {singleRenameTarget ? (
        <div
          className="flow-selection-toolbar__group"
          role="group"
          aria-label={singleRenameTarget.kind === 'edge' ? 'Edge label' : 'Node text'}
        >
          <button
            type="button"
            className="flow-selection-toolbar__rename-btn"
            onClick={onOpenRenameModal}
          >
            {singleRenameTarget.kind === 'edge' ? 'Label' : 'Rename'}
          </button>
        </div>
      ) : null}
      {selectedEdgeCount > 0 ? (
        <EdgeSelectionToolbar
          layout={layout}
          edgeStyle={singleEdgeStyle}
          onPickArrowMode={onPickArrowMode}
          onPickPathType={onPickPathType}
          onPickLineStyle={onPickLineStyle}
          onPickEdgeColor={onPickEdgeColor}
          showLayoutToggle={selectedNodeCount === 0}
          onToggleLayout={onToggleLayout}
        />
      ) : null}
      {selectedNodeCount > 0 ? (
        <>
          <div className="flow-selection-toolbar__group" role="group" aria-label="Background color">
            <span className="flow-selection-toolbar__label">Fill</span>
            <div className="flow-selection-toolbar__swatches">
              {PRESET_NODE_FILLS.map((fill, i) => (
                <button
                  key={`${fill ?? 'default'}-${i}`}
                  type="button"
                  className={`flow-selection-toolbar__swatch${fill === null ? ' flow-selection-toolbar__swatch--reset' : ''}`}
                  style={fill ? { background: fill } : undefined}
                  title={fill === null ? 'Default fill' : fill}
                  aria-label={fill === null ? 'Default fill' : `Set fill ${fill}`}
                  onClick={() => onPickFill(fill)}
                />
              ))}
            </div>
          </div>
          <div className="flow-selection-toolbar__group" role="group" aria-label="Node shape">
            <span className="flow-selection-toolbar__label">Shape</span>
            <div className="flow-selection-toolbar__shapes">
              {FLOW_SHAPE_OPTIONS.map(({ shape, label, hint }) => (
                <button
                  key={shape}
                  type="button"
                  className="flow-selection-toolbar__shape-btn"
                  title={`${label} (${hint})`}
                  onClick={() => onPickShape(shape)}
                >
                  <span className="flow-selection-toolbar__shape-name">{label}</span>
                  <span className="flow-selection-toolbar__shape-hint">{hint}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      ) : null}
      {selectedNodeCount > 0 ? (
        <SelectionToolbarLayoutToggle layout={layout} onToggle={onToggleLayout} />
      ) : null}
    </div>
  );
}
