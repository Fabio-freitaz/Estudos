import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import HistoryPage from './pages/HistoryPage';
import LandingPage from './pages/LandingPage';
import MaterialDetailPage from './pages/MaterialDetailPage';
import MaterialUploadPage from './pages/MaterialUploadPage';
import MaterialsPage from './pages/MaterialsPage';
import QuizPage from './pages/QuizPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/materials/new" element={<MaterialUploadPage />} />
            <Route path="/materials/:id" element={<MaterialDetailPage />} />
            <Route path="/materials/:id/quiz" element={<QuizPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
