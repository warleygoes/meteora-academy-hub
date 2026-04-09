import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Save, Sparkles, Loader2, Plus, Trash2, X, Upload, Eye, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SalesPageEditorProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

interface SalesPageData {
  id?: string;
  product_id: string;
  active: boolean;
  slug: string;
  hero_headline: string;
  hero_subheadline: string;
  hero_context_line: string;
  hero_cta_text: string;
  hero_cta_link: string;
  hero_background_image: string;
  hero_video_url: string;
  hero_badge_text: string;
  hero_social_proof_micro: string;
  problem_title: string;
  transformation_title: string;
  before_points: string[];
  after_points: string[];
  social_micro_number: string;
  social_micro_text: string;
  social_micro_badge: string;
  problem_explanation_title: string;
  problem_explanation_text: string;
  problem_bullet_points: string[];
  program_name: string;
  program_format: string;
  program_duration: string;
  program_access_time: string;
  modules: { name: string; description: string; benefit: string }[];
  core_benefits: string[];
  selected_testimonials: string[];
  objections: { question: string; answer: string }[];
  anchor_items: { title: string; value: string }[];
  anchor_total_value: string;
  anchor_comparison_text: string;
  price_display: string;
  price_original: string;
  price_installments: string;
  price_currency: string;
  price_stripe_link: string;
  price_highlight_text: string;
  bonuses: { name: string; description: string; value: string; image: string }[];
  guarantee_title: string;
  guarantee_description: string;
  guarantee_days: number | null;
  guarantee_type: string;
  urgency_type: string;
  urgency_text: string;
  urgency_date: string;
  urgency_spots_remaining: number | null;
  countdown_enabled: boolean;
  final_cta_title: string;
  final_cta_text: string;
  final_cta_button_text: string;
  final_cta_link: string;
}

const emptyPage = (productId: string, slug: string): SalesPageData => ({
  product_id: productId, active: false, slug,
  hero_headline: '', hero_subheadline: '', hero_context_line: '', hero_cta_text: '', hero_cta_link: '',
  hero_background_image: '', hero_video_url: '', hero_badge_text: '', hero_social_proof_micro: '',
  problem_title: '', transformation_title: '', before_points: [], after_points: [],
  social_micro_number: '', social_micro_text: '', social_micro_badge: '',
  problem_explanation_title: '', problem_explanation_text: '', problem_bullet_points: [],
  program_name: '', program_format: '', program_duration: '', program_access_time: '',
  modules: [], core_benefits: [], selected_testimonials: [],
  objections: [], anchor_items: [], anchor_total_value: '', anchor_comparison_text: '',
  price_display: '', price_original: '', price_installments: '', price_currency: 'USD',
  price_stripe_link: '', price_highlight_text: '',
  bonuses: [], guarantee_title: '', guarantee_description: '', guarantee_days: null, guarantee_type: '',
  urgency_type: '', urgency_text: '', urgency_date: '', urgency_spots_remaining: null, countdown_enabled: false,
  final_cta_title: '', final_cta_text: '', final_cta_button_text: '', final_cta_link: '',
});

