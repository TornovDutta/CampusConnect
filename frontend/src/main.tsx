import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.tsx'
import './index.css'
import { reportFrontendIssue } from './services/api'

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    reportFrontendIssue({
      feature: 'Frontend UI',
      message: event.message || 'Unhandled script error',
      severity: 'error',
      endpoint: window.location.pathname,
      error_type: event.error?.name || 'Error',
      stack_trace: event.error?.stack || `${event.filename}:${event.lineno}:${event.colno}`,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      typeof reason === 'string'
        ? reason
        : reason?.message || 'Unhandled promise rejection';
    reportFrontendIssue({
      feature: 'Frontend UI',
      message,
      severity: 'error',
      endpoint: window.location.pathname,
      error_type: reason?.name || 'UnhandledRejection',
      stack_trace: reason?.stack,
    });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
