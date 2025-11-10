import { Alert, Snackbar } from '@mui/material';

interface ErrorAlertProps {
  message: string;
  open: boolean;
  onClose: () => void;
  severity?: 'error' | 'warning' | 'info' | 'success';
}

export const ErrorAlert = ({ message, open, onClose, severity = 'error' }: ErrorAlertProps) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: '100%' }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

