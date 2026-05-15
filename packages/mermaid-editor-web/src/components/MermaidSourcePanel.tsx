export type MermaidSourcePanelProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  textEditMode: boolean;
  previewText: string;
  onDraftChange: (next: string) => void;
  parseError: string | null;
  onCopyMermaid: () => void;
  onDownloadMermaid: () => void;
  onEnterTextMode: () => void;
  onApplyTextMode: () => void;
  onCancelTextMode: () => void;
};

export function MermaidSourcePanel({
  collapsed,
  onToggleCollapsed,
  textEditMode,
  previewText,
  onDraftChange,
  parseError,
  onCopyMermaid,
  onDownloadMermaid,
  onEnterTextMode,
  onApplyTextMode,
  onCancelTextMode,
}: MermaidSourcePanelProps) {
  return (
    <section
      className={`panel panel--source ${collapsed ? 'panel--source-collapsed' : ''}`}
    >
      <div className="panel--source__header">
        <button
          type="button"
          className="panel--source__titlebar"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-controls="mermaid-source-body"
          id="mermaid-source-titlebar"
          aria-label="Toggle Mermaid source panel"
        >
          <span className="panel--source__title" role="presentation">
            // Mermaid source
          </span>
        </button>
        {!collapsed ? (
          <div
            className="panel--source__toolbar"
            role="toolbar"
            aria-label="Mermaid source actions"
          >
            <button type="button" className="panel--source__btn-accent" onClick={onCopyMermaid}>
              Copy Mermaid
            </button>
            <button
              type="button"
              className="panel--source__btn-accent"
              onClick={onDownloadMermaid}
            >
              Download .mmd
            </button>
            {!textEditMode ? (
              <button type="button" onClick={onEnterTextMode}>
                Edit Mermaid text
              </button>
            ) : (
              <>
                <button type="button" className="panel--source__btn-accent" onClick={onApplyTextMode}>
                  Apply
                </button>
                <button type="button" onClick={onCancelTextMode}>
                  Cancel
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>
      <div
        id="mermaid-source-body"
        className="panel--source__body"
        hidden={collapsed}
      >
        <p className="panel__hint">
          {textEditMode
            ? 'Edit text, then Apply. Supports flowchart TD, rectangle / stadium / diamond / circle nodes, simple edges, and style fill lines.'
            : 'Generated from the canvas. Shapes and fills round-trip via Mermaid; use “Edit Mermaid text” to paste or edit, then Apply.'}
        </p>
        <textarea
          className="source-input"
          spellCheck={false}
          readOnly={!textEditMode}
          value={previewText}
          onChange={textEditMode ? (e) => onDraftChange(e.target.value) : undefined}
          aria-label="Mermaid diagram source"
        />
        {parseError ? <p className="error">{parseError}</p> : null}
      </div>
    </section>
  );
}
