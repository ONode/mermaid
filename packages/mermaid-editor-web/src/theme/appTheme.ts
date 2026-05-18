import mermaid from 'mermaid';

export type AppTheme = 'dark' | 'light';

export const APP_THEME_STORAGE_KEY = 'mermaid-editor-web:theme';

export function readStoredAppTheme(): AppTheme {
  if (typeof localStorage === 'undefined') {
    return 'dark';
  }
  try {
    const raw = localStorage.getItem(APP_THEME_STORAGE_KEY);
    return raw === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function storeAppTheme(theme: AppTheme): void {
  if (typeof localStorage === 'undefined') {
    return;
  }
  try {
    localStorage.setItem(APP_THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore quota / private mode */
  }
}

export function applyAppTheme(theme: AppTheme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');
  root.classList.toggle('light', theme === 'light');
}

export function mermaidThemeForAppTheme(theme: AppTheme): 'dark' | 'default' {
  return theme === 'light' ? 'default' : 'dark';
}

export function initMermaidForTheme(theme: AppTheme): void {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: mermaidThemeForAppTheme(theme),
  });
}
