import React, { useState, useEffect, useCallback } from 'react';
import { Link2, Plus, Edit, Trash2, GripVertical, ExternalLink, Monitor, Code,
  Link, Globe, Video, BookOpen, Headphones, MessageSquare, Calendar, Star, Zap, Rocket, Shield, Settings, Users, LayoutDashboard, FileText,
  Home, Mail, Phone, Bell, Search, Heart, Image, Map, Music, Play, Target, Award, Coffee, Compass, Database, Download, Eye, Flag, Gift, Hash, Key, Layers, LifeBuoy, Lightbulb, Lock, MapPin, Megaphone, Mic, Monitor as MonitorIcon, Package, PieChart, Radio, Send, Server, Share2, ShoppingCart, Smartphone, Speaker, Tag, ThumbsUp, Tv, Upload, Wifi, Wrench, Activity, Cpu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

interface MenuLink {
  id: string; title: string; icon: string; url: string; open_mode: string;
  sort_order: number; active: boolean; package_ids: string[]; product_ids: string[];
}

interface PackageOption { id: string; name: string; }
interface ProductOption { id: string; name: string; }

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  link: Link, 'external-link': ExternalLink, globe: Globe, video: Video, 'book-open': BookOpen,
  headphones: Headphones, 'message-square': MessageSquare, calendar: Calendar, star: Star,
  zap: Zap, rocket: Rocket, shield: Shield, settings: Settings, users: Users,
  'layout-dashboard': LayoutDashboard, 'file-text': FileText, home: Home, mail: Mail,
  phone: Phone, bell: Bell, search: Search, heart: Heart, image: Image, map: Map,
  music: Music, play: Play, target: Target, award: Award, coffee: Coffee, compass: Compass,
  database: Database, download: Download, eye: Eye, flag: Flag, gift: Gift, hash: Hash,
  key: Key, layers: Layers, 'life-buoy': LifeBuoy, lightbulb: Lightbulb, lock: Lock,
  'map-pin': MapPin, megaphone: Megaphone, mic: Mic, monitor: MonitorIcon, package: Package,
  'pie-chart': PieChart, radio: Radio, send: Send, server: Server, 'share-2': Share2,
  'shopping-cart': ShoppingCart, smartphone: Smartphone, speaker: Speaker, tag: Tag,
  'thumbs-up': ThumbsUp, tv: Tv, upload: Upload, wifi: Wifi, wrench: Wrench,
  activity: Activity, cpu: Cpu,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const IconComponent: React.FC<{ name: string; className?: string }> = ({ name, className }) => {
  const Icon = ICON_MAP[name] || Link;
  return <Icon className={className} />;
};

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
    sort_order: 0, active: true, auto_translate: false, package_ids: [] as string[], product_ids: [] as string[],
  });

  const OPEN_MODE_OPTIONS = [
    { value: 'same_tab', label: t('menuLinkSameTab'), icon: Monitor },
    { value: 'new_tab', label: t('menuLinkNewTab'), icon: ExternalLink },
    { value: 'embed', label: t('menuLinkEmbed'), icon: Code },
  ];

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
      ...l, package_ids: pkgMap[l.id] || [], product_ids: prodMap[l.id] || [],
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
      setForm({ title: link.title, icon: link.icon, url: link.url, open_mode: link.open_mode, sort_order: link.sort_order, active: link.active, auto_translate: (link as any).auto_translate || false, package_ids: [...link.package_ids], product_ids: [...link.product_ids] });
    } else {
      setEditing(null);
      setForm({ title: '', icon: 'link', url: '', open_mode: 'same_tab', sort_order: 0, active: true, auto_translate: false, package_ids: [], product_ids: [] });
    }
    setShowEditor(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.url.trim()) {
      toast({ title: t('menuLinkFillRequired'), variant: 'destructive' }); return;
    }
    const payload = { title: form.title.trim(), icon: form.icon, url: form.url.trim(), open_mode: form.open_mode, sort_order: form.sort_order, active: form.active, auto_translate: form.auto_translate };
    let linkId = editing?.id;
    if (editing) {
      const { error } = await supabase.from('menu_links').update(payload).eq('id', editing.id);
      if (error) { toast({ title: t('errorOccurred'), variant: 'destructive' }); return; }
    } else {
      const { data, error } = await supabase.from('menu_links').insert(payload).select().single();
      if (error) { toast({ title: t('errorOccurred'), variant: 'destructive' }); return; }
      linkId = data.id;
    }
    await supabase.from('menu_link_packages').delete().eq('menu_link_id', linkId!);
    if (form.package_ids.length > 0) await supabase.from('menu_link_packages').insert(form.package_ids.map(pid => ({ menu_link_id: linkId!, package_id: pid })));
    await supabase.from('menu_link_products').delete().eq('menu_link_id', linkId!);
    if (form.product_ids.length > 0) await supabase.from('menu_link_products').insert(form.product_ids.map(pid => ({ menu_link_id: linkId!, product_id: pid })));
    toast({ title: editing ? t('menuLinkUpdated') : t('menuLinkCreated') });
    setShowEditor(false);
    fetchLinks();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await supabase.from('menu_links').delete().eq('id', deleteId);
    toast({ title: t('menuLinkDeleted') });
    setShowDelete(false); setDeleteId(null); fetchLinks();
  };

  const toggleActive = async (link: MenuLink) => {
    await supabase.from('menu_links').update({ active: !link.active }).eq('id', link.id);
    fetchLinks();
  };

  const togglePkg = (id: string) => setForm(f => ({ ...f, package_ids: f.package_ids.includes(id) ? f.package_ids.filter(p => p !== id) : [...f.package_ids, id] }));
  const toggleProd = (id: string) => setForm(f => ({ ...f, product_ids: f.product_ids.includes(id) ? f.product_ids.filter(p => p !== id) : [...f.product_ids, id] }));
  const allAccess = form.package_ids.length === 0 && form.product_ids.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Link2 className="w-5 h-5" /> {t('menuLinks')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('menuLinksDesc')}</p>
        </div>
        <Button onClick={() => openEditor()}>
          <Plus className="w-4 h-4 mr-2" /> {t('menuLinkNew')}
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">{t('loading')}...</p>
      ) : links.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Link2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>{t('menuLinkNone')}</p>
          <p className="text-sm">{t('menuLinkNoneHint')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map(link => (
            <div key={link.id} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <IconComponent name={link.icon} className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{link.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {OPEN_MODE_OPTIONS.find(o => o.value === link.open_mode)?.label || link.open_mode}
                  </Badge>
                  {!link.active && <Badge variant="secondary" className="text-xs">{t('inactive')}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {link.package_ids.length === 0 && link.product_ids.length === 0 && (
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600">{t('menuLinkAllUsers')}</Badge>
                  )}
                  {link.package_ids.length > 0 && (
                    <Badge variant="outline" className="text-xs">{link.package_ids.length} {t('packages').toLowerCase()}</Badge>
                  )}
                  {link.product_ids.length > 0 && (
                    <Badge variant="outline" className="text-xs">{link.product_ids.length} {t('productsLabel')}</Badge>
                  )}
                </div>
              </div>
              <Switch checked={link.active} onCheckedChange={() => toggleActive(link)} />
              <Button size="icon" variant="ghost" onClick={() => openEditor(link)}><Edit className="w-4 h-4" /></Button>
              <Button size="icon" variant="ghost" onClick={() => { setDeleteId(link.id); setShowDelete(true); }}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t('menuLinkEdit') : t('menuLinkNew')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">{t('menuLinkTitle')} *</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={t('menuLinkTitlePlaceholder')} />
            </div>
            <div>
              <label className="text-sm font-medium">URL *</label>
              <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." />
            </div>

            {/* Icon picker grid */}
            <div>
              <label className="text-sm font-medium">{t('menuLinkIcon')}</label>
              <div className="grid grid-cols-10 gap-1.5 mt-2 p-3 rounded-lg border border-border bg-secondary/30 max-h-48 overflow-y-auto">
                {ICON_OPTIONS.map(iconName => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, icon: iconName }))}
                    className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                      form.icon === iconName
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                    title={iconName}
                  >
                    <IconComponent name={iconName} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">{t('menuLinkOrder')}</label>
                <Input type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-end gap-4 pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                  {t('active')}
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={form.auto_translate} onCheckedChange={v => setForm(f => ({ ...f, auto_translate: v }))} />
                  {t('autoTranslateAI') || 'Traducir con IA'}
                </label>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">{t('menuLinkOpenMode')}</label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {OPEN_MODE_OPTIONS.map(opt => (
                  <button key={opt.value} onClick={() => setForm(f => ({ ...f, open_mode: opt.value }))}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-colors ${
                      form.open_mode === opt.value ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border text-muted-foreground hover:bg-secondary'
                    }`}>
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <label className="text-sm font-medium">{t('menuLinkVisibility')}</label>
              <p className="text-xs text-muted-foreground mb-3">
                {allAccess ? t('menuLinkVisibilityAll') : t('menuLinkVisibilityRestricted')}
              </p>
              {packages.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-2">{t('packages')}</p>
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
                  <p className="text-sm font-medium mb-2">{t('manageProducts')}</p>
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
              <Button variant="outline" onClick={() => setShowEditor(false)}>{t('cancel')}</Button>
              <Button onClick={save}>{editing ? t('save') : t('menuLinkCreate')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('menuLinkDeleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('menuLinkDeleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMenuLinks;
