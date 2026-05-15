import { FLOW_SHAPE_OPTIONS, PRESET_NODE_FILLS } from '../flow/presets';
import type { FlowShape } from '../flow/types';

type NodeSelectionToolbarProps = {
  selectedCount: number;
  singleSelection: { id: string; label: string } | null;
  onOpenRenameModal: () => void;
  onPickFill: (value: string | null) => void;
  onPickShape: (shape: FlowShape) => void;
};

export function NodeSelectionToolbar({
  selectedCount,
  singleSelection,
  onOpenRenameModal,
  onPickFill,
  onPickShape,
}: NodeSelectionToolbarProps) {
  if (selectedCount <= 0) {
    return null;
  }

  return (
    <div className="flow-selection-toolbar" role="toolbar" aria-label="Selected nodes">
      <span className="flow-selection-toolbar__meta">
        {selectedCount} selected
      </span>
      {singleSelection ? (
        <div className="flow-selection-toolbar__group" role="group" aria-label="Node text">
          <button
            type="button"
            className="flow-selection-toolbar__rename-btn"
            onClick={onOpenRenameModal}
          >
            Rename
          </button>
        </div>
      ) : null}
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
    </div>
  );
}