const Section: React.FC<{ title: string; number: number; children: React.ReactNode }> = ({ title, number, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left">
        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{number}</span>
        <span className="font-display font-semibold text-foreground flex-1">{title}</span>
        {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 pt-0 space-y-3 border-t border-border">{children}</div>}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="text-sm text-muted-foreground mb-1 block">{label}</label>
    {children}
  </div>
);

const SalesPageEditor: React.FC<SalesPageEditorProps> = ({ productId, productName, onClose }) => {
  const { toast } = useToast();
  const [data, setData] = useState<SalesPageData>(emptyPage(productId, productName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testimonials, setTestimonials] = useState<{ id: string; person_name: string; role: string | null }[]>([]);
  const [generatingAI, setGeneratingAI] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const [{ data: sp }, { data: test }] = await Promise.all([
        supabase.from('product_sales_pages').select('*').eq('product_id', productId).maybeSingle(),
        supabase.from('testimonials').select('id, person_name, role').eq('active', true).order('sort_order'),
      ]);
      setTestimonials(test || []);
      if (sp) {
        setData({
          ...sp,
          before_points: Array.isArray(sp.before_points) ? sp.before_points as string[] : [],
          after_points: Array.isArray(sp.after_points) ? sp.after_points as string[] : [],
          problem_bullet_points: Array.isArray(sp.problem_bullet_points) ? sp.problem_bullet_points as string[] : [],
          modules: Array.isArray(sp.modules) ? sp.modules as any[] : [],
          core_benefits: Array.isArray(sp.core_benefits) ? sp.core_benefits as string[] : [],
          selected_testimonials: Array.isArray(sp.selected_testimonials) ? sp.selected_testimonials as string[] : [],
          objections: Array.isArray(sp.objections) ? sp.objections as any[] : [],
          anchor_items: Array.isArray(sp.anchor_items) ? sp.anchor_items as any[] : [],
          bonuses: Array.isArray(sp.bonuses) ? sp.bonuses as any[] : [],
          hero_headline: sp.hero_headline || '',
          hero_subheadline: sp.hero_subheadline || '',
          hero_context_line: sp.hero_context_line || '',
          hero_cta_text: sp.hero_cta_text || '',
          hero_cta_link: sp.hero_cta_link || '',
          hero_background_image: sp.hero_background_image || '',
          hero_video_url: sp.hero_video_url || '',
          hero_badge_text: sp.hero_badge_text || '',
          hero_social_proof_micro: sp.hero_social_proof_micro || '',
          problem_title: sp.problem_title || '',
          transformation_title: sp.transformation_title || '',
          social_micro_number: sp.social_micro_number || '',
          social_micro_text: sp.social_micro_text || '',
          social_micro_badge: sp.social_micro_badge || '',
          problem_explanation_title: sp.problem_explanation_title || '',
          problem_explanation_text: sp.problem_explanation_text || '',
          program_name: sp.program_name || '',
          program_format: sp.program_format || '',
          program_duration: sp.program_duration || '',
          program_access_time: sp.program_access_time || '',
          anchor_total_value: sp.anchor_total_value || '',
          anchor_comparison_text: sp.anchor_comparison_text || '',
          price_display: sp.price_display || '',
          price_original: sp.price_original || '',
          price_installments: sp.price_installments || '',
          price_currency: sp.price_currency || 'USD',
          price_stripe_link: sp.price_stripe_link || '',
          price_highlight_text: sp.price_highlight_text || '',
          guarantee_title: sp.guarantee_title || '',
          guarantee_description: sp.guarantee_description || '',
          guarantee_days: sp.guarantee_days,
          guarantee_type: sp.guarantee_type || '',
          urgency_type: sp.urgency_type || '',
          urgency_text: sp.urgency_text || '',
          urgency_date: sp.urgency_date || '',
          urgency_spots_remaining: sp.urgency_spots_remaining,
          countdown_enabled: sp.countdown_enabled || false,
          final_cta_title: sp.final_cta_title || '',
          final_cta_text: sp.final_cta_text || '',
          final_cta_button_text: sp.final_cta_button_text || '',
          final_cta_link: sp.final_cta_link || '',
          slug: sp.slug || '',
          active: sp.active,
        });
      }
      setLoading(false);
    };
    load();
  }, [productId]);

  const set = (key: keyof SalesPageData, value: any) => setData(d => ({ ...d, [key]: value }));

  const save = async () => {
    if (!data.slug.trim()) {
      toast({ title: 'El slug es obligatorio', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const payload: any = { ...data };
    delete payload.id;
    payload.guarantee_days = data.guarantee_days || null;
    payload.urgency_spots_remaining = data.urgency_spots_remaining || null;
    payload.urgency_date = data.urgency_date || null;

    if (data.id) {
      const { error } = await supabase.from('product_sales_pages').update(payload).eq('id', data.id);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
      else { toast({ title: 'Página de ventas guardada ✓' }); }
    } else {
      const { data: created, error } = await supabase.from('product_sales_pages').insert(payload).select().single();
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
      else { setData(d => ({ ...d, id: created.id })); toast({ title: 'Página de ventas creada ✓' }); }
    }
    setSaving(false);
  };

  const generateSection = async (section: string) => {
    setGeneratingAI(prev => ({ ...prev, [section]: true }));
    try {
      const { data: result, error } = await supabase.functions.invoke('generate-sales-page-content', {
        body: { section, productName, salesPageData: data },
      });
      if (error) throw error;
      if (result?.error) { toast({ title: result.error, variant: 'destructive' }); return; }
      const content = result?.content;
      if (!content) return;

      if (section === 'hero') {
        setData(d => ({ ...d, ...content }));
      } else if (section === 'before_after') {
        setData(d => ({ ...d, problem_title: content.problem_title || d.problem_title, transformation_title: content.transformation_title || d.transformation_title, before_points: content.before_points || d.before_points, after_points: content.after_points || d.after_points }));
      } else if (section === 'problem') {
        setData(d => ({ ...d, problem_explanation_title: content.problem_explanation_title || d.problem_explanation_title, problem_explanation_text: content.problem_explanation_text || d.problem_explanation_text, problem_bullet_points: content.problem_bullet_points || d.problem_bullet_points }));
      } else if (section === 'deliverables') {
        setData(d => ({ ...d, program_name: content.program_name || d.program_name, program_format: content.program_format || d.program_format, program_duration: content.program_duration || d.program_duration, modules: content.modules || d.modules, core_benefits: content.core_benefits || d.core_benefits }));
      } else if (section === 'objections') {
        setData(d => ({ ...d, objections: content.objections || d.objections }));
      } else if (section === 'anchoring') {
        setData(d => ({ ...d, anchor_items: content.anchor_items || d.anchor_items, anchor_total_value: content.anchor_total_value || d.anchor_total_value, anchor_comparison_text: content.anchor_comparison_text || d.anchor_comparison_text }));
      } else if (section === 'bonuses') {
        setData(d => ({ ...d, bonuses: content.bonuses || d.bonuses }));
      } else if (section === 'guarantee') {
        setData(d => ({ ...d, guarantee_title: content.guarantee_title || d.guarantee_title, guarantee_description: content.guarantee_description || d.guarantee_description, guarantee_days: content.guarantee_days ?? d.guarantee_days, guarantee_type: content.guarantee_type || d.guarantee_type }));
      } else if (section === 'urgency') {
        setData(d => ({ ...d, urgency_type: content.urgency_type || d.urgency_type, urgency_text: content.urgency_text || d.urgency_text }));
      } else if (section === 'final_cta') {
        setData(d => ({ ...d, final_cta_title: content.final_cta_title || d.final_cta_title, final_cta_text: content.final_cta_text || d.final_cta_text, final_cta_button_text: content.final_cta_button_text || d.final_cta_button_text }));
      }
      toast({ title: 'Contenido generado con IA ✨' });
    } catch (e: any) {
      toast({ title: 'Error al generar', description: e.message, variant: 'destructive' });
    } finally {
      setGeneratingAI(prev => ({ ...prev, [section]: false }));
    }
  };

  const AIBtn: React.FC<{ section: string }> = ({ section }) => (
    <Button variant="ghost" size="sm" onClick={() => generateSection(section)} disabled={generatingAI[section]} className="gap-1 text-xs h-7 text-primary shrink-0">
      {generatingAI[section] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Generar con IA
    </Button>
  );

  const uploadHeroImage = async (file: File) => {
    const ext = file.name.split('.').pop();
    const path = `sales-pages/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    set('hero_background_image', publicUrl);
    toast({ title: 'Imagen subida ✓' });
  };

  // Repeatable list helpers
  const addToList = (key: keyof SalesPageData, item: any) => setData(d => ({ ...d, [key]: [...(d[key] as any[]), item] }));
  const removeFromList = (key: keyof SalesPageData, idx: number) => setData(d => ({ ...d, [key]: (d[key] as any[]).filter((_, i) => i !== idx) }));
  const updateInList = (key: keyof SalesPageData, idx: number, value: any) => setData(d => ({ ...d, [key]: (d[key] as any[]).map((item, i) => i === idx ? value : item) }));

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Página de Ventas: {productName}</h2>
          <p className="text-sm text-muted-foreground">Configure cada sección de la página de alta conversión</p>
        </div>
        <div className="flex items-center gap-2">
          {data.active && data.slug && (
            <a href={`/sales/${data.slug}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1"><Eye className="w-4 h-4" /> Vista previa</Button>
            </a>
          )}
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar
          </Button>
          <Button variant="ghost" onClick={onClose}>Volver</Button>
        </div>
      </div>

      {/* General */}
      <div className="bg-card p-4 rounded-xl border border-border space-y-3">
        <div className="flex items-center gap-4">
          <Field label="Slug (URL)">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/sales/</span>
              <Input value={data.slug} onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="bg-secondary border-border flex-1" />
            </div>
          </Field>
          <div className="flex items-center gap-2 pt-5">
            <Switch checked={data.active} onCheckedChange={v => set('active', v)} />
            <span className="text-sm font-medium">{data.active ? 'Activa' : 'Inactiva'}</span>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-2">
        {/* 1. Hero */}
        <Section title="Promesa Poderosa (Hero)" number={1}>
          <div className="flex justify-end"><AIBtn section="hero" /></div>
          <Field label="Badge (ej: Programa Avanzado)"><Input value={data.hero_badge_text} onChange={e => set('hero_badge_text', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Headline principal"><Input value={data.hero_headline} onChange={e => set('hero_headline', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Subheadline"><Textarea value={data.hero_subheadline} onChange={e => set('hero_subheadline', e.target.value)} className="bg-secondary border-border" rows={2} /></Field>
          <Field label="Contexto (frase corta)"><Input value={data.hero_context_line} onChange={e => set('hero_context_line', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Texto del CTA"><Input value={data.hero_cta_text} onChange={e => set('hero_cta_text', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Link del CTA"><Input value={data.hero_cta_link} onChange={e => set('hero_cta_link', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Micro prueba social (ej: +327 ISPs ya aplicaron)"><Input value={data.hero_social_proof_micro} onChange={e => set('hero_social_proof_micro', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Imagen de fondo">
            <div className="flex gap-2">
              <Input value={data.hero_background_image} onChange={e => set('hero_background_image', e.target.value)} className="bg-secondary border-border flex-1" placeholder="URL o subir" />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadHeroImage(e.target.files[0])} />
              <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1 shrink-0"><Upload className="w-4 h-4" /></Button>
            </div>
            {data.hero_background_image && <img src={data.hero_background_image} alt="" className="mt-2 h-20 rounded object-cover" />}
          </Field>
          <Field label="Video URL (opcional)"><Input value={data.hero_video_url} onChange={e => set('hero_video_url', e.target.value)} className="bg-secondary border-border" /></Field>
        </Section>

        {/* 2. Before vs After */}
        <Section title="Antes vs Después" number={2}>
          <div className="flex justify-end"><AIBtn section="before_after" /></div>
          <Field label="Título del problema"><Input value={data.problem_title} onChange={e => set('problem_title', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Título de transformación"><Input value={data.transformation_title} onChange={e => set('transformation_title', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Puntos ANTES">
            {data.before_points.map((p, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <Input value={p} onChange={e => updateInList('before_points', i, e.target.value)} className="bg-secondary border-border flex-1" />
                <Button variant="ghost" size="sm" onClick={() => removeFromList('before_points', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addToList('before_points', '')} className="gap-1 mt-1"><Plus className="w-3 h-3" /> Agregar</Button>
          </Field>
          <Field label="Puntos DESPUÉS">
            {data.after_points.map((p, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <Input value={p} onChange={e => updateInList('after_points', i, e.target.value)} className="bg-secondary border-border flex-1" />
                <Button variant="ghost" size="sm" onClick={() => removeFromList('after_points', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addToList('after_points', '')} className="gap-1 mt-1"><Plus className="w-3 h-3" /> Agregar</Button>
          </Field>
        </Section>

        {/* 3. Micro Social Proof */}
        <Section title="Micro Prueba Social" number={3}>
          <Field label="Número (ej: 600+)"><Input value={data.social_micro_number} onChange={e => set('social_micro_number', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Texto (ej: ISPs ya comenzaron)"><Input value={data.social_micro_text} onChange={e => set('social_micro_text', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Badge (ej: en 16 países)"><Input value={data.social_micro_badge} onChange={e => set('social_micro_badge', e.target.value)} className="bg-secondary border-border" /></Field>
        </Section>

        {/* 4. Problem */}
        <Section title="El Problema Real" number={4}>
          <div className="flex justify-end"><AIBtn section="problem" /></div>
          <Field label="Título"><Input value={data.problem_explanation_title} onChange={e => set('problem_explanation_title', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Texto explicativo"><Textarea value={data.problem_explanation_text} onChange={e => set('problem_explanation_text', e.target.value)} className="bg-secondary border-border" rows={4} /></Field>
          <Field label="Bullet points">
            {data.problem_bullet_points.map((p, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <Input value={p} onChange={e => updateInList('problem_bullet_points', i, e.target.value)} className="bg-secondary border-border flex-1" />
                <Button variant="ghost" size="sm" onClick={() => removeFromList('problem_bullet_points', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addToList('problem_bullet_points', '')} className="gap-1 mt-1"><Plus className="w-3 h-3" /> Agregar</Button>
          </Field>
        </Section>

        {/* 5. Deliverables */}
        <Section title="Entregables del Programa" number={5}>
          <div className="flex justify-end"><AIBtn section="deliverables" /></div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre del programa"><Input value={data.program_name} onChange={e => set('program_name', e.target.value)} className="bg-secondary border-border" /></Field>
            <Field label="Formato"><Input value={data.program_format} onChange={e => set('program_format', e.target.value)} className="bg-secondary border-border" placeholder="Curso, Mentoría, SaaS..." /></Field>
            <Field label="Duración"><Input value={data.program_duration} onChange={e => set('program_duration', e.target.value)} className="bg-secondary border-border" /></Field>
            <Field label="Tiempo de acceso"><Input value={data.program_access_time} onChange={e => set('program_access_time', e.target.value)} className="bg-secondary border-border" placeholder="De por vida, 12 meses..." /></Field>
          </div>
          <Field label="Módulos">
            {data.modules.map((m, i) => (
              <div key={i} className="p-3 rounded-lg border border-border bg-secondary/30 mb-2 space-y-2">
                <div className="flex gap-2">
                  <Input value={m.name} onChange={e => updateInList('modules', i, { ...m, name: e.target.value })} className="bg-secondary border-border flex-1" placeholder="Nombre del módulo" />
                  <Button variant="ghost" size="sm" onClick={() => removeFromList('modules', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                </div>
                <Input value={m.description} onChange={e => updateInList('modules', i, { ...m, description: e.target.value })} className="bg-secondary border-border" placeholder="Descripción" />
                <Input value={m.benefit} onChange={e => updateInList('modules', i, { ...m, benefit: e.target.value })} className="bg-secondary border-border" placeholder="Beneficio clave" />
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addToList('modules', { name: '', description: '', benefit: '' })} className="gap-1"><Plus className="w-3 h-3" /> Agregar módulo</Button>
          </Field>
          <Field label="Beneficios principales">
            {data.core_benefits.map((b, i) => (
              <div key={i} className="flex gap-2 mb-1">
                <Input value={b} onChange={e => updateInList('core_benefits', i, e.target.value)} className="bg-secondary border-border flex-1" />
                <Button variant="ghost" size="sm" onClick={() => removeFromList('core_benefits', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addToList('core_benefits', '')} className="gap-1 mt-1"><Plus className="w-3 h-3" /> Agregar</Button>
          </Field>
        </Section>

        {/* 6. Testimonials */}
        <Section title="Prueba Social Profunda (Testimonios)" number={6}>
          <p className="text-sm text-muted-foreground">Seleccione los testimonios del banco central que aparecerán en esta página.</p>
          <div className="space-y-2 mt-2">
            {testimonials.map(t => {
              const selected = data.selected_testimonials.includes(t.id);
              return (
                <label key={t.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selected ? 'bg-primary/10 border-primary/30' : 'border-border hover:bg-secondary/50'}`}>
                  <input type="checkbox" checked={selected} onChange={() => {
                    if (selected) set('selected_testimonials', data.selected_testimonials.filter(id => id !== t.id));
                    else set('selected_testimonials', [...data.selected_testimonials, t.id]);
                  }} className="accent-primary" />
                  <span className="text-sm font-medium text-foreground">{t.person_name}</span>
                  {t.role && <span className="text-xs text-muted-foreground">— {t.role}</span>}
                </label>
              );
            })}
            {testimonials.length === 0 && <p className="text-sm text-muted-foreground italic">No hay testimonios en el banco central.</p>}
          </div>
        </Section>

        {/* 7. Objections */}
        <Section title="Objeciones" number={7}>
          <div className="flex justify-end"><AIBtn section="objections" /></div>
          {data.objections.map((o, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-secondary/30 mb-2 space-y-2">
              <div className="flex gap-2">
                <Input value={o.question} onChange={e => updateInList('objections', i, { ...o, question: e.target.value })} className="bg-secondary border-border flex-1" placeholder="Pregunta / Objeción" />
                <Button variant="ghost" size="sm" onClick={() => removeFromList('objections', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
              <Textarea value={o.answer} onChange={e => updateInList('objections', i, { ...o, answer: e.target.value })} className="bg-secondary border-border" placeholder="Respuesta" rows={2} />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addToList('objections', { question: '', answer: '' })} className="gap-1"><Plus className="w-3 h-3" /> Agregar objeción</Button>
        </Section>

        {/* 8. Value Anchoring */}
        <Section title="Anclaje de Valor" number={8}>
          <div className="flex justify-end"><AIBtn section="anchoring" /></div>
          {data.anchor_items.map((a, i) => (
            <div key={i} className="flex gap-2 mb-1">
              <Input value={a.title} onChange={e => updateInList('anchor_items', i, { ...a, title: e.target.value })} className="bg-secondary border-border flex-1" placeholder="Escenario" />
              <Input value={a.value} onChange={e => updateInList('anchor_items', i, { ...a, value: e.target.value })} className="bg-secondary border-border w-32" placeholder="Valor" />
              <Button variant="ghost" size="sm" onClick={() => removeFromList('anchor_items', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addToList('anchor_items', { title: '', value: '' })} className="gap-1 mt-1"><Plus className="w-3 h-3" /> Agregar</Button>
          <Field label="Valor total"><Input value={data.anchor_total_value} onChange={e => set('anchor_total_value', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Texto comparativo"><Input value={data.anchor_comparison_text} onChange={e => set('anchor_comparison_text', e.target.value)} className="bg-secondary border-border" /></Field>
        </Section>

        {/* 9. Pricing */}
        <Section title="Precio" number={9}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Precio a mostrar"><Input value={data.price_display} onChange={e => set('price_display', e.target.value)} className="bg-secondary border-border" placeholder="U$ 497" /></Field>
            <Field label="Precio original (tachado)"><Input value={data.price_original} onChange={e => set('price_original', e.target.value)} className="bg-secondary border-border" placeholder="U$ 997" /></Field>
            <Field label="Cuotas"><Input value={data.price_installments} onChange={e => set('price_installments', e.target.value)} className="bg-secondary border-border" placeholder="12x de U$ 49,70" /></Field>
            <Field label="Moneda">
              <Select value={data.price_currency} onValueChange={v => set('price_currency', v)}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="BRL">BRL</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Link de pago (Stripe/Hotmart)"><Input value={data.price_stripe_link} onChange={e => set('price_stripe_link', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Texto destacado (ej: Acceso inmediato)"><Input value={data.price_highlight_text} onChange={e => set('price_highlight_text', e.target.value)} className="bg-secondary border-border" /></Field>
        </Section>

        {/* 10. Bonuses */}
        <Section title="Bonos" number={10}>
          <div className="flex justify-end"><AIBtn section="bonuses" /></div>
          {data.bonuses.map((b, i) => (
            <div key={i} className="p-3 rounded-lg border border-border bg-secondary/30 mb-2 space-y-2">
              <div className="flex gap-2">
                <Input value={b.name} onChange={e => updateInList('bonuses', i, { ...b, name: e.target.value })} className="bg-secondary border-border flex-1" placeholder="Nombre del bono" />
                <Button variant="ghost" size="sm" onClick={() => removeFromList('bonuses', i)}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
              <Input value={b.description} onChange={e => updateInList('bonuses', i, { ...b, description: e.target.value })} className="bg-secondary border-border" placeholder="Descripción" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={b.value} onChange={e => updateInList('bonuses', i, { ...b, value: e.target.value })} className="bg-secondary border-border" placeholder="Valor (ej: U$ 297)" />
                <Input value={b.image} onChange={e => updateInList('bonuses', i, { ...b, image: e.target.value })} className="bg-secondary border-border" placeholder="URL imagen (opcional)" />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => addToList('bonuses', { name: '', description: '', value: '', image: '' })} className="gap-1"><Plus className="w-3 h-3" /> Agregar bono</Button>
        </Section>

        {/* 11. Guarantee */}
        <Section title="Garantía" number={11}>
          <div className="flex justify-end"><AIBtn section="guarantee" /></div>
          <Field label="Título"><Input value={data.guarantee_title} onChange={e => set('guarantee_title', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Descripción"><Textarea value={data.guarantee_description} onChange={e => set('guarantee_description', e.target.value)} className="bg-secondary border-border" rows={3} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Días de garantía"><Input type="number" value={data.guarantee_days?.toString() || ''} onChange={e => set('guarantee_days', e.target.value ? parseInt(e.target.value) : null)} className="bg-secondary border-border" /></Field>
            <Field label="Tipo">
              <Select value={data.guarantee_type || ''} onValueChange={v => set('guarantee_type', v)}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="refund">Reembolso total</SelectItem>
                  <SelectItem value="satisfaction">Satisfacción</SelectItem>
                  <SelectItem value="conditional">Condicional</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        {/* 12. Urgency */}
        <Section title="Urgencia" number={12}>
          <div className="flex justify-end"><AIBtn section="urgency" /></div>
          <Field label="Tipo de urgencia">
            <Select value={data.urgency_type || ''} onValueChange={v => set('urgency_type', v)}>
              <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Fecha límite</SelectItem>
                <SelectItem value="spots">Cupos limitados</SelectItem>
                <SelectItem value="price_increase">Precio sube</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Texto de urgencia"><Textarea value={data.urgency_text} onChange={e => set('urgency_text', e.target.value)} className="bg-secondary border-border" rows={2} /></Field>
          {data.urgency_type === 'deadline' && (
            <Field label="Fecha límite"><Input type="datetime-local" value={data.urgency_date ? data.urgency_date.slice(0, 16) : ''} onChange={e => set('urgency_date', e.target.value ? new Date(e.target.value).toISOString() : '')} className="bg-secondary border-border" /></Field>
          )}
          {data.urgency_type === 'spots' && (
            <Field label="Cupos restantes"><Input type="number" value={data.urgency_spots_remaining?.toString() || ''} onChange={e => set('urgency_spots_remaining', e.target.value ? parseInt(e.target.value) : null)} className="bg-secondary border-border" /></Field>
          )}
          <div className="flex items-center gap-2">
            <Switch checked={data.countdown_enabled} onCheckedChange={v => set('countdown_enabled', v)} />
            <span className="text-sm">Habilitar countdown</span>
          </div>
        </Section>

        {/* 13. Final CTA */}
        <Section title="CTA Final" number={13}>
          <div className="flex justify-end"><AIBtn section="final_cta" /></div>
          <Field label="Título"><Input value={data.final_cta_title} onChange={e => set('final_cta_title', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Texto"><Textarea value={data.final_cta_text} onChange={e => set('final_cta_text', e.target.value)} className="bg-secondary border-border" rows={2} /></Field>
          <Field label="Texto del botón"><Input value={data.final_cta_button_text} onChange={e => set('final_cta_button_text', e.target.value)} className="bg-secondary border-border" /></Field>
          <Field label="Link del botón"><Input value={data.final_cta_link} onChange={e => set('final_cta_link', e.target.value)} className="bg-secondary border-border" /></Field>
        </Section>
      </div>

      {/* Bottom save */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" onClick={onClose}>Volver</Button>
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar página
        </Button>
      </div>
    </div>
  );
};

export default SalesPageEditor;
