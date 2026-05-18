import type { ResolvedFlowEdgeData } from '../flow/edgeStyle';
import { arrowModeFromFlags } from '../flow/edgeStyle';
import {
  FLOW_EDGE_ARROW_OPTIONS,
  FLOW_EDGE_LINE_STYLE_OPTIONS,
  FLOW_EDGE_PATH_OPTIONS,
  PRESET_EDGE_STROKES,
} from '../flow/presets';
import type { FlowEdgeArrowMode, FlowEdgeLineStyle, FlowEdgePathType } from '../flow/types';

type EdgeSelectionToolbarProps = {
  edgeStyle: ResolvedFlowEdgeData | null;
  onPickArrowMode: (mode: FlowEdgeArrowMode) => void;
  onPickPathType: (pathType: FlowEdgePathType) => void;
  onPickLineStyle: (lineStyle: FlowEdgeLineStyle) => void;
  onPickEdgeColor: (color: string | null) => void;
};

export function EdgeSelectionToolbar({
  edgeStyle,
  onPickArrowMode,
  onPickPathType,
  onPickLineStyle,
  onPickEdgeColor,
}: EdgeSelectionToolbarProps) {
  const arrowMode = edgeStyle ? arrowModeFromFlags(edgeStyle.arrowStart, edgeStyle.arrowEnd) : null;

  return (
    <>
      <div className="flow-selection-toolbar__group" role="group" aria-label="Arrow direction">
        <span className="flow-selection-toolbar__label">Arrows</span>
        <div className="flow-selection-toolbar__edge-toggles">
          {FLOW_EDGE_ARROW_OPTIONS.map(({ mode, label, hint }) => (
            <button
              key={mode}
              type="button"
              className={`flow-selection-toolbar__edge-btn flow-selection-toolbar__edge-btn--arrow${
                arrowMode === mode ? ' flow-selection-toolbar__edge-btn--active' : ''
              }`}
              title={hint}
              aria-label={hint}
              aria-pressed={arrowMode === mode}
              onClick={() => onPickArrowMode(mode)}
            >
              <span className="flow-selection-toolbar__edge-btn-glyph">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flow-selection-toolbar__group" role="group" aria-label="Edge path">
        <span className="flow-selection-toolbar__label">Path</span>
        <div className="flow-selection-toolbar__edge-toggles">
          {FLOW_EDGE_PATH_OPTIONS.map(({ pathType, label, hint }) => (
            <button
              key={pathType}
              type="button"
              className={`flow-selection-toolbar__edge-btn${
                edgeStyle?.pathType === pathType ? ' flow-selection-toolbar__edge-btn--active' : ''
              }`}
              title={hint}
              aria-pressed={edgeStyle?.pathType === pathType}
              onClick={() => onPickPathType(pathType)}
            >
              <span className="flow-selection-toolbar__edge-btn-name">{label}</span>
              <span className="flow-selection-toolbar__edge-btn-hint">{hint}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flow-selection-toolbar__group" role="group" aria-label="Edge line style">
        <span className="flow-selection-toolbar__label">Line</span>
        <div className="flow-selection-toolbar__edge-toggles">
          {FLOW_EDGE_LINE_STYLE_OPTIONS.map(({ lineStyle, label }) => (
            <button
              key={lineStyle}
              type="button"
              className={`flow-selection-toolbar__edge-btn flow-selection-toolbar__edge-btn--line${
                edgeStyle?.lineStyle === lineStyle ? ' flow-selection-toolbar__edge-btn--active' : ''
              }`}
              title={label}
              aria-pressed={edgeStyle?.lineStyle === lineStyle}
              onClick={() => onPickLineStyle(lineStyle)}
            >
              <span
                className={`flow-selection-toolbar__line-preview flow-selection-toolbar__line-preview--${lineStyle}`}
                aria-hidden="true"
              />
              <span className="flow-selection-toolbar__edge-btn-name">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flow-selection-toolbar__group" role="group" aria-label="Edge color">
        <span className="flow-selection-toolbar__label">Color</span>
        <div className="flow-selection-toolbar__swatches">
          {PRESET_EDGE_STROKES.map((stroke, i) => (
            <button
              key={`${stroke ?? 'default'}-${i}`}
              type="button"
              className={`flow-selection-toolbar__swatch flow-selection-toolbar__swatch--stroke${
                stroke === null ? ' flow-selection-toolbar__swatch--reset' : ''
              }${edgeStyle?.strokeColor === stroke ? ' flow-selection-toolbar__swatch--active' : ''}`}
              style={stroke ? { background: stroke } : undefined}
              title={stroke === null ? 'Default stroke' : stroke}
              aria-label={stroke === null ? 'Default stroke' : `Set stroke ${stroke}`}
              aria-pressed={edgeStyle?.strokeColor === stroke}
              onClick={() => onPickEdgeColor(stroke)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
