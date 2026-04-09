import React, { useState, useEffect } from 'react';
import {
  Search, Eye, Trash2, Globe, Plus, Pencil, GripVertical, Target, Settings, ClipboardList,
  Filter, BarChart3, Thermometer, UserCheck, TrendingUp, X, Archive, ArchiveRestore, Package
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import DiagnosticRulesManager from './DiagnosticRulesManager';
import { FIELD_KEY_OPTIONS } from '@/lib/diagnosticComputedFields';

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
  return <img src={`https://flagcdn.com/w40/${code}.png`} width={size} height={Math.round(size * 0.75)} alt={country} className="inline-block rounded-sm object-cover" style={{ width: size, height: Math.round(size * 0.75) }} />;
};

const SECTION_OPTIONS = [
  { value: 'technical', label: 'Arquitectura Técnica' },
  { value: 'financial', label: 'Gestión Financiera' },
  { value: 'scale', label: 'Escala Comercial' },
  { value: 'expansion', label: 'Potencial de Expansión' },
  { value: 'commitment', label: 'Compromiso Estratégico' },
];

const TYPE_OPTIONS = [
  { value: 'scale', label: 'Escala (1-10)' },
  { value: 'likert', label: 'Likert (5 puntos)' },
  { value: 'single_choice', label: 'Selección Única' },
  { value: 'multiple_choice', label: 'Selección Múltiple' },
  { value: 'text_open', label: 'Campo Abierto' },
];

const OPERATOR_OPTIONS = [
  { value: '<', label: '< (menor que)' },
  { value: '<=', label: '<= (menor o igual)' },
  { value: '>', label: '> (mayor que)' },
  { value: '>=', label: '>= (mayor o igual)' },
  { value: '=', label: '= (igual a)' },
];

const TEMP_COLORS: Record<string, string> = {
  cold: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  warm: 'bg-amber-500/10 text-amber-500 border-amber-500/30',
  hot: 'bg-destructive/10 text-destructive border-destructive/30',
};

const TEMP_LABELS: Record<string, string> = { cold: 'Frío', warm: 'Tibio', hot: 'Caliente' };
const STATUS_LABELS: Record<string, string> = { new: 'Nuevo', contacted: 'Contactado', negotiating: 'Negociando', converted: 'Convertido', lost: 'Perdido' };

