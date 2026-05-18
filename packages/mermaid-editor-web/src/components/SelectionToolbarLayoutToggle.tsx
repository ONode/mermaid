import type { SelectionToolbarLayout } from '../selectionToolbarLayout';

type SelectionToolbarLayoutToggleProps = {
  layout: SelectionToolbarLayout;
  onToggle: () => void;
};

function IconDockTop() {
  return (
    <svg
      className="flow-selection-toolbar__layout-icon-svg"
      viewBox="0 0 16 16"
      width={14}
      height={14}
      aria-hidden="true"
    >
      <rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="2.5" y="2.5" width="11" height="3.5" fill="currentColor" />
    </svg>
  );
}

function IconDockRight() {
  return (
    <svg
      className="flow-selection-toolbar__layout-icon-svg"
      viewBox="0 0 16 16"
      width={14}
      height={14}
      aria-hidden="true"
    >
      <rect x="1.5" y="1.5" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1" />
      <rect x="10" y="2.5" width="3.5" height="11" fill="currentColor" />
    </svg>
  );
}

/** Icon button: dock selection toolbar on top (horizontal) or on the right (vertical). */
export function SelectionToolbarLayoutToggle({
  layout,
  onToggle,
}: SelectionToolbarLayoutToggleProps) {
  const isHorizontal = layout === 'horizontal';

  return (
    <button
      type="button"
      className="flow-selection-toolbar__layout-toggle"
      onClick={onToggle}
      aria-pressed={!isHorizontal}
      aria-label={isHorizontal ? 'Dock toolbar on right side' : 'Dock toolbar on top'}
      title={isHorizontal ? 'Right toolbar' : 'Top toolbar'}
    >
      {isHorizontal ? <IconDockRight /> : <IconDockTop />}
    </button>
  );
}
