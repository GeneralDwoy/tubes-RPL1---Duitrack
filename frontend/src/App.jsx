import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/providers/auth-provider';

import WelcomePage from '@/pages/welcome';
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import ForgotPasswordPage from '@/pages/forgot-password';
import UpdatePasswordPage from '@/pages/update-password';
import DashboardPage from '@/pages/dashboard';
import TransactionsPage from '@/pages/transactions';
import AddTransactionPage from '@/pages/add-transaction';
import CategoriesPage from '@/pages/categories';
import ReportsPage from '@/pages/reports';
import ProfilePage from '@/pages/profile';
import NotificationsPage from '@/pages/notifications';

function IndexRedirect() {
  const { loading, session } = useAuth();
  if (loading) return null;
  return session ? <Navigate to="/dashboard" replace /> : <Navigate to="/welcome" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexRedirect />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/update-password" element={<UpdatePasswordPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/add-transaction" element={<AddTransactionPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
