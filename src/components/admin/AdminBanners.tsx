import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Edit, Trash2, Image as ImageIcon, Upload, Eye, EyeOff, GripVertical, Link2, Video } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logSystemEvent } from '@/lib/systemLog';

interface Banner {
  id: string; title: string; subtitle: string | null; image_url: string | null;
  video_url: string | null; link_url: string | null; link_label: string | null;
  link_target: string | null; active: boolean; sort_order: number;
  valid_from: string | null; valid_until: string | null;
  segment_exclude_product_id: string | null; created_at: string;
}

interface ProductRef { id: string; name: string; }

const AdminBanners: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<ProductRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '', subtitle: '', image_url: '', video_url: '', link_url: '',
    link_label: 'Saiba Mais', link_target: '_self', active: true, sort_order: 0,
    valid_from: '', valid_until: '', segment_exclude_product_id: '',
  });

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('banners').select('*').order('sort_order');
    setBanners(data || []);
    setLoading(false);
  }, []);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('id, name').eq('active', true).order('name');
    setProducts(data || []);
  }, []);

  useEffect(() => { fetchBanners(); fetchProducts(); }, [fetchBanners, fetchProducts]);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `banners/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) { toast({ title: 'Erro ao enviar imagem', variant: 'destructive' }); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    setForm(f => ({ ...f, image_url: publicUrl }));
    setUploading(false);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', subtitle: '', image_url: '', video_url: '', link_url: '', link_label: 'Saiba Mais', link_target: '_self', active: true, sort_order: banners.length, valid_from: '', valid_until: '', segment_exclude_product_id: '' });
    setShowEditor(true);
  };

  const openEdit = (b: Banner) => {
    setEditing(b);
    setForm({
      title: b.title, subtitle: b.subtitle || '', image_url: b.image_url || '', video_url: b.video_url || '',
      link_url: b.link_url || '', link_label: b.link_label || 'Saiba Mais', link_target: b.link_target || '_self',
      active: b.active, sort_order: b.sort_order,
      valid_from: b.valid_from ? b.valid_from.slice(0, 16) : '',
      valid_until: b.valid_until ? b.valid_until.slice(0, 16) : '',
      segment_exclude_product_id: b.segment_exclude_product_id || '',
    });
    setShowEditor(true);
  };

  const saveBanner = async () => {
    const payload: any = {
      title: form.title, subtitle: form.subtitle || null, image_url: form.image_url || null,
      video_url: form.video_url || null, link_url: form.link_url || null, link_label: form.link_label || null,
      link_target: form.link_target, active: form.active, sort_order: form.sort_order,
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
      segment_exclude_product_id: form.segment_exclude_product_id || null,
    };
    if (editing) {
      await supabase.from('banners').update(payload).eq('id', editing.id);
      logSystemEvent({ action: 'Banner atualizado', entity_type: 'settings', entity_id: editing.id, level: 'info' });
      toast({ title: 'Banner atualizado' });
    } else {
      await supabase.from('banners').insert(payload);
      logSystemEvent({ action: 'Banner criado', entity_type: 'settings', details: form.title, level: 'success' });
      toast({ title: 'Banner criado' });
    }
    setShowEditor(false);
    fetchBanners();
  };

  const confirmDelete = (id: string) => { setDeleteId(id); setShowDelete(true); };
  const executeDelete = async () => {
    if (!deleteId) return;
    await supabase.from('banners').delete().eq('id', deleteId);
    logSystemEvent({ action: 'Banner excluído', entity_type: 'settings', entity_id: deleteId, level: 'warning' });
    toast({ title: 'Banner excluído' });
    setShowDelete(false); setDeleteId(null); fetchBanners();
  };

  const toggleActive = async (b: Banner) => {
    await supabase.from('banners').update({ active: !b.active }).eq('id', b.id);
    fetchBanners();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Banners</h2>
          <p className="text-sm text-muted-foreground">Gerencie os banners da vitrine</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Novo Banner</Button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">{t('loading')}...</p>
      ) : banners.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Nenhum banner cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {banners.map(b => (
            <div key={b.id} className={`bg-card rounded-xl border overflow-hidden flex ${b.active ? 'border-primary/20' : 'border-border opacity-60'}`}>
              {b.image_url ? (
                <img src={b.image_url} alt="" className="w-40 h-24 object-cover shrink-0 hidden sm:block" />
              ) : (
                <div className="w-40 h-24 bg-secondary flex items-center justify-center shrink-0 hidden sm:block">
                  {b.video_url ? <Video className="w-6 h-6 text-muted-foreground" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
                </div>
              )}
              <div className="flex-1 p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-foreground truncate">{b.title || '(Sem título)'}</h3>
                  {b.subtitle && <p className="text-xs text-muted-foreground truncate">{b.subtitle}</p>}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={b.active ? 'default' : 'secondary'} className={b.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                      {b.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Ordem: {b.sort_order}</span>
                    {b.link_url && <Link2 className="w-3 h-3 text-muted-foreground" />}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={b.active} onCheckedChange={() => toggleActive(b)} />
                  <Button variant="ghost" size="sm" onClick={() => openEdit(b)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => confirmDelete(b.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este banner?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Editor */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Título</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Subtítulo</label>
              <Textarea value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} className="bg-secondary border-border" rows={2} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Imagem / GIF</label>
              <p className="text-xs text-muted-foreground mb-1.5">📐 Tamanho recomendado: <strong>1920 × 600px</strong> (proporção 16:5). Área útil central: <strong>1120 × 600px</strong>. Formatos: JPG, PNG, GIF, WebP.</p>
              <div className="flex gap-2">
                <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} className="bg-secondary border-border flex-1" placeholder="URL ou suba um arquivo" />
                <input ref={fileRef} type="file" accept="image/*,.gif" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="gap-1 shrink-0">
                  <Upload className="w-4 h-4" /> {uploading ? '...' : 'Subir'}
                </Button>
              </div>
              {form.image_url && <img src={form.image_url} alt="" className="mt-2 h-20 rounded object-cover" />}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">URL do Vídeo (opcional)</label>
              <Input value={form.video_url} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} className="bg-secondary border-border" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Link do botão</label>
                <Input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} className="bg-secondary border-border" placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Texto do botão</label>
                <Input value={form.link_label} onChange={e => setForm(f => ({ ...f, link_label: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Abrir em</label>
                <Select value={form.link_target} onValueChange={v => setForm(f => ({ ...f, link_target: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_self">Mesma aba</SelectItem>
                    <SelectItem value="_blank">Nova aba</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Ordem</label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Exibir a partir de</label>
                <Input type="datetime-local" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Exibir até</label>
                <Input type="datetime-local" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Ocultar para quem comprou o produto</label>
              <Select value={form.segment_exclude_product_id || 'none'} onValueChange={v => setForm(f => ({ ...f, segment_exclude_product_id: v === 'none' ? '' : v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (mostrar para todos)</SelectItem>
                  {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <span className="text-sm">{form.active ? 'Ativo' : 'Inativo'}</span>
            </div>
            <Button onClick={saveBanner} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBanners;
