import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, CheckCircle2, XCircle, Ban, Globe, ScrollText, ClipboardList, Link2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserPackagesManager from './UserPackagesManager';

const countryCodes: Record<string, string> = {
  'Argentina': 'ar', 'Brasil': 'br', 'Brazil': 'br', 'Colombia': 'co', 'Venezuela': 've',
  'Perú': 'pe', 'Peru': 'pe', 'Ecuador': 'ec', 'Chile': 'cl', 'Uruguay': 'uy',
  'Paraguay': 'py', 'Bolivia': 'bo', 'México': 'mx', 'Mexico': 'mx', 'Panamá': 'pa',
  'Panama': 'pa', 'Costa Rica': 'cr', 'Guatemala': 'gt', 'Honduras': 'hn',
  'El Salvador': 'sv', 'Nicaragua': 'ni', 'Cuba': 'cu', 'República Dominicana': 'do',
  'Dominican Republic': 'do', 'Puerto Rico': 'pr', 'España': 'es', 'Spain': 'es',
  'United States': 'us', 'Estados Unidos': 'us',
};

const FlagImg: React.FC<{ country: string | null; size?: number }> = ({ country, size = 16 }) => {
  if (!country) return null;
  const code = countryCodes[country];
  if (!code) return <Globe className="w-4 h-4 text-muted-foreground" />;
  return (
    <img src={`https://flagcdn.com/w40/${code}.png`} srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width={size} height={Math.round(size * 0.75)} alt={country}
      className="inline-block rounded-sm object-cover" style={{ width: size, height: Math.round(size * 0.75) }} />
  );
};

interface ProfileUser {
  id: string; user_id: string; email: string | null; display_name: string | null;
  company_name: string | null; country: string | null; phone: string | null;
  role_type: string | null; client_count: string | null; network_type: string | null;
  cheapest_plan_usd: number | null; main_problems: string | null; main_desires: string | null;
  approved: boolean; status: string; created_at: string;
}

interface DiagnosticData {
  id: string; name: string; email: string; phone: string | null; company_name: string | null;
  country: string | null; role_type: string | null; client_count: string | null;
  network_type: string | null; cheapest_plan: number | null; main_problems: string | null;
  main_goals: string | null; tech_knowledge: string | null; created_at: string;
}

interface LogEntry {
  id: string; action: string; entity_type: string; details: string | null;
  created_at: string; level: string;
}

interface Props {
  user: ProfileUser;
  t: (key: string) => string;
  getStatusBadge: (user: ProfileUser) => React.ReactNode;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  confirmSuspend: (userId: string) => void;
  confirmDelete: (userId: string) => void;
  fetchActivePlansCounts: () => void;
}

