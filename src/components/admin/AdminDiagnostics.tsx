import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Search, Eye, Trash2, Clock, Globe, Building2, Phone, Users, Wifi, DollarSign,
  MessageSquare, Target, HelpCircle, ArrowUpDown, ArrowUp, ArrowDown, Columns3,
  Settings, ClipboardList, Plus, Pencil, GripVertical
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';

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

const AdminDiagnostics: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('submissions');
  
  // Submissions state
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  
  // Questions state
  const [questions, setQuestions] = useState<any[]>([]);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  // Question Form state
  const [section, setSection] = useState('technical');
  const [type, setType] = useState('scale');
  const [text, setText] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState<any[]>([]);
  const [weight, setWeight] = useState('1.0');

  // Rules state
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
    const { data, error } = await supabase.from('diagnostics').select('*').order('created_at', { ascending: false });
    if (!error) setDiagnostics(data || []);
    setLoading(false);
  };

  const fetchQuestions = async () => {
    const { data, error } = await supabase.from('diagnostic_questions').select('*').order('sort_order', { ascending: true });
    if (!error) setQuestions(data || []);
  };

  const fetchRules = async () => {
    const { data } = await supabase
      .from('diagnostic_recommendation_rules')
      .select('*, products:recommended_product_id(id, name)')
      .order('priority', { ascending: true });
    if (data) setRules(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, name').eq('active', true).order('sort_order');
    if (data) setProducts(data);
  };

  // === Question CRUD ===
  const handleSaveQuestion = async () => {
    setLoading(true);
    const payload = {
      section,
      type,
      question_text: text,
      description,
      options,
      weight: parseFloat(weight),
      sort_order: editingQuestion ? editingQuestion.sort_order : questions.length
    };

    let error;
    if (editingQuestion) {
      const { error: err } = await supabase.from('diagnostic_questions').update(payload).eq('id', editingQuestion.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('diagnostic_questions').insert(payload);
      error = err;
    }

    if (error) {
      toast({ title: 'Error al guardar pregunta', variant: 'destructive' });
    } else {
      toast({ title: 'Pregunta guardada exitosamente' });
      setIsQuestionDialogOpen(false);
      resetQuestionForm();
      fetchQuestions();
    }
    setLoading(false);
  };

  const resetQuestionForm = () => {
    setEditingQuestion(null);
    setSection('technical');
    setType('scale');
    setText('');
    setDescription('');
    setOptions([]);
    setWeight('1.0');
  };

  const editQuestion = (q: any) => {
    setEditingQuestion(q);
    setSection(q.section);
    setType(q.type);
    setText(q.question_text);
    setDescription(q.description || '');
    setOptions(q.options || []);
    setWeight(q.weight.toString());
    setIsQuestionDialogOpen(true);
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta pregunta?')) return;
    const { error } = await supabase.from('diagnostic_questions').delete().eq('id', id);
    if (!error) fetchQuestions();
  };

  // === Rule CRUD ===
  const resetRuleForm = () => {
    setEditingRule(null);
    setRuleField('technical');
    setRuleOperator('<');
    setRuleValue('5');
    setRuleTitle('');
    setRuleDescription('');
    setRuleCtaText('');
    setRuleProductId('');
    setRulePriority('0');
  };

  const editRule = (r: any) => {
    setEditingRule(r);
    setRuleField(r.condition_field);
    setRuleOperator(r.condition_operator);
    setRuleValue(r.condition_value.toString());
    setRuleTitle(r.title || '');
    setRuleDescription(r.description || '');
    setRuleCtaText(r.cta_text || '');
    setRuleProductId(r.recommended_product_id || '');
    setRulePriority((r.priority || 0).toString());
    setIsRuleDialogOpen(true);
  };

  const handleSaveRule = async () => {
    const payload = {
      condition_field: ruleField,
      condition_operator: ruleOperator,
      condition_value: parseFloat(ruleValue),
      title: ruleTitle,
      description: ruleDescription,
      cta_text: ruleCtaText,
      recommended_product_id: ruleProductId || null,
      priority: parseInt(rulePriority),
    };

    let error;
    if (editingRule) {
      const { error: err } = await supabase.from('diagnostic_recommendation_rules').update(payload).eq('id', editingRule.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('diagnostic_recommendation_rules').insert(payload);
      error = err;
    }

    if (error) {
      toast({ title: 'Error al guardar regla', variant: 'destructive' });
    } else {
      toast({ title: 'Regla guardada exitosamente' });
      setIsRuleDialogOpen(false);
      resetRuleForm();
      fetchRules();
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta regla?')) return;
    const { error } = await supabase.from('diagnostic_recommendation_rules').delete().eq('id', id);
    if (!error) fetchRules();
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
          <TabsTrigger value="submissions" className="gap-2">
            <ClipboardList className="w-4 h-4" /> Envíos
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <Settings className="w-4 h-4" /> Preguntas
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2">
            <Target className="w-4 h-4" /> Reglas
          </TabsTrigger>
        </TabsList>

        {/* === SUBMISSIONS TAB === */}
        <TabsContent value="submissions" className="space-y-4">
          <div className="flex gap-2 mb-2">
            <Input placeholder="Buscar por nombre o email..." value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} className="max-w-sm" />
          </div>
          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>País</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnostics.filter(d => 
                  d.name.toLowerCase().includes(globalSearch.toLowerCase()) || 
                  d.email.toLowerCase().includes(globalSearch.toLowerCase())
                ).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FlagImg country={d.country} />
                        {d.country}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={d.status === 'completed' ? 'default' : 'secondary'}>
                        {d.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(d.created_at).toLocaleDateString()} {new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedSubmission(d)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* === QUESTIONS TAB === */}
        <TabsContent value="questions" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsQuestionDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Agregar Pregunta
            </Button>
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
                    <TableCell className="capitalize">{TYPE_OPTIONS.find(t => t.value === q.type)?.label || q.type}</TableCell>
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

        {/* === RULES TAB === */}
        <TabsContent value="rules" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => { resetRuleForm(); setIsRuleDialogOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Agregar Regla
            </Button>
          </div>

          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Condición</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.priority}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {SECTION_OPTIONS.find(s => s.value === r.condition_field)?.label || r.condition_field} {r.condition_operator} {r.condition_value}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell>{(r as any).products?.name || '—'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => editRule(r)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteRule(r.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {rules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No hay reglas configuradas. Agrega reglas para recomendar productos basados en los scores del diagnóstico.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={(open) => { setIsQuestionDialogOpen(open); if (!open) resetQuestionForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Criterio (Sección)</label>
                <Select value={section} onValueChange={setSection}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTION_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Respuesta</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Texto de la Pregunta</label>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej: ¿Qué tan estable es tu red?" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción / Ayuda (Opcional)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Texto explicativo para el usuario" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Peso (0 = dato objetivo, no puntúa)</label>
              <Input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-32" />
            </div>

            {(type === 'single_choice' || type === 'multiple_choice') && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Opciones</label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setOptions([...options, { label: '', value: options.length + 1, score: 0 }])}>
                    Agregar Opción
                  </Button>
                </div>
                {options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <Input placeholder="Etiqueta" value={opt.label} onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[idx].label = e.target.value;
                      setOptions(newOpts);
                    }} className="flex-1" />
                    <Input type="number" placeholder="Score" value={opt.score} onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[idx].score = parseFloat(e.target.value);
                      setOptions(newOpts);
                    }} className="w-20" />
                    <Button variant="ghost" size="icon" onClick={() => setOptions(options.filter((_, i) => i !== idx))}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveQuestion} disabled={loading}>{loading ? 'Guardando...' : 'Guardar Pregunta'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rule Dialog */}
      <Dialog open={isRuleDialogOpen} onOpenChange={(open) => { setIsRuleDialogOpen(open); if (!open) resetRuleForm(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Editar Regla' : 'Nueva Regla de Recomendación'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Condición: Si el criterio...</label>
              <div className="grid grid-cols-3 gap-2">
                <Select value={ruleField} onValueChange={setRuleField}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SECTION_OPTIONS.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={ruleOperator} onValueChange={setRuleOperator}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OPERATOR_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" step="0.1" value={ruleValue} onChange={e => setRuleValue(e.target.value)} placeholder="Valor" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Título de la Recomendación</label>
              <Input value={ruleTitle} onChange={e => setRuleTitle(e.target.value)} placeholder="Ej: Programa de Gestión ISP" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <Input value={ruleDescription} onChange={e => setRuleDescription(e.target.value)} placeholder="Descripción breve de la recomendación" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Producto Vinculado (Opcional)</label>
              <Select value={ruleProductId} onValueChange={setRuleProductId}>
                <SelectTrigger><SelectValue placeholder="Sin producto vinculado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguno</SelectItem>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Texto del Botón CTA</label>
              <Input value={ruleCtaText} onChange={e => setRuleCtaText(e.target.value)} placeholder="Ej: Comenzar Ahora" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridad (menor = más importante)</label>
              <Input type="number" value={rulePriority} onChange={e => setRulePriority(e.target.value)} className="w-32" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveRule}>Guardar Regla</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDiagnostics;