import { ThemeProvider, CssBaseline } from '@mui/material';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme/theme';
import { Dashboard } from './pages/Dashboard';
import { WorkOrderDetail } from './pages/WorkOrderDetail';
import { PermitsList } from './pages/PermitsList';
import { PermitViewer } from './pages/PermitViewer';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/workorders" replace />} />
          <Route path="/workorders" element={<Dashboard />} />
          <Route path="/workorders/:id" element={<WorkOrderDetail />} />
          <Route path="/workorders/:id/permits" element={<PermitsList />} />
          <Route path="/permits/:id" element={<PermitViewer />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

