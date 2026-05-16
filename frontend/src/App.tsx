import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './store/auth';
import { CycleProvider } from './store/cycle';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import HelpPage from './pages/HelpPage';
import MyGoalsPage from './pages/MyGoalsPage';
import TeamPage from './pages/TeamPage';
import AdminPage from './pages/AdminPage';
import AuditPage from './pages/AuditPage';
import AnalyticsPage from './pages/AnalyticsPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <CycleProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route element={<Layout />}>
                <Route path="/my-goals" element={<MyGoalsPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="*" element={<Navigate to="/my-goals" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CycleProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
