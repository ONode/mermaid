import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@xyflow/react/dist/style.css';
import App from './App';
import './index.css';
import { applyAppTheme, initMermaidForTheme, readStoredAppTheme } from './theme/appTheme';

const initialTheme = readStoredAppTheme();
applyAppTheme(initialTheme);
initMermaidForTheme(initialTheme);

const el = document.getElementById('root');
if (!el) {
  throw new Error('Missing #root');
}

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>
);
