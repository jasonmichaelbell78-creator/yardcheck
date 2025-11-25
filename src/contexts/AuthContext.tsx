import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Inspector, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentInspector, setCurrentInspectorState] = useState<Inspector | null>(() => {
    // Try to restore from session storage
    const stored = sessionStorage.getItem('currentInspector');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  const setCurrentInspector = useCallback((inspector: Inspector | null) => {
    setCurrentInspectorState(inspector);
    if (inspector) {
      sessionStorage.setItem('currentInspector', JSON.stringify(inspector));
    } else {
      sessionStorage.removeItem('currentInspector');
    }
  }, []);

  const value: AuthContextType = {
    currentInspector,
    setCurrentInspector,
    isAuthenticated: currentInspector !== null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
