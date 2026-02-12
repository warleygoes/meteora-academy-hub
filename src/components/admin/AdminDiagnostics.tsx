import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Eye, Trash2, Clock, Globe, Building2, Phone, Users, Wifi, DollarSign,
  MessageSquare, Target, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const countryCodes: Record<string, string> = {
  'Argentina': 'ar', 'Brasil': 'br', 'Brazil': 'br', 'Colombia': 'co', 'Venezuela': 've',
  'Perú': 'pe', 'Peru': 'pe', 'Ecuador': 'ec', 'Chile': 'cl', 'Uruguay': 'uy',
  'Paraguay': 'py', 'Bolivia': 'bo', 'México': 'mx', 'Mexico': 'mx', 'Panamá': 'pa',
  'Panama': 'pa', 'Costa Rica': 'cr', 'Guatemala': 'gt', 'Honduras': 'hn',
  'El Salvador': 'sv', 'Nicaragua': 'ni', 'Cuba': 'cu', 'República Dominicana': 'do',
};

const FlagImg: React.FC<{ country: string | null; size?: number }> = ({ country, size = 16 }) => {
  if (!country) return null;
  const code = countryCodes[country];
  if (!code) return <Globe className="w-4 h-4 text-muted-foreground" />;
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={country}
      className="inline-block rounded-sm object-cover"
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  );
};

interface Diagnostic {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  company_name: string | null;
  role_type: string | null;
  client_count: string | null;
  network_type: string | null;
  cheapest_plan: number | null;
  main_problems: string | null;
  tech_knowledge: string | null;
  main_goals: string | null;
  created_at: string;
}

const AdminDiagnostics: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Diagnostic | null>(null);

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('diagnostics' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast({ title: t('errorOccurred'), variant: 'destructive' });
    }
    setDiagnostics((data as any as Diagnostic[]) || []);
    setLoading(false);
  }, [toast, t]);

  useEffect(() => { fetchDiagnostics(); }, [fetchDiagnostics]);

  const deleteDiagnostic = async (id: string) => {
    setDiagnostics(prev => prev.filter(d => d.id !== id));
    setSelected(null);
    const { error } = await supabase.from('diagnostics' as any).delete().eq('id', id);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
      fetchDiagnostics();
    }
  };

  const filtered = diagnostics.filter(d => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      d.name.toLowerCase().includes(s) ||
      d.email.toLowerCase().includes(s) ||
      d.company_name?.toLowerCase().includes(s) ||
      d.country?.toLowerCase().includes(s)
    );
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-LA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getTechBadge = (level: string | null) => {
    if (!level) return null;
    const colors: Record<string, string> = {
      basic: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      intermediate: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      advanced: 'bg-green-500/10 text-green-500 border-green-500/20',
    };
    const labels: Record<string, string> = {
      basic: t('diagTechBasic'),
      intermediate: t('diagTechIntermediate'),
      advanced: t('diagTechAdvanced'),
    };
    return <Badge className={colors[level] || ''}>{labels[level] || level}</Badge>;
  };

  const getNetworkBadge = (type: string | null) => {
    if (!type) return null;
    const labels: Record<string, string> = { radio: t('diagRadio'), fiber: t('diagFiber'), hybrid: t('diagHybrid') };
    return <Badge variant="outline" className="text-xs">{labels[type] || type}</Badge>;
  };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total', value: diagnostics.length, icon: MessageSquare, color: 'text-primary' },
          { label: t('diagRadio'), value: diagnostics.filter(d => d.network_type === 'radio').length, icon: Wifi, color: 'text-yellow-500' },
          { label: t('diagFiber'), value: diagnostics.filter(d => d.network_type === 'fiber').length, icon: Wifi, color: 'text-blue-500' },
          { label: t('diagHybrid'), value: diagnostics.filter(d => d.network_type === 'hybrid').length, icon: Wifi, color: 'text-green-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl p-5 border border-border">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t('searchUsers')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-secondary border-border"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t('loading')}...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-display font-semibold text-foreground">
            {diagnostics.length === 0 ? 'No hay diagnósticos aún' : t('noUsersFound')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((diag) => (
            <motion.div key={diag.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-card rounded-xl border border-border p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-display font-semibold text-foreground truncate">{diag.name}</p>
                  {diag.role_type && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      {diag.role_type === 'owner' ? t('diagOwner') : t('diagEmployee')}
                    </Badge>
                  )}
                  {getNetworkBadge(diag.network_type)}
                  {getTechBadge(diag.tech_knowledge)}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{diag.email}</span>
                  {diag.company_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{diag.company_name}</span>}
                  {diag.country && <span className="flex items-center gap-1"><FlagImg country={diag.country} size={14} />{diag.country}</span>}
                  {diag.client_count && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{diag.client_count} clientes</span>}
                  {diag.cheapest_plan != null && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />USD {diag.cheapest_plan}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(diag.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => setSelected(diag)} className="gap-1 text-muted-foreground">
                  <Eye className="w-4 h-4" /> {t('viewDetails')}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteDiagnostic(diag.id)} className="gap-1">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('diagEmail')}</p>
                  <p className="text-foreground">{selected.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('diagPhone')}</p>
                  <p className="text-foreground">{selected.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('diagCountry')}</p>
                  <p className="text-foreground flex items-center gap-1.5">
                    <FlagImg country={selected.country} size={16} /> {selected.country || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('diagCompany')}</p>
                  <p className="text-foreground">{selected.company_name || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('diagRole')}</p>
                  <p className="text-foreground">{selected.role_type === 'owner' ? t('diagOwner') : selected.role_type === 'employee' ? t('diagEmployee') : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('diagClients')}</p>
                  <p className="text-foreground">{selected.client_count || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('diagNetwork')}</p>
                  <p className="text-foreground">{getNetworkBadge(selected.network_type) || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('diagCheapest')}</p>
                  <p className="text-foreground">{selected.cheapest_plan != null ? `USD ${selected.cheapest_plan}` : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('diagTechKnowledge')}</p>
                  <p className="text-foreground">{getTechBadge(selected.tech_knowledge) || '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Fecha</p>
                  <p className="text-foreground">{formatDate(selected.created_at)}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-xs mb-1">{t('diagProblems')}</p>
                <p className="text-foreground bg-secondary rounded-lg p-3 text-sm">{selected.main_problems || '—'}</p>
              </div>

              <div>
                <p className="text-muted-foreground text-xs mb-1">{t('diagGoals')}</p>
                <p className="text-foreground bg-secondary rounded-lg p-3 text-sm">{selected.main_goals || '—'}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="destructive" size="sm" className="gap-1" onClick={() => deleteDiagnostic(selected.id)}>
                  <Trash2 className="w-4 h-4" /> {t('deleteUser')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDiagnostics;
