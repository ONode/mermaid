import type { AppTheme } from '../theme/appTheme';

type ThemeToggleButtonProps = {
  theme: AppTheme;
  onToggle: () => void;
};

export function ThemeToggleButton({ theme, onToggle }: ThemeToggleButtonProps) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="app-header__theme-toggle"
      onClick={onToggle}
      aria-pressed={!isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
    >
      {isDark ? 'Light' : 'Dark'}
    </button>
  );
}
