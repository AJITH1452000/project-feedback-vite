import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './app/App.jsx';
import { queryClient } from './lib/queryClient.js';
import { ThemeModeProvider } from './context/ThemeModeContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { DataProvider } from './context/DataContext.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeModeProvider>
          <ToastProvider>
            <AuthProvider>
              <DataProvider>
                <App />
              </DataProvider>
            </AuthProvider>
          </ToastProvider>
        </ThemeModeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
