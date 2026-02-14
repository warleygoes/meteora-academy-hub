import React, { useState, useEffect } from 'react';
import { Globe, Bell, Shield, Key } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { logSystemEvent } from '@/lib/systemLog';
import { supabase } from '@/integrations/supabase/client';

const AdminSettings: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    platformName: 'Meteora Academy',
    supportEmail: 'soporte@meteoraacademy.com',
    autoApprove: false,
    emailNotifications: true,
    newUserNotification: true,
    paymentNotification: true,
    maintenanceMode: false,
  });

  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiKeyLoaded, setOpenaiKeyLoaded] = useState(false);
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    const fetchOpenaiKey = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'openai_api_key')
        .single();
      if (data?.value) setOpenaiKey(data.value);
      setOpenaiKeyLoaded(true);
    };
    fetchOpenaiKey();
  }, []);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    logSystemEvent({ action: 'Configuración guardada', entity_type: 'settings', level: 'info' });
    toast({ title: t('settingsSaved') });
  };

  const saveOpenaiKey = async () => {
    setSavingKey(true);
    const { error } = await supabase
      .from('platform_settings')
      .upsert({ key: 'openai_api_key', value: openaiKey, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    
    if (error) {
      toast({ title: 'Erro ao salvar chave', description: error.message, variant: 'destructive' });
    } else {
      logSystemEvent({ action: 'OpenAI API key atualizada', entity_type: 'settings', level: 'info' });
      toast({ title: 'Chave OpenAI salva com sucesso' });
    }
    setSavingKey(false);
  };

  return (
    <div>
      <h2 className="text-xl font-display font-bold text-foreground mb-2">{t('settingsTitle')}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t('settingsDesc')}</p>

      <div className="space-y-6 max-w-2xl">
        {/* OpenAI Integration */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">OpenAI API</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Chave utilizada para tradução automática de categorias e outros recursos de IA da plataforma.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">API Key</label>
              <Input
                type="password"
                value={openaiKey}
                onChange={e => setOpenaiKey(e.target.value)}
                className="bg-secondary border-border font-mono text-sm"
                placeholder={openaiKeyLoaded ? 'sk-...' : 'Carregando...'}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Obtenha sua chave em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com/api-keys</a>
              </p>
            </div>
            <Button onClick={saveOpenaiKey} disabled={savingKey} size="sm">
              {savingKey ? 'Salvando...' : 'Salvar Chave OpenAI'}
            </Button>
          </div>
        </div>

        {/* General */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">{t('generalSettings')}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('platformName')}</label>
              <Input value={settings.platformName} onChange={e => updateSetting('platformName', e.target.value)} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('supportEmail')}</label>
              <Input value={settings.supportEmail} onChange={e => updateSetting('supportEmail', e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">{t('notifications')}</h3>
          </div>
          <div className="space-y-4">
            {[
              { key: 'emailNotifications', label: t('emailNotifications') },
              { key: 'newUserNotification', label: t('newUserNotification') },
              { key: 'paymentNotification', label: t('paymentNotification') },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{item.label}</span>
                <Switch checked={(settings as any)[item.key]} onCheckedChange={v => updateSetting(item.key, v)} />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">{t('security')}</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-foreground">{t('autoApprove')}</span>
                <p className="text-xs text-muted-foreground">{t('autoApproveDesc')}</p>
              </div>
              <Switch checked={settings.autoApprove} onCheckedChange={v => updateSetting('autoApprove', v)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-foreground">{t('maintenanceMode')}</span>
                <p className="text-xs text-muted-foreground">{t('maintenanceModeDesc')}</p>
              </div>
              <Switch checked={settings.maintenanceMode} onCheckedChange={v => updateSetting('maintenanceMode', v)} />
            </div>
          </div>
        </div>

        <Button onClick={saveSettings} className="w-full">{t('saveSettings')}</Button>
      </div>
    </div>
  );
};

export default AdminSettings;
