import React, { useState, useEffect, useCallback } from 'react';
import { Link2, Plus, Edit, Trash2, GripVertical, ExternalLink, Monitor, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface MenuLink {
  id: string;
  title: string;
  icon: string;
  url: string;
  open_mode: string;
  sort_order: number;
  active: boolean;
  package_ids: string[];
  product_ids: string[];
}

interface PackageOption { id: string; name: string; }
interface ProductOption { id: string; name: string; }

const ICON_OPTIONS = [
  { value: 'link', label: 'Link' },
  { value: 'external-link', label: 'External Link' },
  { value: 'globe', label: 'Globe' },
  { value: 'video', label: 'Video' },
  { value: 'book-open', label: 'Book' },
  { value: 'headphones', label: 'Headphones' },
  { value: 'message-square', label: 'Chat' },
  { value: 'calendar', label: 'Calendar' },
  { value: 'star', label: 'Star' },
  { value: 'zap', label: 'Zap' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'shield', label: 'Shield' },
  { value: 'settings', label: 'Settings' },
  { value: 'users', label: 'Users' },
  { value: 'layout-dashboard', label: 'Dashboard' },
  { value: 'file-text', label: 'Document' },
];

const OPEN_MODE_OPTIONS = [
  { value: 'same_tab', label: 'Mesma aba', icon: Monitor },
  { value: 'new_tab', label: 'Nova aba', icon: ExternalLink },
  { value: 'embed', label: 'Embutido (iframe)', icon: Code },
];

const AdminMenuLinks: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [links, setLinks] = useState<MenuLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<MenuLink | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', icon: 'link', url: '', open_mode: 'same_tab',
    sort_order: 0, active: true, package_ids: [] as string[], product_ids: [] as string[],
  });

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    const [linksRes, pkgLinksRes, prodLinksRes] = await Promise.all([
      supabase.from('menu_links').select('*').order('sort_order'),
      supabase.from('menu_link_packages').select('*'),
      supabase.from('menu_link_products').select('*'),
    ]);

    const pkgMap: Record<string, string[]> = {};
    (pkgLinksRes.data || []).forEach((r: any) => {
      if (!pkgMap[r.menu_link_id]) pkgMap[r.menu_link_id] = [];
      pkgMap[r.menu_link_id].push(r.package_id);
    });
    const prodMap: Record<string, string[]> = {};
    (prodLinksRes.data || []).forEach((r: any) => {
      if (!prodMap[r.menu_link_id]) prodMap[r.menu_link_id] = [];
      prodMap[r.menu_link_id].push(r.product_id);
    });

    setLinks((linksRes.data || []).map((l: any) => ({
      ...l,
      package_ids: pkgMap[l.id] || [],
      product_ids: prodMap[l.id] || [],
    })));
    setLoading(false);
  }, []);

  const fetchOptions = useCallback(async () => {
    const [pkgRes, prodRes] = await Promise.all([
      supabase.from('packages').select('id, name').eq('active', true).order('name'),
      supabase.from('products').select('id, name').eq('active', true).order('name'),
    ]);
    setPackages(pkgRes.data || []);
    setProducts(prodRes.data || []);
  }, []);

  useEffect(() => { fetchLinks(); fetchOptions(); }, [fetchLinks, fetchOptions]);

  const openEditor = (link?: MenuLink) => {
    if (link) {
      setEditing(link);
      setForm({
        title: link.title, icon: link.icon, url: link.url,
        open_mode: link.open_mode, sort_order: link.sort_order,
        active: link.active, package_ids: [...link.package_ids],
        product_ids: [...link.product_ids],
      });
    } else {
      setEditing(null);
      setForm({ title: '', icon: 'link', url: '', open_mode: 'same_tab', sort_order: 0, active: true, package_ids: [], product_ids: [] });
    }
    setShowEditor(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast({ title: 'Preencha título e URL', variant: 'destructive' }); return;
    }
    const payload = {
      title: form.title.trim(), icon: form.icon, url: form.url.trim(),
      open_mode: form.open_mode, sort_order: form.sort_order, active: form.active,
    };

    let linkId = editing?.id;
    if (editing) {
      const { error } = await supabase.from('menu_links').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Erro ao atualizar', variant: 'destructive' }); return; }
    } else {
      const { data, error } = await supabase.from('menu_links').insert(payload).select().single();
      if (error) { toast({ title: 'Erro ao criar', variant: 'destructive' }); return; }
      linkId = data.id;
    }

    // Sync package associations
    await supabase.from('menu_link_packages').delete().eq('menu_link_id', linkId!);
    if (form.package_ids.length > 0) {
      await supabase.from('menu_link_packages').insert(
        form.package_ids.map(pid => ({ menu_link_id: linkId!, package_id: pid }))
      );
    }

    // Sync product associations
    await supabase.from('menu_link_products').delete().eq('menu_link_id', linkId!);
    if (form.product_ids.length > 0) {
      await supabase.from('menu_link_products').insert(
        form.product_ids.map(pid => ({ menu_link_id: linkId!, product_id: pid }))
      );
    }

    toast({ title: editing ? 'Link atualizado' : 'Link criado' });
    setShowEditor(false);
    fetchLinks();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('menu_links').delete().eq('id', deleteId);
    toast({ title: 'Link excluído' });
    setShowDelete(false);
    setDeleteId(null);
    fetchLinks();
  };

  const toggleActive = async (link: MenuLink) => {
    await supabase.from('menu_links').update({ active: !link.active }).eq('id', link.id);
    fetchLinks();
  };

  const togglePkg = (id: string) => {
    setForm(f => ({
      ...f,
      package_ids: f.package_ids.includes(id)
        ? f.package_ids.filter(p => p !== id)
        : [...f.package_ids, id],
    }));
  };

  const toggleProd = (id: string) => {
    setForm(f => ({
      ...f,
      product_ids: f.product_ids.includes(id)
        ? f.product_ids.filter(p => p !== id)
        : [...f.product_ids, id],
    }));
  };

  const allAccess = form.package_ids.length === 0 && form.product_ids.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Link2 className="w-5 h-5" /> Links do Menu
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie links personalizados que aparecem no menu lateral dos alunos
          </p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-2" /> Novo Link
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : links.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Link2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>Nenhum link cadastrado</p>
          <p className="text-sm">Clique em "Novo Link" para adicionar</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map(link => (
            <div key={link.id} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{link.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {OPEN_MODE_OPTIONS.find(o => o.value === link.open_mode)?.label || link.open_mode}
                  </Badge>
                  {!link.active && <Badge variant="secondary" className="text-xs">Inativo</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {link.package_ids.length === 0 && link.product_ids.length === 0 && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">Todos os usuários</Badge>
                  )}
                  {link.package_ids.length > 0 && (
                    <Badge variant="outline" className="text-xs">{link.package_ids.length} pacote(s)</Badge>
                  )}
                  {link.product_ids.length > 0 && (
                    <Badge variant="outline" className="text-xs">{link.product_ids.length} produto(s)</Badge>
                  )}
                </div>
              </div>
              <Switch checked={link.active} onCheckedChange={() => toggleActive(link)} />
              <Button size="icon" variant="ghost" onClick={() => openEditor(link)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => { setDeleteId(link.id); setShowDelete(true); }}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Link' : 'Novo Link'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Área de Membros" />
            </div>
            <div>
              <label className="text-sm font-medium">URL *</label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Ícone</label>
                <Select value={form.icon} onValueChange={v => setForm(f => ({ ...f, icon: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map(i => (
                      <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Ordem</label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Modo de abertura</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {OPEN_MODE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setForm(f => ({ ...f, open_mode: opt.value }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-colors ${
                      form.open_mode === opt.value
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-card border-border text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              <label className="text-sm">Ativo</label>
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium">Visibilidade</label>
              <p className="text-xs text-muted-foreground mb-3">
                {allAccess
                  ? 'Visível para todos os usuários logados'
                  : 'Visível apenas para quem possui os pacotes/produtos selecionados'}
              </p>

              {packages.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">Pacotes</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {packages.map(pkg => (
                      <label key={pkg.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 p-1 rounded">
                        <Checkbox checked={form.package_ids.includes(pkg.id)} onCheckedChange={() => togglePkg(pkg.id)} />
                        {pkg.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {products.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Produtos</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {products.map(prod => (
                      <label key={prod.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-secondary/50 p-1 rounded">
                        <Checkbox checked={form.product_ids.includes(prod.id)} onCheckedChange={() => toggleProd(prod.id)} />
                        {prod.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowEditor(false)}>Cancelar</Button>
              <Button onClick={save}>{editing ? 'Salvar' : 'Criar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir link?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMenuLinks;