const UserDetailContent: React.FC<Props> = ({
  user, t, getStatusBadge, approveUser, rejectUser, confirmSuspend, confirmDelete, fetchActivePlansCounts
}) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticData[]>([]);
  const [loadingDiag, setLoadingDiag] = useState(false);
  const [diagChecked, setDiagChecked] = useState(false);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [showLogs, setShowLogs] = useState(false);
  const [showDiag, setShowDiag] = useState(false);

  // Check for matching diagnostics by email only
  const fetchDiagnostics = useCallback(async () => {
    if (diagChecked) return;
    setLoadingDiag(true);

    if (!user.email) {
      setDiagChecked(true);
      setLoadingDiag(false);
      return;
    }

    const { data } = await supabase.from('diagnostics').select('*').eq('email', user.email).order('created_at', { ascending: false });
    setDiagnostics(data || []);
    setDiagChecked(true);
    setLoadingDiag(false);
  }, [user.email, diagChecked]);

  // Fetch user activity logs
  const fetchLogs = useCallback(async () => {
    setLoadingLogs(true);
    const { data } = await supabase
      .from('system_logs')
      .select('*')
      .eq('entity_id', user.user_id)
      .order('created_at', { ascending: false })
      .limit(50);
    setLogs(data || []);
    setLoadingLogs(false);
  }, [user.user_id]);

  useEffect(() => {
    fetchDiagnostics();
  }, [fetchDiagnostics]);

  useEffect(() => {
    if (showLogs && logs.length === 0) fetchLogs();
  }, [showLogs, fetchLogs, logs.length]);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-LA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2"><span className="text-muted-foreground">Email</span><p className="font-medium text-foreground">{user.email || '—'}</p></div>
        <div><span className="text-muted-foreground">{t('roleType')}</span><p className="font-medium text-foreground">{user.role_type === 'owner' ? t('ispOwner') : t('ispEmployee')}</p></div>
        <div><span className="text-muted-foreground">{t('country')}</span><p className="font-medium text-foreground flex items-center gap-1.5">{user.country ? <><FlagImg country={user.country} size={18} /> {user.country}</> : '—'}</p></div>
        <div><span className="text-muted-foreground">{t('companyName')}</span><p className="font-medium text-foreground">{user.company_name || '—'}</p></div>
        <div><span className="text-muted-foreground">{t('phone')}</span><p className="font-medium text-foreground">{user.phone || '—'}</p></div>
        <div><span className="text-muted-foreground">{t('clientCount')}</span><p className="font-medium text-foreground">{user.client_count || '—'}</p></div>
        <div><span className="text-muted-foreground">{t('networkType')}</span><p className="font-medium text-foreground">{user.network_type || '—'}</p></div>
        {user.cheapest_plan_usd && (
          <div><span className="text-muted-foreground">{t('cheapestPlan')}</span><p className="font-medium text-foreground">U$ {user.cheapest_plan_usd}</p></div>
        )}
        <div><span className="text-muted-foreground">Status</span><p className="font-medium">{getStatusBadge(user)}</p></div>
      </div>
      {user.main_problems && (
        <div><p className="text-sm text-muted-foreground mb-1">{t('mainProblems')}</p><p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3 border border-border">{user.main_problems}</p></div>
      )}
      {user.main_desires && (
        <div><p className="text-sm text-muted-foreground mb-1">{t('mainDesires')}</p><p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3 border border-border">{user.main_desires}</p></div>
      )}

      {/* Diagnostic Section */}
      <div className="border-t border-border pt-4">
        <button
          onClick={() => setShowDiag(!showDiag)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full text-left"
        >
          <ClipboardList className="w-4 h-4 text-primary" />
          Diagnóstico
          {diagnostics.length > 0 && <Badge className="text-xs bg-green-500/10 text-green-500 border-green-500/20 ml-auto">{diagnostics.length} vinculado(s)</Badge>}
          {diagChecked && diagnostics.length === 0 && <Badge variant="secondary" className="text-xs ml-auto">No encontrado</Badge>}
        </button>
        {showDiag && (
          <div className="mt-2 space-y-3">
            {loadingDiag ? (
              <p className="text-xs text-muted-foreground">{t('loading')}...</p>
            ) : diagnostics.length > 0 ? (
              diagnostics.map((diagnostic, idx) => (
                <div key={diagnostic.id} className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2 text-xs">
                  {diagnostics.length > 1 && <p className="text-xs font-medium text-primary">Diagnóstico #{idx + 1} — {formatDate(diagnostic.created_at)}</p>}
                  <div className="grid grid-cols-2 gap-2">
                    <div><span className="text-muted-foreground">Nombre:</span> <span className="text-foreground">{diagnostic.name}</span></div>
                    <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{diagnostic.email}</span></div>
                    <div><span className="text-muted-foreground">Teléfono:</span> <span className="text-foreground">{diagnostic.phone || '—'}</span></div>
                    <div><span className="text-muted-foreground">Empresa:</span> <span className="text-foreground">{diagnostic.company_name || '—'}</span></div>
                    <div><span className="text-muted-foreground">País:</span> <span className="text-foreground">{diagnostic.country || '—'}</span></div>
                    <div><span className="text-muted-foreground">Clientes:</span> <span className="text-foreground">{diagnostic.client_count || '—'}</span></div>
                    <div><span className="text-muted-foreground">Red:</span> <span className="text-foreground">{diagnostic.network_type || '—'}</span></div>
                    <div><span className="text-muted-foreground">Plan más barato:</span> <span className="text-foreground">{diagnostic.cheapest_plan ? `U$ ${diagnostic.cheapest_plan}` : '—'}</span></div>
                    <div><span className="text-muted-foreground">Conocimiento:</span> <span className="text-foreground">{diagnostic.tech_knowledge || '—'}</span></div>
                    {diagnostics.length === 1 && <div><span className="text-muted-foreground">Fecha:</span> <span className="text-foreground">{formatDate(diagnostic.created_at)}</span></div>}
                  </div>
                  {diagnostic.main_problems && (
                    <div><span className="text-muted-foreground">Problemas:</span><p className="text-foreground mt-0.5">{diagnostic.main_problems}</p></div>
                  )}
                  {diagnostic.main_goals && (
                    <div><span className="text-muted-foreground">Objetivos:</span><p className="text-foreground mt-0.5">{diagnostic.main_goals}</p></div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground p-2">No se encontró diagnóstico para este email.</p>
            )}
          </div>
        )}
      </div>

      {/* Packages & Products Manager */}
      <div className="border-t border-border pt-4">
        <UserPackagesManager userId={user.user_id} onUpdate={() => fetchActivePlansCounts()} />
      </div>

      {/* Access / Activity Log */}
      <div className="border-t border-border pt-4">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full text-left"
        >
          <ScrollText className="w-4 h-4 text-primary" />
          Registro de Actividad
          <Badge variant="secondary" className="text-xs ml-auto">{logs.length > 0 ? logs.length : '...'}</Badge>
        </button>
        {showLogs && (
          <div className="mt-2">
            {loadingLogs ? (
              <p className="text-xs text-muted-foreground">{t('loading')}...</p>
            ) : logs.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2">Sin registros de actividad para este usuario.</p>
            ) : (
              <ScrollArea className="h-48">
                <div className="space-y-1">
                  {logs.map(log => (
                    <div key={log.id} className="flex items-start gap-2 text-xs p-2 rounded bg-secondary/30 border border-border/50">
                      <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'secondary' : 'outline'} className="text-xs h-4 shrink-0 mt-0.5">
                        {log.level}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-foreground">{log.action}</span>
                        {log.details && <p className="text-muted-foreground truncate">{log.details}</p>}
                      </div>
                      <span className="text-muted-foreground shrink-0">{new Date(log.created_at).toLocaleDateString('es-LA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {user.status !== 'approved' ? (
        <div className="flex flex-col gap-2 pt-2">
          <div className="flex gap-2">
            {user.status !== 'rejected' && (
              <Button variant="destructive" className="flex-1 gap-2" onClick={() => rejectUser(user.user_id)}>
                <XCircle className="w-4 h-4" /> {t('rejectUser')}
              </Button>
            )}
            <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => approveUser(user.user_id)}>
              <CheckCircle2 className="w-4 h-4" /> {t('approveUser')}
            </Button>
          </div>
          <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive w-full" onClick={() => confirmDelete(user.user_id)}>
            <Trash2 className="w-4 h-4" /> Eliminar Permanentemente
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1 gap-2 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10" onClick={() => confirmSuspend(user.user_id)}>
            <Ban className="w-4 h-4" /> Suspender
          </Button>
          <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={() => confirmDelete(user.user_id)}>
            <Trash2 className="w-4 h-4" /> Eliminar
          </Button>
        </div>
      )}
    </div>
  );
};

export default UserDetailContent;
