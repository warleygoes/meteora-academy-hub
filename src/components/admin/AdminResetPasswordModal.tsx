import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
  userId: string;
}

const AdminResetPasswordModal: React.FC<Props> = ({ open, onOpenChange, userEmail, userId }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      toast({ title: t('passwordMinLength'), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('passwordsMismatch'), variant: 'destructive' });
      return;
    }

    const cleanEmail = userEmail ? userEmail.trim().toLowerCase() : '';
    if (!cleanEmail) {
      toast({ title: 'E-mail do usuário é obrigatório.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      let resetSuccess = false;
      let lastErrorMessage = '';

      // 1. Try resetting password by email lookup on the edge function (omitting userId so edge function resolves auth.users by email)
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { email: cleanEmail, newPassword },
      });

      if (!error && !data?.error) {
        resetSuccess = true;
      } else {
        if (error) {
          try {
            if ('context' in error && typeof (error as any).context?.json === 'function') {
              const json = await (error as any).context.json();
              if (json?.error) lastErrorMessage = json.error;
            }
          } catch { /* ignore */ }
          if (!lastErrorMessage) lastErrorMessage = error.message;
        } else if (data?.error) {
          lastErrorMessage = data.error;
        }
      }

      // 2. If edge function couldn't find user by email alone, try passing userId
      if (!resetSuccess && userId) {
        const { data: retryData, error: retryError } = await supabase.functions.invoke('reset-user-password', {
          body: { userId, email: cleanEmail, newPassword },
        });

        if (!retryError && !retryData?.error) {
          resetSuccess = true;
        } else if (retryError || retryData?.error) {
          let retryMsg = retryData?.error;
          if (retryError) {
            try {
              if ('context' in retryError && typeof (retryError as any).context?.json === 'function') {
                const json = await (retryError as any).context.json();
                if (json?.error) retryMsg = json.error;
              }
            } catch { /* ignore */ }
            if (!retryMsg) retryMsg = retryError.message;
          }
          if (retryMsg) lastErrorMessage = retryMsg;
        }
      }

      // 3. If user does not exist in auth.users at all (e.g. imported profile), create their auth account with the new password
      if (!resetSuccess && (lastErrorMessage.includes('User not found') || lastErrorMessage.includes('não encontrado'))) {
        const { data: importData, error: importError } = await supabase.functions.invoke('import-users', {
          body: {
            users: [{ name: cleanEmail.split('@')[0], email: cleanEmail }],
            defaultPassword: newPassword,
          },
        });

        if (!importError && (importData?.created > 0 || importData?.exists > 0)) {
          resetSuccess = true;
        } else if (importError || importData?.error) {
          throw new Error(importData?.error || importError?.message || lastErrorMessage);
        }
      } else if (!resetSuccess) {
        throw new Error(lastErrorMessage || 'Error al actualizar la contraseña');
      }

      toast({ title: t('resetPasswordSuccess') });
      setNewPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: t('resetPasswordError'), description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('resetPassword')}</DialogTitle>
          <DialogDescription>{userEmail}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('newPassword')}</Label>
            <div className="relative">
              <Input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder={t('newPasswordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('confirmPassword')}</Label>
            <div className="relative">
              <Input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={t('confirmPasswordPlaceholder')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-destructive">{t('passwordsMismatch')}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          >
            {saving ? t('loading') + '...' : t('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminResetPasswordModal;
