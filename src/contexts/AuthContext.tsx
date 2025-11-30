import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { Inspector, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [inspector, setInspector] = useState<Inspector | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Fetch inspector document by matching email
          const email = firebaseUser.email?.toLowerCase();
          if (email) {
            // We need to find inspector by email - query the inspectors collection
            const q = query(
              collection(db, 'inspectors'),
              where('email', '==', email),
              where('active', '==', true)
            );
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
              const inspectorDoc = snapshot.docs[0];
              const inspectorData = {
                id: inspectorDoc.id,
                ...inspectorDoc.data()
              } as Inspector;
              setInspector(inspectorData);
              setMustChangePassword(inspectorData.mustChangePassword ?? false);
            } else {
              // No matching inspector found - user exists in Auth but not in Firestore
              console.error('No matching inspector found for email:', email);
              setInspector(null);
              setMustChangePassword(false);
            }
          }
        } catch (error) {
          console.error('Error fetching inspector data:', error);
          setInspector(null);
          setMustChangePassword(false);
        }
      } else {
        setInspector(null);
        setMustChangePassword(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      // Re-throw with user-friendly message
      const firebaseError = error as { code?: string };
      switch (firebaseError.code) {
        case 'auth/invalid-email':
          throw new Error('Invalid email address format.');
        case 'auth/user-disabled':
          throw new Error('This account has been disabled.');
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          throw new Error('Invalid email or password.');
        case 'auth/too-many-requests':
          throw new Error('Too many failed login attempts. Please try again later.');
        case 'auth/network-request-failed':
          throw new Error('Network error. Please check your connection.');
        default:
          throw new Error('Login failed. Please try again.');
      }
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('Failed to log out. Please try again.');
    }
  }, []);

  const value: AuthContextType = {
    user,
    inspector,
    loading,
    mustChangePassword,
    login,
    logout,
    isAuthenticated: user !== null && inspector !== null,
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
