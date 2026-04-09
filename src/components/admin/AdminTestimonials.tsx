import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Save, Video, Globe, Users, Tag, Eye, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  video_url: string | null;
  title: string | null;
  person_name: string;
  role: string | null;
  country: string | null;
  isp_size: string | null;
  result_text: string | null;
  description: string | null;
  tags: string[];
  destinations: string[];
  product_ids: string[];
  sort_order: number;
  active: boolean;
}

interface SalesProduct {
  id: string;
  name: string;
}

const AVAILABLE_TAGS = ['red', 'finanzas', 'escala', 'mentoría', 'operación', 'gestión', 'clientes', 'técnico', 'marketing'];

const AdminTestimonials: React.FC = () => {
  const { toast } = useToast();
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [saving, setSaving] = useState(false);
  const [salesProducts, setSalesProducts] = useState<SalesProduct[]>([]);

  const [form, setForm] = useState({
    video_url: '', title: '', person_name: '', role: '', country: '',
    isp_size: '', result_text: '', description: '', tags: [] as string[],
    destinations: [] as string[], product_ids: [] as string[],
    sort_order: 0, active: true,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: tData }, { data: pData }] = await Promise.all([
      supabase.from('testimonials').select('*').order('sort_order'),
      supabase.from('products').select('id, name').eq('active', true),
    ]);
    setTestimonials((tData || []) as Testimonial[]);
    setSalesProducts((pData || []).map((p: any) => ({ id: p.id, name: p.name })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openNew = () => {
    setEditing(null);
    setForm({ video_url: '', title: '', person_name: '', role: '', country: '', isp_size: '', result_text: '', description: '', tags: [], destinations: [], product_ids: [], sort_order: testimonials.length, active: true });
    setShowEditor(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditing(t);
    setForm({
      video_url: t.video_url || '', title: t.title || '', person_name: t.person_name,
      role: t.role || '', country: t.country || '', isp_size: t.isp_size || '',
      result_text: t.result_text || '', description: t.description || '',
      tags: t.tags || [], destinations: t.destinations || [],
      product_ids: t.product_ids || [], sort_order: t.sort_order, active: t.active,
    });
    setShowEditor(true);
  };

  const saveTestimonial = async () => {
    if (!form.person_name.trim()) { toast({ title: 'Nombre es obligatorio', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = {
      video_url: form.video_url || null, title: form.title || null,
      person_name: form.person_name, role: form.role || null,
      country: form.country || null, isp_size: form.isp_size || null,
      result_text: form.result_text || null, description: form.description || null,
      tags: form.tags, destinations: form.destinations, product_ids: form.product_ids,
      sort_order: form.sort_order, active: form.active, updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from('testimonials').update(payload).eq('id', editing.id);
      if (error) toast({ title: error.message, variant: 'destructive' });
      else toast({ title: 'Testimonio actualizado' });
    } else {
      const { error } = await supabase.from('testimonials').insert(payload);
      if (error) toast({ title: error.message, variant: 'destructive' });
      else toast({ title: 'Testimonio creado' });
    }
    setSaving(false);
    setShowEditor(false);
    fetchData();
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm('¿Eliminar este testimonio?')) return;
    await supabase.from('testimonials').delete().eq('id', id);
    fetchData();
    toast({ title: 'Testimonio eliminado' });
  };

  const toggleTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  };

  const toggleDestination = (dest: string) => {
    setForm(prev => ({
      ...prev,
      destinations: prev.destinations.includes(dest)
        ? prev.destinations.filter(d => d !== dest)
        : [...prev.destinations, dest],
    }));
  };

  const toggleProductId = (pid: string) => {
    setForm(prev => ({
      ...prev,
      product_ids: prev.product_ids.includes(pid)
        ? prev.product_ids.filter(p => p !== pid)
        : [...prev.product_ids, pid],
    }));
  };

  if (loading) return <div className="text-muted-foreground text-sm py-8 text-center">Cargando testimonios...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Banco de Testimonios</h2>
          <p className="text-sm text-muted-foreground">Gestione los testimonios que aparecen en la Home Page y páginas de ventas.</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Agregar Testimonio</Button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {testimonials.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay testimonios registrados.</p>
          </div>
        ) : testimonials.map(t => (
          <div key={t.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-secondary/30 transition-colors cursor-pointer" onClick={() => openEdit(t)}>
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              {t.video_url ? <Video className="w-5 h-5 text-primary" /> : <Users className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground truncate">{t.person_name}</p>
                {t.country && <span className="text-xs text-muted-foreground">· {t.country}</span>}
                {t.isp_size && <span className="text-xs text-muted-foreground">· {t.isp_size}</span>}
                {!t.active && <Badge variant="secondary" className="text-xs">Inactivo</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{t.result_text || t.title || 'Sin resultado definido'}</p>
              <div className="flex gap-1 mt-1 flex-wrap">
                {(t.tags || []).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
                {(t.destinations || []).map(d => (
                  <Badge key={d} className="text-xs bg-primary/10 text-primary border-primary/20">{d === 'home' ? 'Home' : 'Producto'}</Badge>
                ))}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteTestimonial(t.id); }} className="text-destructive hover:text-destructive shrink-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Editar Testimonio' : 'Nuevo Testimonio'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nombre *</label>
                <Input value={form.person_name} onChange={e => setForm(p => ({ ...p, person_name: e.target.value }))} placeholder="Carlos Méndez" className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Cargo / Rol</label>
                <Input value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} placeholder="ISP Owner" className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">País</label>
                <Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="México" className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Tamaño del ISP</label>
                <Input value={form.isp_size} onChange={e => setForm(p => ({ ...p, isp_size: e.target.value }))} placeholder="1.200 clientes" className="bg-secondary border-border" />
              </div>
            </div>

            {/* Video */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">URL del Video</label>
              <Input value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} placeholder="https://youtube.com/..." className="bg-secondary border-border font-mono text-sm" />
            </div>

            {/* Title */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Título</label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="bg-secondary border-border" />
            </div>

            {/* Result text */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Resultado principal (texto corto e impactante)</label>
              <Textarea value={form.result_text} onChange={e => setForm(p => ({ ...p, result_text: e.target.value }))} placeholder='"Pasamos de apagar incendios todos los días a tener una red organizada y lista para crecer."' className="bg-secondary border-border" rows={3} />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Descripción (opcional)</label>
              <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="bg-secondary border-border" rows={2} />
            </div>

            {/* Tags */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                      form.tags.includes(tag)
                        ? 'bg-primary/10 text-primary border-primary/30'
                        : 'bg-secondary text-muted-foreground border-border hover:border-primary/30'
                    }`}>
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Destinations */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Destinos de exhibición</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.destinations.includes('home')} onCheckedChange={() => toggleDestination('home')} />
                  <span className="text-sm text-foreground">Home Page (sección de testimonios)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox checked={form.destinations.includes('product')} onCheckedChange={() => toggleDestination('product')} />
                  <span className="text-sm text-foreground">Páginas de venta de productos</span>
                </label>
              </div>
            </div>

            {/* Product association (when "product" destination selected) */}
            {form.destinations.includes('product') && salesProducts.length > 0 && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Productos relacionados</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {salesProducts.map(prod => (
                    <label key={prod.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={form.product_ids.includes(prod.id)} onCheckedChange={() => toggleProductId(prod.id)} />
                      <span className="text-sm text-foreground">{prod.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Sort order + Active */}
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-foreground mb-1 block">Orden</label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} className="bg-secondary border-border w-24" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">Activo</span>
                <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} />
              </div>
            </div>

            <Button onClick={saveTestimonial} disabled={saving} className="w-full gap-2">
              <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Testimonio'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTestimonials;
