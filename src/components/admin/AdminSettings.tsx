import React, { useState, useEffect } from 'react';
import { Globe, Bell, Shield, Key, ChevronDown, Database, Download } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { logSystemEvent } from '@/lib/systemLog';
import { supabase } from '@/integrations/supabase/client';
import AdminWebhooks from './AdminWebhooks';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const SettingsSection: React.FC<{ icon: React.ReactNode; title: string; defaultOpen?: boolean; children: React.ReactNode }> = ({ icon, title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-6 hover:bg-secondary/30 transition-colors">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-display font-semibold text-foreground">{title}</h3>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-6 pb-6 pt-0">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

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

      <div className="space-y-3 max-w-2xl">
        {/* OpenAI Integration */}
        <SettingsSection icon={<Key className="w-5 h-5 text-primary" />} title="OpenAI API">
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
        </SettingsSection>

        {/* General */}
        <SettingsSection icon={<Globe className="w-5 h-5 text-primary" />} title={t('generalSettings')}>
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
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection icon={<Bell className="w-5 h-5 text-primary" />} title={t('notifications')}>
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
        </SettingsSection>

        {/* Security */}
        <SettingsSection icon={<Shield className="w-5 h-5 text-primary" />} title={t('security')}>
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
        </SettingsSection>

        {/* Database Export */}
        <SettingsSection icon={<Database className="w-5 h-5 text-primary" />} title="Exportar Base de Datos">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Descarga un archivo SQL completo con todos los datos (INSERT INTO) de todas las tablas del sistema.
            </p>
            <Button
              variant="outline"
              className="gap-2"
              onClick={async () => {
                try {
                  toast({ title: 'Generando dump...', description: 'Esto puede tardar unos segundos.' });
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) {
                    toast({ title: 'Error', description: 'Debes estar autenticado.', variant: 'destructive' });
                    return;
                  }
                  const res = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pg-dump-export`,
                    {
                      headers: {
                        Authorization: `Bearer ${session.access_token}`,
                        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                      },
                    }
                  );
                  if (!res.ok) {
                    const err = await res.json();
                    toast({ title: 'Error', description: err.error || 'Error al exportar', variant: 'destructive' });
                    return;
                  }
                  const blob = await res.blob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `pg_dump_data_${new Date().toISOString().slice(0, 10)}.sql`;
                  a.click();
                  URL.revokeObjectURL(url);
                  toast({ title: 'Éxito', description: 'Archivo SQL descargado correctamente.' });
                } catch (e: any) {
                  toast({ title: 'Error', description: e.message, variant: 'destructive' });
                }
              }}
            >
              <Download className="w-4 h-4" />
              Descargar pg_dump completo (SQL)
            </Button>
          </div>
        </SettingsSection>

        <Button onClick={saveSettings} className="w-full">{t('saveSettings')}</Button>

        {/* Webhooks & Events */}
        <AdminWebhooks />
      </div>
    </div>
  );
};

export default AdminSettings;
