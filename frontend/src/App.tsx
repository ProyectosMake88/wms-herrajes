import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Movements from './pages/Movements';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Users from './pages/Users';
import SellerSales from './pages/SellerSales';
import Approvals from './pages/Approvals';
import RequestEntry from './pages/RequestEntry';
import { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#f0eef6]"><div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        {/* Home: Dashboard para admin, SellerSales para vendedor */}
        <Route index element={isAdmin ? <Dashboard /> : <SellerSales />} />
        <Route path="products" element={<Products />} />

        {/* Vendedor */}
        <Route path="request-entry" element={<RequestEntry />} />

        {/* Solo admin */}
        <Route path="categories" element={<AdminRoute><Categories /></AdminRoute>} />
        <Route path="movements" element={<AdminRoute><Movements /></AdminRoute>} />
        <Route path="approvals" element={<AdminRoute><Approvals /></AdminRoute>} />
        <Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />
        <Route path="alerts" element={<AdminRoute><Alerts /></AdminRoute>} />
        <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CompanyProvider>
          <AppRoutes />
        </CompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
