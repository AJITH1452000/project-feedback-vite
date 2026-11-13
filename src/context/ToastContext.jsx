import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { toastStyles } from '../styles/common.js';

const ToastContext = createContext({ notify: () => {} });

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const notify = useCallback((message, severity = 'success') => {
    setToast({ message, severity, key: Date.now() });
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar
        key={toast?.key}
        open={Boolean(toast)}
        autoHideDuration={3800}
        onClose={(_, reason) => { if (reason !== 'clickaway') setToast(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={toastStyles.snackbar}
      >
        {toast ? (
          <Alert severity={toast.severity} variant="filled" onClose={() => setToast(null)} sx={toastStyles.alert}>
            {toast.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
