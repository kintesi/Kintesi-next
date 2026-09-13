import React from 'react';
import ReactDOM from 'react-dom/client';
import { toast } from 'sonner';
import App from './App';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

// Strict rule: Suppress all toast notifications on mobile screens (< 768px)
if (typeof window !== 'undefined') {
  const isMobile = () => window.innerWidth < 768;
  const methods = ['success', 'info', 'warning', 'error', 'message', 'custom', 'promise', 'loading'] as const;

  methods.forEach((method) => {
    const original = (toast as any)[method];
    if (typeof original === 'function') {
      (toast as any)[method] = (...args: any[]) => {
        if (isMobile()) return '';
        return original(...args);
      };
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