const AdminDiagnostics: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('submissions');
  
  // Submissions
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [leadTracking, setLeadTracking] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  
  // Filters
  const [filterTemp, setFilterTemp] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterMinClients, setFilterMinClients] = useState('');
  const [filterMinCommitment, setFilterMinCommitment] = useState('');
  const [filterOnlyCompleted, setFilterOnlyCompleted] = useState('all');

  // Questions
  const [questions, setQuestions] = useState<any[]>([]);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [section, setSection] = useState('technical');
  const [type, setType] = useState('scale');
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<any[]>([]);
  const [weight, setWeight] = useState('1.0');

  // Rules
  const [rules, setRules] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleField, setRuleField] = useState('technical');
  const [ruleOperator, setRuleOperator] = useState('<');
  const [ruleValue, setRuleValue] = useState('5');
  const [ruleTitle, setRuleTitle] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleCtaText, setRuleCtaText] = useState('');
  const [ruleProductId, setRuleProductId] = useState('');
  const [rulePriority, setRulePriority] = useState('0');

  useEffect(() => {
    fetchDiagnostics();
    fetchQuestions();
    fetchRules();
    fetchProducts();
  }, []);

  const fetchDiagnostics = async () => {
    setLoading(true);
    const [{ data: diags }, { data: tracks }] = await Promise.all([
      supabase.from('diagnostics').select('*').order('created_at', { ascending: false }),
      supabase.from('diagnostic_lead_tracking').select('*'),
    ]);
    if (diags) setDiagnostics(diags);
    if (tracks) {
      const map: Record<string, any> = {};
      tracks.forEach((t: any) => { map[t.diagnostic_id] = t; });
      setLeadTracking(map);
    }
    setLoading(false);
  };

  const fetchQuestions = async () => {
    const { data } = await supabase.from('diagnostic_questions').select('*').order('sort_order', { ascending: true });
    if (data) setQuestions(data);
  };

  const fetchRules = async () => {
    const { data } = await supabase.from('diagnostic_recommendation_rules').select('*, products:recommended_product_id(id, name)').order('priority', { ascending: true });
    if (data) setRules(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, name').eq('active', true).order('sort_order');
    if (data) setProducts(data);
  };

  // Lead tracking updates
  const updateLeadField = async (diagnosticId: string, field: string, value: string) => {
    const existing = leadTracking[diagnosticId];
    if (existing) {
      await supabase.from('diagnostic_lead_tracking').update({ [field]: value, last_action: `Admin actualizó ${field}`, last_action_at: new Date().toISOString() }).eq('diagnostic_id', diagnosticId);
    } else {
      await supabase.from('diagnostic_lead_tracking').insert({ diagnostic_id: diagnosticId, [field]: value, last_action: `Admin creó tracking`, last_action_at: new Date().toISOString() });
    }
    fetchDiagnostics();
  };

  // Archive / Delete
  const archiveDiagnostic = async (id: string) => {
    await supabase.from('diagnostics').update({ archived: true }).eq('id', id);
    toast({ title: 'Diagnóstico archivado' });
    fetchDiagnostics();
  };

  const unarchiveDiagnostic = async (id: string) => {
    await supabase.from('diagnostics').update({ archived: false }).eq('id', id);
    toast({ title: 'Diagnóstico restaurado' });
    fetchDiagnostics();
  };

  const permanentlyDelete = async (id: string) => {
    await Promise.all([
      supabase.from('diagnostic_lead_tracking').delete().eq('diagnostic_id', id),
      supabase.from('diagnostic_answers').delete().eq('diagnostic_id', id),
    ]);
    await supabase.from('diagnostics').delete().eq('id', id);
    toast({ title: 'Diagnóstico eliminado permanentemente' });
    fetchDiagnostics();
  };

  const deleteAllArchived = async () => {
    const archivedIds = diagnostics.filter(d => d.archived).map(d => d.id);
    if (archivedIds.length === 0) return;
    await Promise.all([
      supabase.from('diagnostic_lead_tracking').delete().in('diagnostic_id', archivedIds),
      supabase.from('diagnostic_answers').delete().in('diagnostic_id', archivedIds),
    ]);
    await supabase.from('diagnostics').delete().in('id', archivedIds);
    toast({ title: `${archivedIds.length} diagnósticos eliminados` });
    fetchDiagnostics();
  };

  // Filters
  const activeDiagnostics = diagnostics.filter(d => !d.archived);
  const archivedDiagnostics = diagnostics.filter(d => d.archived);

  const filteredDiagnostics = activeDiagnostics.filter(d => {
    if (globalSearch && !d.name?.toLowerCase().includes(globalSearch.toLowerCase()) && !d.email?.toLowerCase().includes(globalSearch.toLowerCase())) return false;
    const track = leadTracking[d.id];
    if (filterTemp !== 'all' && track?.lead_temperature !== filterTemp) return false;
    if (filterStatus !== 'all' && (track?.commercial_status || 'new') !== filterStatus) return false;
    if (filterMinClients && Number(d.client_count || 0) < Number(filterMinClients)) return false;
    if (filterMinCommitment) {
      const scores = d.scores as Record<string, number> | null;
      if (!scores || (scores.commitment || 0) < Number(filterMinCommitment)) return false;
    }
    if (filterOnlyCompleted === 'completed' && d.status !== 'completed') return false;
    if (filterOnlyCompleted === 'incomplete' && d.status === 'completed') return false;
    return true;
  });

  // Metrics
  const completedDiags = diagnostics.filter(d => d.status === 'completed' && d.scores);
  const avgScores: Record<string, number> = { technical: 0, financial: 0, scale: 0, expansion: 0, commitment: 0 };
  if (completedDiags.length > 0) {
    completedDiags.forEach(d => {
      const s = d.scores as Record<string, number>;
      Object.keys(avgScores).forEach(k => { avgScores[k] += (s?.[k] || 0); });
    });
    Object.keys(avgScores).forEach(k => { avgScores[k] /= completedDiags.length; });
  }

  // Find most common critical area
  const criticalCounts: Record<string, number> = {};
  completedDiags.forEach(d => {
    const s = d.scores as Record<string, number>;
    if (!s) return;
    const worst = Object.entries(s).sort(([,a],[,b]) => a - b)[0];
    if (worst) criticalCounts[worst[0]] = (criticalCounts[worst[0]] || 0) + 1;
  });
  const mostCritical = Object.entries(criticalCounts).sort(([,a],[,b]) => b - a)[0];

  const getScoreColor = (val: number) => val < 5 ? 'text-destructive' : val < 7 ? 'text-amber-500' : 'text-emerald-500';

  // Question CRUD
  const handleSaveQuestion = async () => {
    const payload: any = { section, type, question_text: text, description, options, weight: parseFloat(weight), sort_order: editingQuestion ? editingQuestion.sort_order : questions.length, field_key: parseFloat(weight) === 0 ? ((editingQuestion as any)?.field_key || null) : null };
    let error;
    if (editingQuestion) {
      ({ error } = await supabase.from('diagnostic_questions').update(payload).eq('id', editingQuestion.id));
    } else {
      ({ error } = await supabase.from('diagnostic_questions').insert(payload));
    }
    if (error) { toast({ title: 'Error al guardar', variant: 'destructive' }); }
    else { toast({ title: 'Pregunta guardada' }); setIsQuestionDialogOpen(false); resetQuestionForm(); fetchQuestions(); }
  };

  const resetQuestionForm = () => { setEditingQuestion(null); setSection('technical'); setType('scale'); setText(''); setDescription(''); setOptions([]); setWeight('1.0'); };

  const editQuestion = (q: any) => {
    setEditingQuestion(q); setSection(q.section); setType(q.type); setText(q.question_text); setDescription(q.description || ''); setOptions(q.options || []); setWeight(q.weight.toString()); setIsQuestionDialogOpen(true);
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    await supabase.from('diagnostic_questions').delete().eq('id', id);
    fetchQuestions();
  };

  // Rule CRUD
  const resetRuleForm = () => { setEditingRule(null); setRuleField('technical'); setRuleOperator('<'); setRuleValue('5'); setRuleTitle(''); setRuleDescription(''); setRuleCtaText(''); setRuleProductId(''); setRulePriority('0'); };

  const editRule = (r: any) => {
    setEditingRule(r); setRuleField(r.condition_field); setRuleOperator(r.condition_operator); setRuleValue(r.condition_value.toString()); setRuleTitle(r.title || ''); setRuleDescription(r.description || ''); setRuleCtaText(r.cta_text || ''); setRuleProductId(r.recommended_product_id || ''); setRulePriority((r.priority || 0).toString()); setIsRuleDialogOpen(true);
  };

  const handleSaveRule = async () => {
    const payload = { condition_field: ruleField, condition_operator: ruleOperator, condition_value: parseFloat(ruleValue), title: ruleTitle, description: ruleDescription, cta_text: ruleCtaText, recommended_product_id: ruleProductId || null, priority: parseInt(rulePriority) };
    let error;
    if (editingRule) { ({ error } = await supabase.from('diagnostic_recommendation_rules').update(payload).eq('id', editingRule.id)); }
    else { ({ error } = await supabase.from('diagnostic_recommendation_rules').insert(payload)); }
    if (error) { toast({ title: 'Error al guardar regla', variant: 'destructive' }); }
    else { toast({ title: 'Regla guardada' }); setIsRuleDialogOpen(false); resetRuleForm(); fetchRules(); }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('¿Eliminar esta regla?')) return;
    await supabase.from('diagnostic_recommendation_rules').delete().eq('id', id);
    fetchRules();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{t('adminDiagnostics')}</h2>
          <p className="text-muted-foreground">{t('adminDiagnosticsDesc')}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="submissions" className="gap-2"><ClipboardList className="w-4 h-4" /> Envíos ({activeDiagnostics.length})</TabsTrigger>
          <TabsTrigger value="archived" className="gap-2"><Archive className="w-4 h-4" /> Archivados ({archivedDiagnostics.length})</TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2"><BarChart3 className="w-4 h-4" /> Métricas</TabsTrigger>
          <TabsTrigger value="questions" className="gap-2"><Settings className="w-4 h-4" /> Preguntas</TabsTrigger>
          <TabsTrigger value="rules" className="gap-2"><Target className="w-4 h-4" /> Reglas</TabsTrigger>
        </TabsList>

        {/* === SUBMISSIONS === */}
        <TabsContent value="submissions" className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="relative max-w-xs">
              <Input placeholder="Buscar nombre o email..." value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} className="pr-8" />
              {globalSearch && <button onClick={() => setGlobalSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <Select value={filterTemp} onValueChange={setFilterTemp}>
              <SelectTrigger className="w-[140px]"><Thermometer className="w-3 h-3 mr-1" /><SelectValue placeholder="Temperatura" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="hot">🔴 Caliente</SelectItem>
                <SelectItem value="warm">🟡 Tibio</SelectItem>
                <SelectItem value="cold">🔵 Frío</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterOnlyCompleted} onValueChange={setFilterOnlyCompleted}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Estado diag." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="incomplete">Incompletos</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Clientes mín." value={filterMinClients} onChange={e => setFilterMinClients(e.target.value)} className="w-[120px]" type="number" />
            <Input placeholder="Compromiso mín." value={filterMinCommitment} onChange={e => setFilterMinCommitment(e.target.value)} className="w-[140px]" type="number" />
          </div>

          <Card className="border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Nivel</TableHead>
                  <TableHead>Téc.</TableHead>
                  <TableHead>Fin.</TableHead>
                  <TableHead>Esc.</TableHead>
                  <TableHead>Pot.</TableHead>
                  <TableHead>Comp.</TableHead>
                  <TableHead>Temp.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDiagnostics.map((d) => {
                  const s = d.scores as Record<string, number> | null;
                  const track = leadTracking[d.id];
                  const level = (d.results as any)?.level || '';
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium whitespace-nowrap">{d.name}</TableCell>
                      <TableCell className="text-xs">{d.email}</TableCell>
                      <TableCell><div className="flex items-center gap-1"><FlagImg country={d.country} /><span className="text-xs">{d.country}</span></div></TableCell>
                      <TableCell className="text-center">{d.client_count || '—'}</TableCell>
                      <TableCell>
                        {level && <Badge variant="outline" className="text-xs capitalize">{level.replace('diag', '')}</Badge>}
                      </TableCell>
                      <TableCell className={`text-center font-mono text-xs ${s ? getScoreColor(s.technical || 0) : ''}`}>{s?.technical?.toFixed(1) || '—'}</TableCell>
                      <TableCell className={`text-center font-mono text-xs ${s ? getScoreColor(s.financial || 0) : ''}`}>{s?.financial?.toFixed(1) || '—'}</TableCell>
                      <TableCell className={`text-center font-mono text-xs ${s ? getScoreColor(s.scale || 0) : ''}`}>{s?.scale?.toFixed(1) || '—'}</TableCell>
                      <TableCell className={`text-center font-mono text-xs ${s ? getScoreColor(s.expansion || 0) : ''}`}>{s?.expansion?.toFixed(1) || '—'}</TableCell>
                      <TableCell className={`text-center font-mono text-xs ${s ? getScoreColor(s.commitment || 0) : ''}`}>{s?.commitment?.toFixed(1) || '—'}</TableCell>
                      <TableCell>
                        <Select value={track?.lead_temperature || 'cold'} onValueChange={v => updateLeadField(d.id, 'lead_temperature', v)}>
                          <SelectTrigger className={`h-7 text-xs w-[90px] border ${TEMP_COLORS[track?.lead_temperature || 'cold']}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(TEMP_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={track?.commercial_status || 'new'} onValueChange={v => updateLeadField(d.id, 'commercial_status', v)}>
                          <SelectTrigger className="h-7 text-xs w-[110px]"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(d.created_at).toLocaleDateString()} {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedSubmission(d)} title="Ver detalle"><Eye className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => archiveDiagnostic(d.id)} title="Archivar"><Archive className="w-4 h-4 text-muted-foreground" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredDiagnostics.length === 0 && (
                  <TableRow><TableCell colSpan={14} className="text-center py-8 text-muted-foreground">Sin resultados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
          <p className="text-xs text-muted-foreground">{filteredDiagnostics.length} de {activeDiagnostics.length} diagnósticos</p>
        </TabsContent>

        {/* === ARCHIVED === */}
        <TabsContent value="archived" className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">{archivedDiagnostics.length} diagnósticos archivados</p>
            {archivedDiagnostics.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2"><Trash2 className="w-4 h-4" /> Eliminar Todos</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar todos los archivados?</AlertDialogTitle>
                    <AlertDialogDescription>Esta acción eliminará permanentemente {archivedDiagnostics.length} diagnósticos archivados. No se puede deshacer.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAllArchived} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar Todos</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <Card className="border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Clientes</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {archivedDiagnostics.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-xs">{d.email}</TableCell>
                    <TableCell><div className="flex items-center gap-1"><FlagImg country={d.country} /><span className="text-xs">{d.country}</span></div></TableCell>
                    <TableCell className="text-center">{d.client_count || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(d.created_at).toLocaleDateString()} {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => unarchiveDiagnostic(d.id)} title="Restaurar"><ArchiveRestore className="w-4 h-4 text-primary" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="Eliminar permanentemente"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar permanentemente?</AlertDialogTitle>
                              <AlertDialogDescription>El diagnóstico de "{d.name}" será eliminado de forma irreversible junto con todas sus respuestas.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => permanentlyDelete(d.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {archivedDiagnostics.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No hay diagnósticos archivados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* === METRICS === */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{diagnostics.length}</p>
              <p className="text-xs text-muted-foreground">Total Diagnósticos</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-emerald-500">{completedDiags.length}</p>
              <p className="text-xs text-muted-foreground">Completados</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-amber-500">{diagnostics.length - completedDiags.length}</p>
              <p className="text-xs text-muted-foreground">Incompletos</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-3xl font-bold text-destructive">{Object.values(leadTracking).filter((t: any) => t.lead_temperature === 'hot').length}</p>
              <p className="text-xs text-muted-foreground">Leads Calientes</p>
            </Card>
          </div>

          <Card className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Promedio por Criterio</h3>
            <div className="space-y-3">
              {SECTION_OPTIONS.map(s => (
                <div key={s.value}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{s.label}</span>
                    <span className={`font-bold ${getScoreColor(avgScores[s.value] || 0)}`}>{(avgScores[s.value] || 0).toFixed(1)}</span>
                  </div>
                  <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${avgScores[s.value] < 5 ? 'bg-destructive' : avgScores[s.value] < 7 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${(avgScores[s.value] || 0) * 10}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {mostCritical && (
            <Card className="p-6 border-destructive/20">
              <h3 className="font-bold mb-2">Área Crítica Más Común</h3>
              <p className="text-lg text-destructive font-bold">{SECTION_OPTIONS.find(s => s.value === mostCritical[0])?.label || mostCritical[0]}</p>
              <p className="text-sm text-muted-foreground">{mostCritical[1]} de {completedDiags.length} diagnósticos tienen esta como su punto más débil</p>
            </Card>
          )}

          {/* Top Leads by Commitment */}
          <Card className="p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Ranking de Leads por Compromiso</h3>
            <div className="space-y-2">
              {completedDiags
                .sort((a, b) => ((b.scores as any)?.commitment || 0) - ((a.scores as any)?.commitment || 0))
                .slice(0, 10)
                .map((d, i) => (
                  <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30">
                    <span className="text-xs font-bold text-muted-foreground w-6">#{i + 1}</span>
                    <span className="font-medium flex-1">{d.name}</span>
                    <span className="text-xs text-muted-foreground">{d.client_count || '?'} clientes</span>
                    <span className={`font-bold text-sm ${getScoreColor((d.scores as any)?.commitment || 0)}`}>{((d.scores as any)?.commitment || 0).toFixed(1)}</span>
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>

        {/* === QUESTIONS === */}
        <TabsContent value="questions" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsQuestionDialogOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Agregar Pregunta</Button>
          </div>
          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Pregunta</TableHead>
                  <TableHead>Criterio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Peso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell><GripVertical className="w-4 h-4 text-muted-foreground" /></TableCell>
                    <TableCell className="font-medium max-w-xs truncate">{q.question_text}</TableCell>
                    <TableCell className="capitalize">{SECTION_OPTIONS.find(s => s.value === q.section)?.label || q.section}</TableCell>
                    <TableCell className="capitalize">{TYPE_OPTIONS.find(tp => tp.value === q.type)?.label || q.type}</TableCell>
                    <TableCell>{q.weight}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => editQuestion(q)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteQuestion(q.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* === RULES === */}
        <TabsContent value="rules" className="space-y-4">
          <DiagnosticRulesManager />
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalle del Diagnóstico</DialogTitle></DialogHeader>
          {selectedSubmission && (() => {
            const d = selectedSubmission;
            const s = d.scores as Record<string, number> | null;
            const track = leadTracking[d.id];
            return (
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground">Nombre</p><p className="font-bold">{d.name}</p></div>
                  <div><p className="text-xs text-muted-foreground">Email</p><p className="font-bold">{d.email}</p></div>
                  <div><p className="text-xs text-muted-foreground">Teléfono</p><p className="font-bold">{d.phone || '—'}</p></div>
                  <div><p className="text-xs text-muted-foreground">País</p><p className="font-bold flex items-center gap-2"><FlagImg country={d.country} /> {d.country}</p></div>
                  <div><p className="text-xs text-muted-foreground">Clientes</p><p className="font-bold">{d.client_count || '—'}</p></div>
                  <div><p className="text-xs text-muted-foreground">Estado</p><Badge variant={d.status === 'completed' ? 'default' : 'secondary'}>{d.status}</Badge></div>
                </div>

                {s && (
                  <div>
                    <h4 className="font-bold mb-3">Scores</h4>
                    <div className="space-y-2">
                      {SECTION_OPTIONS.map(sec => (
                        <div key={sec.value} className="flex justify-between items-center">
                          <span className="text-sm">{sec.label}</span>
                          <span className={`font-bold ${getScoreColor(s[sec.value] || 0)}`}>{(s[sec.value] || 0).toFixed(1)}/10</span>
                        </div>
                      ))}
                      <div className="border-t pt-2 flex justify-between items-center font-bold">
                        <span>Índice General</span>
                        <span>{((d.results as any)?.weightedIndex || 0).toFixed(1)}/10</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-bold mb-3">Lead Management</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Temperatura</label>
                      <Select value={track?.lead_temperature || 'cold'} onValueChange={v => updateLeadField(d.id, 'lead_temperature', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(TEMP_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Status Comercial</label>
                      <Select value={track?.commercial_status || 'new'} onValueChange={v => updateLeadField(d.id, 'commercial_status', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.entries(STATUS_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Asesor Asignado</label>
                      <Input value={track?.assigned_advisor || ''} onChange={e => updateLeadField(d.id, 'assigned_advisor', e.target.value)} placeholder="Nombre del asesor" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Producto Recomendado</label>
                      <p className="text-sm font-medium">{track?.recommended_product_auto || '—'}</p>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <label className="text-xs text-muted-foreground">Notas internas</label>
                    <Textarea value={track?.notes || ''} onChange={e => updateLeadField(d.id, 'notes', e.target.value)} placeholder="Notas del equipo comercial..." rows={3} />
                  </div>
                  {track?.last_action && (
                    <p className="text-xs text-muted-foreground mt-2">Última acción: {track.last_action} — {track.last_action_at ? new Date(track.last_action_at).toLocaleString() : ''}</p>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => { setIsQuestionDialogOpen(open); if (!open) resetQuestionForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Criterio</label>
                <Select value={section} onValueChange={setSection}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SECTION_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo</label>
                <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPE_OPTIONS.map(tp => <SelectItem key={tp.value} value={tp.value}>{tp.label}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Texto</label>
              <Input value={text} onChange={e => setText(e.target.value)} placeholder="Texto de la pregunta" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción (Opcional)</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Peso (0 = dato objetivo)</label>
                <Input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} className="w-32" />
              </div>
              {parseFloat(weight) === 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Clave de dato (field_key)</label>
                  <Select value={(editingQuestion as any)?.field_key || ''} onValueChange={v => setEditingQuestion((prev: any) => prev ? { ...prev, field_key: v } : prev)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Ninguno</SelectItem>
                      {FIELD_KEY_OPTIONS.map(fk => <SelectItem key={fk.value} value={fk.value}>{fk.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            {(type === 'single_choice' || type === 'multiple_choice') && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Opciones</label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...options, { label: '', value: options.length + 1, score: 0 }])}>Agregar</Button>
                </div>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input placeholder="Etiqueta" value={opt.label} onChange={e => { const n = [...options]; n[idx].label = e.target.value; setOptions(n); }} className="flex-1" />
                    <Input type="number" placeholder="Score" value={opt.score} onChange={e => { const n = [...options]; n[idx].score = parseFloat(e.target.value); setOptions(n); }} className="w-20" />
                    <Button variant="ghost" size="icon" onClick={() => setOptions(options.filter((_,i) => i !== idx))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveQuestion}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={(open) => { setIsRuleDialogOpen(open); if (!open) resetRuleForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingRule ? 'Editar Regla' : 'Nueva Regla'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Condición</label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={ruleField} onValueChange={setRuleField}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SECTION_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select>
                <Select value={ruleOperator} onValueChange={setRuleOperator}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{OPERATOR_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}</SelectContent></Select>
                <Input type="number" step="0.1" value={ruleValue} onChange={e => setRuleValue(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">Título</label><Input value={ruleTitle} onChange={e => setRuleTitle(e.target.value)} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Descripción</label><Input value={ruleDescription} onChange={e => setRuleDescription(e.target.value)} /></div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Producto Vinculado</label>
              <Select value={ruleProductId || 'none'} onValueChange={v => setRuleProductId(v === 'none' ? '' : v)}><SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger><SelectContent><SelectItem value="none">Ninguno</SelectItem>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-2"><label className="text-sm font-medium">CTA</label><Input value={ruleCtaText} onChange={e => setRuleCtaText(e.target.value)} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Prioridad</label><Input type="number" value={rulePriority} onChange={e => setRulePriority(e.target.value)} className="w-32" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveRule}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDiagnostics;
