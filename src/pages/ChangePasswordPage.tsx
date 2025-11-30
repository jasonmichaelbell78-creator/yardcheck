import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Lock, Loader2 } from 'lucide-react';
import { updatePassword } from 'firebase/auth';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/config/firebase';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const { user, inspector, clearMustChangePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate passwords
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!user || !inspector) {
      setError('You must be logged in to change your password.');
      return;
    }

    setLoading(true);

    try {
      // Update password in Firebase Auth
      await updatePassword(user, newPassword);

      // Update mustChangePassword flag in Firestore
      const inspectorRef = doc(db, 'inspectors', inspector.id);
      await updateDoc(inspectorRef, {
        mustChangePassword: false,
        updatedAt: Timestamp.now(),
      });

      // Update local state so we don't get redirected back
      clearMustChangePassword();

      // Navigate to trucks page
      navigate('/trucks');
    } catch (err) {
      const firebaseError = err as { code?: string; message?: string };
      switch (firebaseError.code) {
        case 'auth/weak-password':
          setError('Password is too weak. Please choose a stronger password.');
          break;
        case 'auth/requires-recent-login':
          setError('Session expired. Please log in again and retry.');
          break;
        case 'auth/network-request-failed':
          setError('Network error. Please check your connection.');
          break;
        default:
          setError('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-2xl mb-4">
            <Truck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-primary">YardCheck</h1>
          <p className="text-muted-foreground mt-2">Change Your Password</p>
        </div>

        {/* Change Password Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              Set New Password
            </CardTitle>
            <CardDescription>
              You must change your password before continuing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Minimum 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  minLength={8}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading || !newPassword || !confirmPassword}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Changing Password...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
