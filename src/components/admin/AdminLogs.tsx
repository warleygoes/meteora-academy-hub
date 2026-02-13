import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, Filter, X, Clock, User, Shield, BookOpen, Package, Settings, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: string | null;
  performed_by: string | null;
  performer_email: string | null;
  created_at: string;
  level: string;
}

const LEVEL_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  info: { icon: Info, color: 'text-blue-400' },
  success: { icon: CheckCircle, color: 'text-green-400' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400' },
  error: { icon: AlertTriangle, color: 'text-red-400' },
};

const ENTITY_ICONS: Record<string, React.ElementType> = {
  user: User,
  course: BookOpen,
  package: Package,
  product: Package,
  settings: Settings,
  auth: Shield,
};

const AdminLogs: React.FC = () => {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [limit, setLimit] = useState(50);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('system_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (levelFilter !== 'all') query = query.eq('level', levelFilter);
    if (entityFilter !== 'all') query = query.eq('entity_type', entityFilter);

    const { data } = await query;
    setLogs(data || []);
    setLoading(false);
  }, [limit, levelFilter, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filtered = logs.filter(log => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(s) ||
      (log.details || '').toLowerCase().includes(s) ||
      (log.performer_email || '').toLowerCase().includes(s) ||
      (log.entity_id || '').toLowerCase().includes(s)
    );
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('searchLogs') || 'Buscar logs...'}
            className="pl-9"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t('level') || 'Nivel'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all') || 'Todos'}</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="success">{t('success') || 'Éxito'}</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder={t('entity') || 'Entidad'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all') || 'Todos'}</SelectItem>
            <SelectItem value="user">{t('manageUsers') || 'Users'}</SelectItem>
            <SelectItem value="course">{t('courses') || 'Courses'}</SelectItem>
            <SelectItem value="package">{t('managePackages') || 'Packages'}</SelectItem>
            <SelectItem value="product">{t('manageProducts') || 'Products'}</SelectItem>
            <SelectItem value="auth">Auth</SelectItem>
            <SelectItem value="settings">{t('settingsTitle') || 'Settings'}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading} className="gap-1">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          {t('refresh') || 'Actualizar'}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        {filtered.length} {t('logsFound') || 'registros'}
        {limit <= filtered.length && (
          <Button variant="link" size="sm" className="ml-2 text-xs h-auto p-0" onClick={() => setLimit(l => l + 50)}>
            {t('loadMore') || 'Cargar más'}
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && !loading && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">{t('noLogsFound') || 'No se encontraron logs'}</CardContent></Card>
        )}
        {filtered.map(log => {
          const lc = LEVEL_CONFIG[log.level] || LEVEL_CONFIG.info;
          const LevelIcon = lc.icon;
          const EntityIcon = ENTITY_ICONS[log.entity_type] || Info;
          return (
            <Card key={log.id} className="hover:bg-muted/30 transition-colors">
              <CardContent className="py-3 px-4 flex items-start gap-3">
                <LevelIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", lc.color)} />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{log.action}</span>
                    <Badge variant="outline" className="text-xs gap-1">
                      <EntityIcon className="w-3 h-3" />
                      {log.entity_type}
                    </Badge>
                    {log.entity_id && (
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">{log.entity_id}</span>
                    )}
                  </div>
                  {log.details && <p className="text-xs text-muted-foreground">{log.details}</p>}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(log.created_at)}</span>
                    {log.performer_email && <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.performer_email}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AdminLogs;
