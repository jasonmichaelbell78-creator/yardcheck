import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ConnectionProvider } from '@/contexts/ConnectionContext';
import { LoginPage } from '@/pages/LoginPage';
import { TruckEntryPage } from '@/pages/TruckEntryPage';
import { InspectionPage } from '@/pages/InspectionPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { UpdatePrompt } from '@/components/UpdatePrompt';

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
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
