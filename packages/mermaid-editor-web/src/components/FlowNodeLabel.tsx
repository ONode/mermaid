import { normalizeLabelLineBreaks } from '../flow/mermaidText';

type FlowNodeLabelProps = {
  label: string;
  className?: string;
};

export function FlowNodeLabel({ label, className = 'flow-node__label' }: FlowNodeLabelProps) {
  return <span className={className}>{normalizeLabelLineBreaks(label)}</span>;
}
