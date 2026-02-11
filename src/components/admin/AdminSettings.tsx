import React, { useState } from 'react';
import { Settings, Globe, Bell, Shield, Palette } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

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

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    toast({ title: t('settingsSaved') });
  };

  return (
    <div>
      <h2 className="text-xl font-display font-bold text-foreground mb-2">{t('settingsTitle')}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t('settingsDesc')}</p>

      <div className="space-y-6 max-w-2xl">
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
