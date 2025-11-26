import { useState, useEffect } from 'react';
import { UserPlus, UserMinus, UserCheck, Loader2, AlertCircle, Edit2, Save, X } from 'lucide-react';
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
  addInspector,
  deactivateInspector,
  reactivateInspector,
  updateInspector,
  MAX_ACTIVE_INSPECTORS,
} from '@/services/inspectorService';
import type { Inspector } from '@/types';

interface ManageInspectorsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ManageInspectorsModal({ open, onClose }: ManageInspectorsModalProps) {
  const [inspectors, setInspectors] = useState<Inspector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add inspector form
  const [newName, setNewName] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [addingInspector, setAddingInspector] = useState(false);
  
  // Edit state
  const [editingInspector, setEditingInspector] = useState<Inspector | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Confirmation dialog
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deactivate' | 'reactivate';
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

  const activeCount = inspectors.filter(i => i.active).length;

  const handleAddInspector = async () => {
    if (!newName.trim()) return;
    
    setAddingInspector(true);
    setError(null);
    
    try {
      await addInspector(newName.trim(), newIsAdmin);
      setNewName('');
      setNewIsAdmin(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add inspector');
    } finally {
      setAddingInspector(false);
    }
  };

  const handleDeactivate = async (inspector: Inspector) => {
    setActionLoading(inspector.id);
    setError(null);
    
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
    
    try {
      await reactivateInspector(inspector.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reactivate inspector');
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const handleStartEdit = (inspector: Inspector) => {
    setEditingInspector(inspector);
    setEditEmail(inspector.email || '');
  };

  const handleCancelEdit = () => {
    setEditingInspector(null);
    setEditEmail('');
  };

  const handleSaveEmail = async () => {
    if (!editingInspector) return;
    
    setSavingEdit(true);
    setError(null);
    
    try {
      await updateInspector(editingInspector.id, { email: editEmail.trim() });
      setEditingInspector(null);
      setEditEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update email');
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmAndExecute = () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === 'deactivate') {
      handleDeactivate(confirmAction.inspector);
    } else {
      handleReactivate(confirmAction.inspector);
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

          {/* Add Inspector Form */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium text-sm">Add New Inspector</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Inspector name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={addingInspector}
                className="flex-1"
              />
              <Button
                onClick={handleAddInspector}
                disabled={!newName.trim() || addingInspector || activeCount >= MAX_ACTIVE_INSPECTORS}
              >
                {addingInspector ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </Button>
            </div>
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
            <p className="text-xs text-muted-foreground">
              Active inspectors: {activeCount}/{MAX_ACTIVE_INSPECTORS}
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
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{inspector.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {inspector.isAdmin ? 'Admin' : 'Inspector'}
                            {inspector.email && ` • ${inspector.email}`}
                          </p>
                          {editingInspector?.id === inspector.id && (
                            <div className="flex items-center gap-2 mt-2">
                              <Input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                placeholder="Email address"
                                className="flex-1 text-sm"
                              />
                              <Button
                                size="sm"
                                onClick={handleSaveEmail}
                                disabled={savingEdit}
                              >
                                {savingEdit ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        {editingInspector?.id !== inspector.id && (
                          <div className="flex gap-2">
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
                              onClick={() => setConfirmAction({ type: 'deactivate', inspector })}
                              disabled={actionLoading === inspector.id}
                            >
                              {actionLoading === inspector.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <UserMinus className="w-4 h-4 mr-1" />
                                  Deactivate
                                </>
                              )}
                            </Button>
                          </div>
                        )}
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
                        <div>
                          <p className="font-medium">{inspector.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {inspector.isAdmin ? 'Admin' : 'Inspector'} • Inactive
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmAction({ type: 'reactivate', inspector })}
                          disabled={actionLoading === inspector.id || activeCount >= MAX_ACTIVE_INSPECTORS}
                        >
                          {actionLoading === inspector.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              Reactivate
                            </>
                          )}
                        </Button>
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

      {/* Confirmation Dialog */}
      <Dialog open={!!confirmAction} onClose={() => setConfirmAction(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === 'deactivate' ? 'Deactivate' : 'Reactivate'} Inspector
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to {confirmAction?.type === 'deactivate' ? 'deactivate' : 'reactivate'}{' '}
            <strong>{confirmAction?.inspector.name}</strong>?
            {confirmAction?.type === 'deactivate' && (
              <span className="block mt-2">
                They will no longer be able to log in or perform inspections.
              </span>
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
              {confirmAction?.type === 'deactivate' ? 'Deactivate' : 'Reactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
