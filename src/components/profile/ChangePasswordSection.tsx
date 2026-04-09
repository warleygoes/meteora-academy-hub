import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Save, Eye, EyeOff } from 'lucide-react';

const ChangePasswordSection: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: t('passwordMinLength'), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('passwordsMismatch'), variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: t('errorOccurred'), description: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('passwordChanged') });
      setNewPassword('');
      setConfirmPassword('');
    }
    setSaving(false);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Lock className="w-5 h-5" />
          {t('changePassword')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <Button
          onClick={handleChangePassword}
          disabled={saving || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          className="w-full mt-2"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? t('loading') + '...' : t('changePassword')}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ChangePasswordSection;
