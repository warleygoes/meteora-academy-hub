import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, GripVertical, X, Search, Package } from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { CONDITION_FIELDS, getGroupedConditionFields, type RuleCondition } from '@/lib/diagnosticComputedFields';

const OPERATOR_OPTIONS = [
  { value: '<', label: '<' },
  { value: '<=', label: '<=' },
  { value: '>', label: '>' },
  { value: '>=', label: '>=' },
  { value: '=', label: '=' },
];

interface RuleRow {
  id: string;
  conditions: RuleCondition[];
  conditions_logic: 'and' | 'or';
  title: string;
  description: string;
  cta_text: string;
  recommended_product_ids: string[];
  recommended_package_ids: string[];
  priority: number;
  // legacy
  condition_field?: string;
  condition_operator?: string;
  condition_value?: number;
  recommended_product_id?: string;
}

interface ProductItem {
  id: string;
  name: string;
}

interface PackageItem {
  id: string;
  name: string;
}

// Sortable rule row
const SortableRuleRow: React.FC<{
  rule: RuleRow;
  products: ProductItem[];
  packages: PackageItem[];
  onEdit: () => void;
  onDelete: () => void;
}> = ({ rule, products, packages, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: rule.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const conditions = rule.conditions?.length > 0
    ? rule.conditions
    : rule.condition_field ? [{ field: rule.condition_field, operator: rule.condition_operator || '<', value: rule.condition_value || 0 }] : [];

  const linkedNames = [
    ...(rule.recommended_product_ids || []).map(id => products.find(p => p.id === id)?.name).filter(Boolean),
    ...(rule.recommended_package_ids || []).map(id => packages.find(p => p.id === id)?.name).filter(Boolean),
  ];

  const fieldLabel = (key: string) => CONDITION_FIELDS.find(f => f.key === key)?.label || key;

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          {conditions.map((c, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <Badge variant="outline" className="text-[10px] h-4 mr-1">{rule.conditions_logic?.toUpperCase()}</Badge>}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{fieldLabel(c.field)} {c.operator} {c.value}</code>
            </div>
          ))}
        </div>
      </TableCell>
      <TableCell className="font-medium max-w-[200px] truncate">{rule.title}</TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {linkedNames.length > 0 ? linkedNames.map((n, i) => (
            <Badge key={i} variant="secondary" className="text-xs">{n}</Badge>
          )) : <span className="text-xs text-muted-foreground">—</span>}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="w-4 h-4" /></Button>
          <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="w-4 h-4 text-destructive" /></Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const DiagnosticRulesManager: React.FC = () => {
  const { toast } = useToast();
  const [rules, setRules] = useState<RuleRow[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleRow | null>(null);
  const [conditions, setConditions] = useState<RuleCondition[]>([{ field: 'technical', operator: '<', value: 5 }]);
  const [conditionsLogic, setConditionsLogic] = useState<'and' | 'or'>('and');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [itemSearch, setItemSearch] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: rulesData }, { data: prodsData }, { data: pkgsData }] = await Promise.all([
      supabase.from('diagnostic_recommendation_rules').select('*').order('priority', { ascending: true }),
      supabase.from('products').select('id, name').eq('active', true).order('sort_order'),
      supabase.from('packages').select('id, name').eq('active', true).order('name'),
    ]);
    if (rulesData) setRules(rulesData as unknown as RuleRow[]);
    if (prodsData) setProducts(prodsData);
    if (pkgsData) setPackages(pkgsData);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const resetForm = () => {
    setEditingRule(null);
    setConditions([{ field: 'technical', operator: '<', value: 5 }]);
    setConditionsLogic('and');
    setTitle('');
    setDescription('');
    setCtaText('');
    setSelectedProductIds([]);
    setSelectedPackageIds([]);
    setItemSearch('');
  };

  const openNew = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (rule: RuleRow) => {
    setEditingRule(rule);
    const conds = rule.conditions?.length > 0
      ? rule.conditions
      : rule.condition_field ? [{ field: rule.condition_field, operator: rule.condition_operator || '<', value: rule.condition_value || 0 }] : [{ field: 'technical', operator: '<', value: 5 }];
    setConditions(conds);
    setConditionsLogic((rule.conditions_logic as 'and' | 'or') || 'and');
    setTitle(rule.title || '');
    setDescription(rule.description || '');
    setCtaText(rule.cta_text || '');
    setSelectedProductIds(rule.recommended_product_ids || (rule.recommended_product_id ? [rule.recommended_product_id] : []));
    setSelectedPackageIds(rule.recommended_package_ids || []);
    setItemSearch('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload: Record<string, any> = {
      conditions: conditions as any,
      conditions_logic: conditionsLogic,
      title,
      description,
      cta_text: ctaText,
      recommended_product_ids: selectedProductIds,
      recommended_package_ids: selectedPackageIds,
      // Keep legacy fields in sync with first condition
      condition_field: conditions[0]?.field || 'technical',
      condition_operator: conditions[0]?.operator || '<',
      condition_value: conditions[0]?.value ?? 5,
      recommended_product_id: selectedProductIds[0] || null,
      priority: editingRule ? editingRule.priority : rules.length,
    };

    let error;
    if (editingRule) {
      ({ error } = await supabase.from('diagnostic_recommendation_rules').update(payload as any).eq('id', editingRule.id));
    } else {
      ({ error } = await supabase.from('diagnostic_recommendation_rules').insert(payload as any));
    }

    if (error) {
      toast({ title: 'Error al guardar regla', variant: 'destructive' });
    } else {
      toast({ title: 'Regla guardada' });
      setDialogOpen(false);
      resetForm();
      fetchAll();
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('¿Eliminar esta regla?')) return;
    await supabase.from('diagnostic_recommendation_rules').delete().eq('id', id);
    fetchAll();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rules.findIndex(r => r.id === active.id);
    const newIndex = rules.findIndex(r => r.id === over.id);
    const reordered = arrayMove(rules, oldIndex, newIndex);
    setRules(reordered);

    // Update priorities in DB
    const updates = reordered.map((r, i) =>
      supabase.from('diagnostic_recommendation_rules').update({ priority: i }).eq('id', r.id)
    );
    await Promise.all(updates);
  };

  // Condition management
  const addCondition = () => setConditions([...conditions, { field: 'technical', operator: '<', value: 5 }]);
  const removeCondition = (idx: number) => setConditions(conditions.filter((_, i) => i !== idx));
  const updateCondition = (idx: number, patch: Partial<RuleCondition>) => {
    setConditions(conditions.map((c, i) => i === idx ? { ...c, ...patch } : c));
  };

  // Item selection
  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const togglePackage = (id: string) => {
    setSelectedPackageIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const filteredProducts = products.filter(p => !itemSearch || p.name.toLowerCase().includes(itemSearch.toLowerCase()));
  const filteredPackages = packages.filter(p => !itemSearch || p.name.toLowerCase().includes(itemSearch.toLowerCase()));

  const groupedFields = getGroupedConditionFields();

  if (loading) return <p className="text-sm text-muted-foreground py-8 text-center">Cargando reglas...</p>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Agregar Regla</Button>
      </div>

      <Card className="border-border overflow-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Condiciones</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Productos / Paquetes</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext items={rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
                {rules.map(rule => (
                  <SortableRuleRow
                    key={rule.id}
                    rule={rule}
                    products={products}
                    packages={packages}
                    onEdit={() => openEdit(rule)}
                    onDelete={() => deleteRule(rule.id)}
                  />
                ))}
              </SortableContext>
              {rules.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay reglas configuradas.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </DndContext>
      </Card>

      {/* Rule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingRule ? 'Editar Regla' : 'Nueva Regla'}</DialogTitle></DialogHeader>
          <div className="space-y-5 py-4">
            {/* Conditions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Condiciones</label>
                <div className="flex items-center gap-2">
                  {conditions.length > 1 && (
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        onClick={() => setConditionsLogic('and')}
                        className={`px-2 py-1 rounded-l-md border ${conditionsLogic === 'and' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border text-muted-foreground'}`}
                      >Y (AND)</button>
                      <button
                        onClick={() => setConditionsLogic('or')}
                        className={`px-2 py-1 rounded-r-md border ${conditionsLogic === 'or' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border text-muted-foreground'}`}
                      >O (OR)</button>
                    </div>
                  )}
                  <Button type="button" variant="outline" size="sm" onClick={addCondition} className="gap-1"><Plus className="w-3 h-3" /> Condición</Button>
                </div>
              </div>
              {conditions.map((c, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {idx > 0 && <Badge variant="outline" className="text-[10px] h-5 shrink-0">{conditionsLogic.toUpperCase()}</Badge>}
                  <Select value={c.field} onValueChange={v => updateCondition(idx, { field: v })}>
                    <SelectTrigger className="flex-1 min-w-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(groupedFields).map(([group, fields]) => (
                        <React.Fragment key={group}>
                          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{group}</div>
                          {fields.map(f => (
                            <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                          ))}
                        </React.Fragment>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={c.operator} onValueChange={v => updateCondition(idx, { operator: v })}>
                    <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {OPERATOR_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" step="0.1" value={c.value} onChange={e => updateCondition(idx, { value: parseFloat(e.target.value) || 0 })} className="w-24" />
                  {conditions.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => removeCondition(idx)} className="shrink-0"><X className="w-4 h-4 text-destructive" /></Button>
                  )}
                </div>
              ))}
            </div>

            {/* Title & Description */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Título</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre de la regla" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">CTA</label>
                <Input value={ctaText} onChange={e => setCtaText(e.target.value)} placeholder="Texto del botón" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descripción</label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción de la recomendación" />
            </div>

            {/* Product / Package Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Productos y Paquetes Vinculados</label>

              {/* Selected items */}
              {(selectedProductIds.length > 0 || selectedPackageIds.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedProductIds.map(id => {
                    const prod = products.find(p => p.id === id);
                    return prod ? (
                      <Badge key={id} variant="secondary" className="gap-1 text-xs">
                        {prod.name}
                        <button onClick={() => toggleProduct(id)}><X className="w-3 h-3" /></button>
                      </Badge>
                    ) : null;
                  })}
                  {selectedPackageIds.map(id => {
                    const pkg = packages.find(p => p.id === id);
                    return pkg ? (
                      <Badge key={id} className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                        <Package className="w-3 h-3" /> {pkg.name}
                        <button onClick={() => togglePackage(id)}><X className="w-3 h-3" /></button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar producto o paquete..." value={itemSearch} onChange={e => setItemSearch(e.target.value)} className="pl-8" />
              </div>

              {/* List */}
              <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
                {filteredProducts.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 bg-muted/50 text-xs font-semibold text-muted-foreground sticky top-0 border-b border-border">
                      Productos ({filteredProducts.length})
                    </div>
                    {filteredProducts.map(p => (
                      <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 cursor-pointer border-b border-border/50 last:border-0">
                        <Checkbox checked={selectedProductIds.includes(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
                        <span className="text-sm">{p.name}</span>
                      </label>
                    ))}
                  </>
                )}
                {filteredPackages.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 bg-muted/50 text-xs font-semibold text-muted-foreground sticky top-0 border-b border-border">
                      <Package className="w-3 h-3 inline mr-1" /> Paquetes ({filteredPackages.length})
                    </div>
                    {filteredPackages.map(p => (
                      <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-secondary/50 cursor-pointer border-b border-border/50 last:border-0">
                        <Checkbox checked={selectedPackageIds.includes(p.id)} onCheckedChange={() => togglePackage(p.id)} />
                        <span className="text-sm flex items-center gap-1"><Package className="w-3 h-3 text-primary" />{p.name}</span>
                      </label>
                    ))}
                  </>
                )}
                {filteredProducts.length === 0 && filteredPackages.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-4">Sin resultados</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DiagnosticRulesManager;
