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

      // Helper function to invoke reset-user-password and parse errors cleanly
      const tryReset = async (payload: { userId?: string; email?: string; newPassword: string }) => {
        const { data, error } = await supabase.functions.invoke('reset-user-password', {
          body: payload,
        });

        if (!error && !data?.error) {
          return { ok: true, error: null };
        }

        let errMsg = data?.error || '';
        if (error) {
          try {
            if ('context' in error && typeof (error as any).context?.json === 'function') {
              const json = await (error as any).context.json();
              if (json?.error) errMsg = json.error;
            }
          } catch { /* ignore */ }
          if (!errMsg) errMsg = error.message;
        }
        return { ok: false, error: errMsg };
      };

      // Attempt 1: Try with userId + email (Most reliable for existing auth users)
      if (userId) {
        const res1 = await tryReset({ userId, email: cleanEmail, newPassword });
        if (res1.ok) {
          resetSuccess = true;
        } else {
          lastErrorMessage = res1.error || '';
        }
      }

      // Attempt 2: Try with email only (for users where userId wasn't provided or differed)
      if (!resetSuccess) {
        const res2 = await tryReset({ email: cleanEmail, newPassword });
        if (res2.ok) {
          resetSuccess = true;
        } else {
          if (res2.error) lastErrorMessage = res2.error;
        }
      }

      // Attempt 3: Try with raw userEmail (untrimmed/original case) if cleanEmail failed
      if (!resetSuccess && userEmail && userEmail !== cleanEmail) {
        const res3 = await tryReset({ email: userEmail.trim(), newPassword });
        if (res3.ok) {
          resetSuccess = true;
        } else {
          if (res3.error) lastErrorMessage = res3.error;
        }
      }

      // Attempt 4: If user does not exist in auth.users at all (only in profiles), create their auth user with the new password
      if (!resetSuccess && (lastErrorMessage.includes('User not found') || lastErrorMessage.includes('não encontrado'))) {
        const { data: importData, error: importError } = await supabase.functions.invoke('import-users', {
          body: {
            users: [{ name: cleanEmail.split('@')[0], email: cleanEmail }],
            defaultPassword: newPassword,
          },
        });

        if (!importError && importData?.created > 0) {
          resetSuccess = true;
        } else if (importData?.exists > 0) {
          // If import-users reports exists > 0, the email DOES exist in auth.users, but reset-user-password couldn't update it.
          // Throw explicit error so we never fake success when password wasn't changed!
          throw new Error(`O usuário ${cleanEmail} existe, mas não foi possível atualizar a senha no sistema de autenticação. Verifique se o e-mail está correto.`);
        } else if (importError || importData?.error) {
          throw new Error(importData?.error || importError?.message || lastErrorMessage);
        }
      }

      if (!resetSuccess) {
        throw new Error(lastErrorMessage || 'Erro ao atualizar a senha.');
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
