import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import mermaid from 'mermaid';
import '@xyflow/react/dist/style.css';
import App from './App';
import './index.css';

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  theme: 'dark',
});

const el = document.getElementById('root');
if (!el) {
  throw new Error('Missing #root');
}

createRoot(el).render(
  <StrictMode>
    <App />
  </StrictMode>
);
