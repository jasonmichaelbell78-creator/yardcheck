import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, UserCheck, Loader2, AlertCircle, Edit2, Save, X, KeyRound } from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  subscribeToAllInspectors,
  deactivateInspector,
  reactivateInspector,
  updateInspector,
  MAX_ACTIVE_INSPECTORS,
} from '@/services/inspectorService';
import { functions } from '@/config/firebase';
import type { Inspector } from '@/types';

interface ManageInspectorsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ManageInspectorsModal({ open, onClose }: ManageInspectorsModalProps) {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Add inspector form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [addingInspector, setAddingInspector] = useState(false);
  
  // Edit inspector state
  const [editingInspector, setEditingInspector] = useState<Inspector | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Reset password loading state
  const [resetPasswordLoading, setResetPasswordLoading] = useState<string | null>(null);
  
  // Confirmation dialog
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deactivate' | 'reactivate' | 'reset-password';
    inspector: Inspector;
  } | null>(null);

  useEffect(() => {
    if (!open) return;
    
    const unsubscribe = subscribeToAllInspectors(
      (data) => {
        setInspectors(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [open]);

  // Clear messages when modal closes
  useEffect(() => {
    if (!open) {
      setError(null);
      setSuccessMessage(null);
    }
  }, [open]);

  const activeCount = inspectors.filter(i => i.active).length;

  const handleAddInspector = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    
    setAddingInspector(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Call the Cloud Function to create inspector account
      const createInspectorAccount = httpsCallable<
        { name: string; email: string; isAdmin: boolean },
        { success: boolean; message: string; inspectorId: string }
      >(functions, 'createInspectorAccount');
      
      const result = await createInspectorAccount({
        name: newName.trim(),
        email: newEmail.trim(),
        isAdmin: newIsAdmin,
      });
      
      setNewName('');
      setNewEmail('');
      setNewIsAdmin(false);
      setSuccessMessage(result.data.message);
    } catch (err) {
      const error = err as { message?: string; code?: string };
      setError(error.message || 'Failed to add inspector');
    } finally {
      setAddingInspector(false);
    }
  };

  const handleStartEdit = (inspector: Inspector) => {
    setEditingInspector(inspector);
    setEditName(inspector.name);
    setEditEmail(inspector.email || '');
    setEditIsAdmin(inspector.isAdmin);
  };

  const handleSaveEdit = async () => {
    if (!editingInspector || !editName.trim()) return;
    
    setSavingEdit(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await updateInspector(editingInspector.id, {
        name: editName.trim(),
        email: editEmail.trim() || undefined,
        isAdmin: editIsAdmin,
      });
      setEditingInspector(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update inspector');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeactivate = async (inspector: Inspector) => {
    setActionLoading(inspector.id);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await deactivateInspector(inspector.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deactivate inspector');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleReactivate = async (inspector: Inspector) => {
    setActionLoading(inspector.id);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await reactivateInspector(inspector.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate inspector');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleResetPassword = async (inspector: Inspector) => {
    setResetPasswordLoading(inspector.id);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const resetInspectorPassword = httpsCallable<
        { inspectorId: string },
        { success: boolean; message: string }
      >(functions, 'resetInspectorPassword');
      
      const result = await resetInspectorPassword({
        inspectorId: inspector.id,
      });
      
      setSuccessMessage(result.data.message);
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || 'Failed to reset password');
    } finally {
      setResetPasswordLoading(null);
      setConfirmAction(null);
    }
  };

  const confirmAndExecute = () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === 'deactivate') {
      handleDeactivate(confirmAction.inspector);
    } else if (confirmAction.type === 'reactivate') {
      handleReactivate(confirmAction.inspector);
    } else if (confirmAction.type === 'reset-password') {
      handleResetPassword(confirmAction.inspector);
    }
  };

  // Separate active and inactive inspectors
  const activeInspectors = inspectors.filter(i => i.active);
  const inactiveInspectors = inspectors.filter(i => !i.active);

  return (
    <>
      <Dialog open={open} onClose={onClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Manage Inspectors</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-green-100 text-green-800 rounded-md text-sm">
              {successMessage}
            </div>
          )}

          {/* Add Inspector Form */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium text-sm">Add New Inspector</h3>
            <Input
              placeholder="Inspector name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={addingInspector}
            />
            <Input
              placeholder="Email (required for login)"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={addingInspector}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newIsAdmin}
                onChange={(e) => setNewIsAdmin(e.target.checked)}
                disabled={addingInspector}
                className="w-4 h-4 rounded border-input"
              />
              Is Admin
            </label>
            <Button
              onClick={handleAddInspector}
              disabled={!newName.trim() || !newEmail.trim() || addingInspector || activeCount >= MAX_ACTIVE_INSPECTORS}
              className="w-full"
            >
              {addingInspector ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Inspector
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Active inspectors: {activeCount}/{MAX_ACTIVE_INSPECTORS}
            </p>
            <p className="text-xs text-muted-foreground">
              New inspectors will use the stock password and must change it on first login.
            </p>
          </div>

          {/* Inspector Lists */}
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Active Inspectors */}
              <div>
                <h3 className="font-medium text-sm mb-2 text-green-700">
                  Active Inspectors ({activeInspectors.length})
                </h3>
                {activeInspectors.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No active inspectors</p>
                ) : (
                  <div className="space-y-2">
                    {activeInspectors.map((inspector) => (
                      <div
                        key={inspector.id}
                        className="flex items-center justify-between p-3 bg-background border rounded-lg"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{inspector.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {inspector.isAdmin ? 'Admin' : 'Inspector'}
                            {inspector.email && ` • ${inspector.email}`}
                            {inspector.mustChangePassword && (
                              <span className="ml-2 text-yellow-600">(Password change required)</span>
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2 flex-wrap justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit(inspector)}
                            title="Edit inspector"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmAction({ type: 'reset-password', inspector })}
                            disabled={resetPasswordLoading === inspector.id || !inspector.email}
                            title="Reset password"
                          >
                            {resetPasswordLoading === inspector.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <KeyRound className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmAction({ type: 'deactivate', inspector })}
                            disabled={actionLoading === inspector.id}
                            title="Deactivate inspector"
                          >
                            {actionLoading === inspector.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inactive Inspectors */}
              {inactiveInspectors.length > 0 && (
                <div>
                  <h3 className="font-medium text-sm mb-2 text-gray-500">
                    Inactive Inspectors ({inactiveInspectors.length})
                  </h3>
                  <div className="space-y-2">
                    {inactiveInspectors.map((inspector) => (
                      <div
                        key={inspector.id}
                        className="flex items-center justify-between p-3 bg-muted/30 border rounded-lg opacity-75"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{inspector.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {inspector.isAdmin ? 'Admin' : 'Inspector'} • Inactive
                            {inspector.email && ` • ${inspector.email}`}
                          </p>
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStartEdit(inspector)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmAction({ type: 'reactivate', inspector })}
                            disabled={actionLoading === inspector.id || activeCount >= MAX_ACTIVE_INSPECTORS}
                          >
                            {actionLoading === inspector.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Inspector Dialog */}
      <Dialog open={!!editingInspector} onClose={() => setEditingInspector(null)}>
        <DialogContent onClose={() => setEditingInspector(null)}>
          <DialogHeader>
            <DialogTitle>Edit Inspector</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={savingEdit}
            />
            <Input
              placeholder="Email (optional)"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              disabled={savingEdit}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={editIsAdmin}
                onChange={(e) => setEditIsAdmin(e.target.checked)}
                disabled={savingEdit}
                className="w-4 h-4 rounded border-input"
              />
              Is Admin
            </label>
          </div>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setEditingInspector(null)}
              disabled={savingEdit}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editName.trim() || savingEdit}
              className="flex-1"
            >
              {savingEdit ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onClose={() => setConfirmAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'deactivate' && 'Deactivate Inspector'}
              {confirmAction?.type === 'reactivate' && 'Reactivate Inspector'}
              {confirmAction?.type === 'reset-password' && 'Reset Password'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmAction?.type === 'deactivate' && (
              <>
                Are you sure you want to deactivate <strong>{confirmAction?.inspector.name}</strong>?
                <span className="block mt-2">
                  They will no longer be able to log in or perform inspections.
                </span>
              </>
            )}
            {confirmAction?.type === 'reactivate' && (
              <>
                Are you sure you want to reactivate <strong>{confirmAction?.inspector.name}</strong>?
              </>
            )}
            {confirmAction?.type === 'reset-password' && (
              <>
                Are you sure you want to reset the password for <strong>{confirmAction?.inspector.name}</strong>?
                <span className="block mt-2">
                  Their password will be reset to the default and they will need to change it on next login.
                </span>
              </>
            )}
          </p>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setConfirmAction(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              variant={confirmAction?.type === 'deactivate' ? 'destructive' : 'default'}
              onClick={confirmAndExecute}
              className="flex-1"
            >
              {confirmAction?.type === 'deactivate' && 'Deactivate'}
              {confirmAction?.type === 'reactivate' && 'Reactivate'}
              {confirmAction?.type === 'reset-password' && 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
