import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, UserPlus, Trash2, Edit2, Loader2, AlertCircle, Save, X } from 'lucide-react';
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
  const { inspector } = useAuth();
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
  const [deleteConfirm, setDeleteConfirm] = useState<EmailRecipient | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setDeleting(true);
    setError(null);

    try {
      await deleteEmailRecipient(deleteConfirm.id);
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete recipient');
    } finally {
      setDeleting(false);
    }
  };

  if (!inspector) {
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
            <Mail className="w-8 h-8" />
            <div>
              <h1 className="font-bold text-xl">Email Recipients</h1>
              <p className="text-sm text-white/80">
                Manage notification recipients
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto">
        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 text-destructive rounded-md text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Add Recipient Form */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Add New Recipient</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={addingRecipient}
            />
            <Input
              placeholder="Email address"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              disabled={addingRecipient}
            />
            <Button
              onClick={handleAddRecipient}
              disabled={!newName.trim() || !newEmail.trim() || addingRecipient}
              className="w-full"
            >
              {addingRecipient ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Recipient
                </>
              )}
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
              <p className="text-center text-muted-foreground py-8">
                No recipients configured yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{recipient.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {recipient.email}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartEdit(recipient)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteConfirm(recipient)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingRecipient} onClose={() => setEditingRecipient(null)}>
        <DialogContent onClose={() => setEditingRecipient(null)}>
          <DialogHeader>
            <DialogTitle>Edit Recipient</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              placeholder="Name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              disabled={savingEdit}
            />
            <Input
              placeholder="Email address"
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              disabled={savingEdit}
            />
          </div>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setEditingRecipient(null)}
              disabled={savingEdit}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editName.trim() || !editEmail.trim() || savingEdit}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogContent onClose={() => setDeleteConfirm(null)}>
          <DialogHeader>
            <DialogTitle>Delete Recipient</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?
            This action cannot be undone.
          </p>
          <DialogFooter className="flex-row gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirm(null)}
              disabled={deleting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
