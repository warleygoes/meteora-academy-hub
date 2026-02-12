import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, Save, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const countries = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica',
  'Cuba', 'Ecuador', 'El Salvador', 'Guatemala', 'Honduras', 'México',
  'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'República Dominicana',
  'Uruguay', 'Venezuela',
];

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState({
    display_name: '',
    email: '',
    phone: '',
    country: '',
    company_name: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, email, phone, country, company_name, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({
            display_name: data.display_name || '',
            email: data.email || '',
            phone: data.phone || '',
            country: data.country || '',
            company_name: data.company_name || '',
            avatar_url: data.avatar_url || '',
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: t('errorOccurred'), variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;
    
    await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('user_id', user.id);
    setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
    setUploading(false);
    toast({ title: t('profileSaved') });
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: profile.display_name,
        phone: profile.phone,
        country: profile.country,
        company_name: profile.company_name,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: t('errorOccurred'), variant: 'destructive' });
    } else {
      toast({ title: t('profileSaved') });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold font-display">{t('profile')}</h1>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">{t('profilePhoto')}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <div className="relative group">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                <User className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <Camera className="w-5 h-5 text-white" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </label>
          </div>
          <div className="text-sm text-muted-foreground">
            {t('profilePhotoHint')}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">{t('profileInfo')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{t('displayName')}</Label>
            <Input
              value={profile.display_name}
              onChange={e => setProfile(p => ({ ...p, display_name: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('email')}</Label>
            <Input value={profile.email} disabled className="opacity-60" />
          </div>

          <div className="space-y-2">
            <Label>{t('phone')}</Label>
            <Input
              value={profile.phone}
              onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
              placeholder={t('phonePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('country')}</Label>
            <Select value={profile.country} onValueChange={v => setProfile(p => ({ ...p, country: v }))}>
              <SelectTrigger><SelectValue placeholder={t('selectCountry')} /></SelectTrigger>
              <SelectContent>
                {countries.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('companyName')}</Label>
            <Input
              value={profile.company_name}
              onChange={e => setProfile(p => ({ ...p, company_name: e.target.value }))}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full mt-4">
            <Save className="w-4 h-4 mr-2" />
            {saving ? t('loading') + '...' : t('save')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
