import type { CSSProperties } from 'react';
import { contrastingTextColor, type Rgb } from '../flow/contrastText';
import { normalizeLabelLineBreaks } from '../flow/mermaidText';

type FlowNodeLabelProps = {
  label: string;
  className?: string;
  backgroundColor?: string | null;
  canvasBackdrop?: Rgb;
};

export function FlowNodeLabel({
  label,
  className = 'flow-node__label',
  backgroundColor,
  canvasBackdrop,
}: FlowNodeLabelProps) {
  const style: CSSProperties | undefined =
    typeof backgroundColor === 'string' && backgroundColor.length > 0
      ? { color: contrastingTextColor(backgroundColor, canvasBackdrop) }
      : undefined;

  return (
    <span className={className} style={style}>
      {normalizeLabelLineBreaks(label)}
    </span>
  );
}
