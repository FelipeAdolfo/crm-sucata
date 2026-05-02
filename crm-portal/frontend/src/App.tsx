import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Dashboard } from '@/pages/Dashboard';
import { Opportunities } from '@/pages/Opportunities';
import { OpportunityDetail } from '@/pages/OpportunityDetail';
import { Visits } from '@/pages/Visits';
import { MarketIntelligence } from '@/pages/MarketIntelligence';
import { Documents } from '@/pages/Documents';
import { Reports } from '@/pages/Reports';
import { Users } from '@/pages/Users';
import { UserApproval } from '@/pages/UserApproval';
import { Settings } from '@/pages/Settings';
import { Calls } from '@/pages/Calls';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/stores/auth';
import { useMe } from '@/hooks/useAuth';

// ============================================
// AUTH GUARD - Verifica se usuário está logado
// ============================================
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, token } = useAuthStore();
  const { isLoading } = useMe();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return <>{children}</>;
};

// ============================================
// ADMIN GUARD - Verifica se é administrador
// ============================================
const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();

  if (!user || !['ADMIN', 'DIRECTOR'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// ============================================
// PUBLIC ROUTE - Redireciona se já estiver logado
// ============================================
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, pendingApproval } = useAuthStore();

  if (isAuthenticated && !pendingApproval) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// ============================================
// PROTECTED LAYOUT - Com sidebar e header
// ============================================
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthGuard>
      <Layout>{children}</Layout>
    </AuthGuard>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============================================
            PUBLIC ROUTES
        ============================================ */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* ============================================
            PROTECTED ROUTES
        ============================================ */}
        <Route
          path="/dashboard"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/opportunities"
          element={
            <ProtectedLayout>
              <Opportunities />
            </ProtectedLayout>
          }
        />

        <Route
          path="/opportunities/:id"
          element={
            <ProtectedLayout>
              <OpportunityDetail />
            </ProtectedLayout>
          }
        />

        <Route
          path="/visits"
          element={
            <ProtectedLayout>
              <Visits />
            </ProtectedLayout>
          }
        />

        <Route
          path="/calls"
          element={
            <ProtectedLayout>
              <Calls />
            </ProtectedLayout>
          }
        />

        <Route
          path="/documents"
          element={
            <ProtectedLayout>
              <Documents />
            </ProtectedLayout>
          }
        />

        <Route
          path="/market-intel"
          element={
            <ProtectedLayout>
              <MarketIntelligence />
            </ProtectedLayout>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedLayout>
              <Reports />
            </ProtectedLayout>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedLayout>
              <Users />
            </ProtectedLayout>
          }
        />

        {/* ============================================
            ADMIN ONLY ROUTES
        ============================================ */}
        <Route
          path="/admin/user-approval"
          element={
            <ProtectedLayout>
              <AdminGuard>
                <UserApproval />
              </AdminGuard>
            </ProtectedLayout>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedLayout>
              <Settings />
            </ProtectedLayout>
          }
        />

        {/* ============================================
            DEFAULT REDIRECT
        ============================================ */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
