import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Trash2, Edit2, Loader2, AlertCircle, Mail, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { useAuth } from '@/contexts/AuthContext';
import {
  subscribeToEmailRecipients,
  addEmailRecipient,
  updateEmailRecipient,
  deleteEmailRecipient,
} from '@/services/emailRecipientService';
import type { EmailRecipient } from '@/types';

export function AdminEmailRecipientsPage() {
  const navigate = useNavigate();
  const { currentInspector } = useAuth();
  const [recipients, setRecipients] = useState<EmailRecipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add recipient form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [addingRecipient, setAddingRecipient] = useState(false);
  
  // Edit state
  const [editingRecipient, setEditingRecipient] = useState<EmailRecipient | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  
  // Delete confirmation
  const [deletingRecipient, setDeletingRecipient] = useState<EmailRecipient | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToEmailRecipients(
      (data) => {
        setRecipients(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleAddRecipient = async () => {
    if (!newName.trim() || !newEmail.trim()) return;
    
    setAddingRecipient(true);
    setError(null);
    
    try {
      await addEmailRecipient(newName.trim(), newEmail.trim());
      setNewName('');
      setNewEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add recipient');
    } finally {
      setAddingRecipient(false);
    }
  };

  const handleStartEdit = (recipient: EmailRecipient) => {
    setEditingRecipient(recipient);
    setEditName(recipient.name);
    setEditEmail(recipient.email);
  };

  const handleCancelEdit = () => {
    setEditingRecipient(null);
    setEditName('');
    setEditEmail('');
  };

  const handleSaveEdit = async () => {
    if (!editingRecipient || !editName.trim() || !editEmail.trim()) return;
    
    setSavingEdit(true);
    setError(null);
    
    try {
      await updateEmailRecipient(editingRecipient.id, {
        name: editName.trim(),
        email: editEmail.trim(),
      });
      setEditingRecipient(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipient');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleStartDelete = (recipient: EmailRecipient) => {
    setDeletingRecipient(recipient);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRecipient) return;
    
    setConfirmingDelete(true);
    setError(null);
    
    try {
      await deleteEmailRecipient(deletingRecipient.id);
      setDeletingRecipient(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipient');
    } finally {
      setConfirmingDelete(false);
    }
  };

  if (!currentInspector) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="bg-primary text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="text-white hover:bg-white/10 -ml-2"
            >
              <ArrowLeft className="w-5 h-5 mr-1" />
              Back to Admin
            </Button>
            <ConnectionStatus />
          </div>
          <div className="flex items-center gap-3">
            <Mail className="w-6 h-6" />
            <div>
              <h1 className="font-bold text-xl">Email Recipients</h1>
              <p className="text-sm text-white/80">
                Manage email notification recipients
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {error && (
          <Card className="mb-4 border-destructive bg-destructive/10">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Recipient Form */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Add New Recipient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={addingRecipient}
              />
              <Input
                type="email"
                placeholder="Email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={addingRecipient}
              />
            </div>
            <Button
              onClick={handleAddRecipient}
              disabled={!newName.trim() || !newEmail.trim() || addingRecipient}
            >
              {addingRecipient ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Add Recipient
            </Button>
          </CardContent>
        </Card>

        {/* Recipients List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              Recipients ({recipients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : recipients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No email recipients yet. Add one above.
              </p>
            ) : (
              <div className="space-y-3">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-background"
                  >
                    {editingRecipient?.id === recipient.id ? (
                      <div className="flex-1 flex flex-col sm:flex-row gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Name"
                          className="flex-1"
                        />
                        <Input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="Email"
                          className="flex-1"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
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
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className="font-medium">{recipient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {recipient.email}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEdit(recipient)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStartDelete(recipient)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingRecipient} onClose={() => setDeletingRecipient(null)}>
        <DialogContent onClose={() => setDeletingRecipient(null)}>
          <DialogHeader>
            <DialogTitle>Delete Recipient</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <strong>{deletingRecipient?.name}</strong> ({deletingRecipient?.email})?
            This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingRecipient(null)}
              disabled={confirmingDelete}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={confirmingDelete}
            >
              {confirmingDelete ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
