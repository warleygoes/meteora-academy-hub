import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Eye, Trash2, Clock, Globe, Building2, Phone, Users, Wifi, DollarSign,
  MessageSquare, Target, HelpCircle, ArrowUpDown, ArrowUp, ArrowDown, Columns3
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  id: string; name: string; email: string; phone: string | null;
  country: string | null; company_name: string | null; role_type: string | null;
  client_count: string | null; network_type: string | null; cheapest_plan: number | null;
  main_problems: string | null; tech_knowledge: string | null; main_goals: string | null;
  created_at: string;
}

type SortDir = 'asc' | 'desc' | null;

const AdminDiagnostics: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selected, setSelected] = useState<Diagnostic | null>(null);
  const [filterNetwork, setFilterNetwork] = useState<string>('all');
  const [filterTech, setFilterTech] = useState<string>('all');

  // Column management
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    name: true, company: true, country: true, phone: true, clients: true, network: true, tech: true, plan: true, date: true,
  });
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{ col: string; startX: number; startW: number } | null>(null);
  const [columnPopoverOpen, setColumnPopoverOpen] = useState(false);

  const columnDefs = [
    { id: 'name', label: t('displayName') || 'Nome', minWidth: 160 },
    { id: 'company', label: t('companyName') || 'Empresa', minWidth: 100 },
    { id: 'country', label: t('country') || 'País', minWidth: 80 },
    { id: 'phone', label: t('phone') || 'Telefone', minWidth: 100 },
    { id: 'clients', label: t('clientCount') || 'Clientes', minWidth: 80 },
    { id: 'network', label: t('networkType') || 'Rede', minWidth: 80 },
    { id: 'tech', label: t('diagTechKnowledge') || 'Técnico', minWidth: 80 },
    { id: 'plan', label: t('diagCheapest') || 'Menor plano', minWidth: 80 },
    { id: 'date', label: 'Data', minWidth: 90 },
  ];

  const getColumnValue = (d: Diagnostic, colId: string): string | number => {
    switch (colId) {
      case 'name': return d.name || '';
      case 'company': return d.company_name || '';
      case 'country': return d.country || '';
      case 'phone': return d.phone || '';
      case 'clients': return d.client_count || '';
      case 'network': return d.network_type || '';
      case 'tech': return d.tech_knowledge || '';
      case 'plan': return d.cheapest_plan ?? 0;
      case 'date': return d.created_at;
      default: return '';
    }
  };

  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortColumn(null); setSortDir(null); }
    } else { setSortColumn(colId); setSortDir('asc'); }
  };

  const sortItems = (items: Diagnostic[]) => {
    if (!sortColumn || !sortDir) return items;
    return [...items].sort((a, b) => {
      const va = getColumnValue(a, sortColumn);
      const vb = getColumnValue(b, sortColumn);
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb : String(va).localeCompare(String(vb), undefined, { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  };

  const handleResizeStart = (colId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = columnWidths[colId] || columnDefs.find(c => c.id === colId)?.minWidth || 120;
    resizingRef.current = { col: colId, startX, startW };
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = ev.clientX - resizingRef.current.startX;
      const minW = columnDefs.find(c => c.id === colId)?.minWidth || 60;
      setColumnWidths(prev => ({ ...prev, [colId]: Math.max(minW, resizingRef.current!.startW + diff) }));
    };
    const onUp = () => { resizingRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const toggleColumn = (colId: string) => { setColumnVisibility(prev => ({ ...prev, [colId]: !prev[colId] })); };
  const visibleColumns = columnDefs.filter(c => columnVisibility[c.id]);

  const fetchDiagnostics = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('diagnostics' as any).select('*').order('created_at', { ascending: false });
    if (error) { console.error(error); toast({ title: t('errorOccurred'), variant: 'destructive' }); }
    setDiagnostics((data as any as Diagnostic[]) || []);
    setLoading(false);
  }, [toast, t]);

  useEffect(() => { fetchDiagnostics(); }, [fetchDiagnostics]);

  const deleteDiagnostic = async (id: string) => {
    setDiagnostics(prev => prev.filter(d => d.id !== id));
    setSelected(null);
    const { error } = await supabase.from('diagnostics' as any).delete().eq('id', id);
    if (error) { toast({ title: error.message, variant: 'destructive' }); fetchDiagnostics(); }
  };

  const matchesSearch = (d: Diagnostic) => {
    if (!globalSearch) return true;
    const s = globalSearch.toLowerCase();
    return d.name.toLowerCase().includes(s) || d.email.toLowerCase().includes(s) ||
      d.company_name?.toLowerCase().includes(s) || d.country?.toLowerCase().includes(s) ||
      d.phone?.toLowerCase().includes(s);
  };

  const filtered = sortItems(diagnostics.filter(d => {
    if (!matchesSearch(d)) return false;
    if (filterNetwork !== 'all' && d.network_type !== filterNetwork) return false;
    if (filterTech !== 'all' && d.tech_knowledge !== filterTech) return false;
    return true;
  }));

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-LA', { day: '2-digit', month: 'short', year: 'numeric' });

  const getTechBadge = (level: string | null) => {
    if (!level) return '—';
    const colors: Record<string, string> = {
      basic: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      intermediate: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      advanced: 'bg-green-500/10 text-green-500 border-green-500/20',
    };
    const labels: Record<string, string> = { basic: t('diagTechBasic'), intermediate: t('diagTechIntermediate'), advanced: t('diagTechAdvanced') };
    return <Badge className={colors[level] || ''}>{labels[level] || level}</Badge>;
  };

  const getNetworkBadge = (type: string | null) => {
    if (!type) return '—';
    const labels: Record<string, string> = { radio: t('diagRadio'), fiber: t('diagFiber'), hybrid: t('diagHybrid') };
    return <Badge variant="outline" className="text-xs">{labels[type] || type}</Badge>;
  };

  const renderCellContent = (d: Diagnostic, colId: string) => {
    switch (colId) {
      case 'name':
        return (
          <div>
            <p className="font-medium text-foreground">{d.name}</p>
            <p className="text-xs text-muted-foreground">{d.email}</p>
          </div>
        );
      case 'company': return <span className="text-muted-foreground">{d.company_name || '—'}</span>;
      case 'country':
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FlagImg country={d.country} size={14} />
            <span>{d.country || '—'}</span>
          </div>
        );
      case 'phone': return <span className="text-muted-foreground">{d.phone || '—'}</span>;
      case 'clients': return <span className="text-muted-foreground">{d.client_count || '—'}</span>;
      case 'network': return getNetworkBadge(d.network_type);
      case 'tech': return getTechBadge(d.tech_knowledge);
      case 'plan': return <span className="text-muted-foreground">{d.cheapest_plan != null ? `U$ ${d.cheapest_plan}` : '—'}</span>;
      case 'date': return <span className="text-xs text-muted-foreground">{formatDate(d.created_at)}</span>;
      default: return null;
    }
  };

  const ColumnToggle = () => (
    <Popover open={columnPopoverOpen} onOpenChange={setColumnPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-border">
          <Columns3 className="w-4 h-4" /> {t('columns') || 'Colunas'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 bg-card border-border p-3" align="end">
        <p className="text-xs font-medium text-muted-foreground mb-2">{t('toggleColumns') || 'Mostrar/Ocultar colunas'}</p>
        <div className="space-y-2">
          {columnDefs.map(col => (
            <label key={col.id} className="flex items-center gap-2 text-sm cursor-pointer" onClick={e => e.stopPropagation()}>
              <Checkbox checked={columnVisibility[col.id]} onCheckedChange={() => toggleColumn(col.id)} />
              <span className="text-foreground">{col.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

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

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email, empresa, país, telefone..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterNetwork} onValueChange={setFilterNetwork}>
            <SelectTrigger className="w-[130px] bg-secondary border-border"><SelectValue placeholder="Rede" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas redes</SelectItem>
              <SelectItem value="radio">{t('diagRadio')}</SelectItem>
              <SelectItem value="fiber">{t('diagFiber')}</SelectItem>
              <SelectItem value="hybrid">{t('diagHybrid')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterTech} onValueChange={setFilterTech}>
            <SelectTrigger className="w-[130px] bg-secondary border-border"><SelectValue placeholder="Técnico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos níveis</SelectItem>
              <SelectItem value="basic">{t('diagTechBasic')}</SelectItem>
              <SelectItem value="intermediate">{t('diagTechIntermediate')}</SelectItem>
              <SelectItem value="advanced">{t('diagTechAdvanced')}</SelectItem>
            </SelectContent>
          </Select>
          <ColumnToggle />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">{t('loading')}...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-display font-semibold text-foreground">
            {diagnostics.length === 0 ? 'Nenhum diagnóstico ainda' : t('noUsersFound')}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {visibleColumns.map(col => (
                  <th key={col.id} className="pb-3 px-2 font-medium relative select-none group"
                    style={columnWidths[col.id] ? { width: columnWidths[col.id], minWidth: col.minWidth } : { minWidth: col.minWidth }}>
                    <button type="button" onClick={() => handleSort(col.id)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors">
                      {col.label}
                      {sortColumn === col.id ? (
                        sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      )}
                    </button>
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 transition-colors"
                      onMouseDown={(e) => handleResizeStart(col.id, e)} />
                  </th>
                ))}
                <th className="pb-3 px-2 font-medium text-right">{t('actions') || 'Ações'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => (
                <tr key={d.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  {visibleColumns.map(col => (
                    <td key={col.id} className="py-3 px-2"
                      style={columnWidths[col.id] ? { width: columnWidths[col.id], minWidth: col.minWidth } : { minWidth: col.minWidth }}>
                      {renderCellContent(d, col.id)}
                    </td>
                  ))}
                  <td className="py-3 px-2 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(d)} className="text-muted-foreground">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteDiagnostic(d.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  <p className="text-foreground">{getNetworkBadge(selected.network_type)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('diagCheapest')}</p>
                  <p className="text-foreground">{selected.cheapest_plan != null ? `USD ${selected.cheapest_plan}` : '—'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">{t('diagTechKnowledge')}</p>
                  <p className="text-foreground">{getTechBadge(selected.tech_knowledge)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Data</p>
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
