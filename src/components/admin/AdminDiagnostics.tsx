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

  useEffect(() => {
    fetchDiagnostics();
    fetchQuestions();
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

        <TabsContent value="submissions" className="space-y-4">
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
                      {new Date(d.created_at).toLocaleDateString()}
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
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell><GripVertical className="w-4 h-4 text-muted-foreground" /></TableCell>
                    <TableCell className="font-medium">{q.question_text}</TableCell>
                    <TableCell className="capitalize">{t(`diag${q.section.charAt(0).toUpperCase() + q.section.slice(1)}`)}</TableCell>
                    <TableCell className="capitalize">{q.type.replace('_', ' ')}</TableCell>
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

        <TabsContent value="rules">
          <div className="text-center py-10 border border-dashed rounded-xl">
            <p className="text-muted-foreground">Configura aquí las reglas de recomendación automática.</p>
          </div>
        </TabsContent>
      </Tabs>

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
                    <SelectItem value="technical">Arquitectura Técnica</SelectItem>
                    <SelectItem value="financial">Gestión Financiera</SelectItem>
                    <SelectItem value="scale">Escala Comercial</SelectItem>
                    <SelectItem value="expansion">Potencial de Expansión</SelectItem>
                    <SelectItem value="commitment">Compromiso Estratégico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de Respuesta</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scale">Escala (1-10)</SelectItem>
                    <SelectItem value="likert">Likert (5 puntos)</SelectItem>
                    <SelectItem value="single_choice">Selección Única</SelectItem>
                    <SelectItem value="multiple_choice">Selección Múltiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Texto de la Pregunta</label>
              <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ej: ¿Qué tan estable es sua red hoje?" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción / Ayuda (Opcional)</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Texto explicativo para el usuario" />
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
    </div>
  );
};

export default AdminDiagnostics;
