export type SelectionToolbarLayout = 'horizontal' | 'vertical';

export const SELECTION_TOOLBAR_LAYOUT_STORAGE_KEY = 'mermaid-editor-web:selection-toolbar-layout';

export function readStoredSelectionToolbarLayout(): SelectionToolbarLayout {
  if (typeof localStorage === 'undefined') {
    return 'horizontal';
  }
  try {
    const raw = localStorage.getItem(SELECTION_TOOLBAR_LAYOUT_STORAGE_KEY);
    return raw === 'vertical' ? 'vertical' : 'horizontal';
  } catch {
    return 'horizontal';
  }
}

export function storeSelectionToolbarLayout(layout: SelectionToolbarLayout): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(SELECTION_TOOLBAR_LAYOUT_STORAGE_KEY, layout);
  } catch {
    /* ignore */
  }
}
