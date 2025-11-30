import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ConnectionProvider } from '@/contexts/ConnectionContext';
import { LoginPage } from '@/pages/LoginPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { TruckEntryPage } from '@/pages/TruckEntryPage';
import { InspectionPage } from '@/pages/InspectionPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { AdminEmailRecipientsPage } from '@/pages/AdminEmailRecipientsPage';
import { UpdatePrompt } from '@/components/UpdatePrompt';
import { Loader2 } from 'lucide-react';

// Loading component
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="mt-2 text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, mustChangePassword } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  // If user must change password, redirect to change password page
  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }
  
  return <>{children}</>;
}

// Route that requires auth but allows mustChangePassword
function PasswordChangeRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

// Public route - redirects to trucks if already authenticated
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, mustChangePassword, inspector } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  if (isAuthenticated) {
    if (mustChangePassword) {
      return <Navigate to="/change-password" replace />;
    }
    // Redirect admins to admin dashboard, others to trucks
    if (inspector?.isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/trucks" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <PasswordChangeRoute>
            <ChangePasswordPage />
          </PasswordChangeRoute>
        }
      />
      <Route
        path="/trucks"
        element={
          <ProtectedRoute>
            <TruckEntryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/inspection/:id"
        element={
          <ProtectedRoute>
            <InspectionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/email-recipients"
        element={
          <ProtectedRoute>
            <AdminEmailRecipientsPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ConnectionProvider>
      <AuthProvider>
        <Router>
          <AppRoutes />
          <UpdatePrompt />
        </Router>
      </AuthProvider>
    </ConnectionProvider>
  );
}

export default App;
