import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Edit, Trash2, CheckCircle2, Package as PackageIcon, Users, Tag, ChevronDown, ChevronRight, AlertTriangle, Calendar, Layers } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { logSystemEvent } from '@/lib/systemLog';

interface Offer {
  id: string;
  name: string;
  price: number;
  currency: string;
  stripe_price_id: string | null;
  is_default: boolean;
  active: boolean;
  valid_from: string | null;
  valid_until: string | null;
}

interface ProductRef {
  id: string;
  name: string;
  type: string;
  payment_type: string;
}

interface PackageData {
  id: string;
  name: string;
  description: string | null;
  payment_type: string;
  active: boolean;
  features: string[];
  subscriber_count: number;
  products: ProductRef[];
  offers: Offer[];
  is_trail: boolean;
  show_in_showcase: boolean;
}

interface ProductGroup {
  id: string;
  package_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  thumbnail_url: string | null;
  thumbnail_vertical_url: string | null;
}

const AdminPackages: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [allProducts, setAllProducts] = useState<ProductRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<PackageData | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedPkg, setExpandedPkg] = useState<string | null>(null);

  // Product linker
  const [showProductLinker, setShowProductLinker] = useState(false);
  const [linkerPkgId, setLinkerPkgId] = useState<string | null>(null);
  const [linkerPaymentType, setLinkerPaymentType] = useState('one_time');
  const [linkedProductIds, setLinkedProductIds] = useState<Set<string>>(new Set());

  // Offer editor
  const [showOfferEditor, setShowOfferEditor] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerPkgId, setOfferPkgId] = useState<string | null>(null);
  const [showDeleteOffer, setShowDeleteOffer] = useState(false);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);

  // Group editor
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [groupPkgId, setGroupPkgId] = useState<string | null>(null);
  const [groups, setGroups] = useState<ProductGroup[]>([]);
  const [editingGroup, setEditingGroup] = useState<ProductGroup | null>(null);
  const [groupForm, setGroupForm] = useState({ name: '', description: '', sort_order: 0 });

  const [form, setForm] = useState({
    name: '', description: '', payment_type: 'one_time', features: '', duration_days: '',
    is_trail: false, show_in_showcase: false,
  });

  const [offerForm, setOfferForm] = useState({
    name: 'Oferta Padrão', price: '', currency: 'USD', stripe_price_id: '',
    is_default: false, active: true, valid_from: '', valid_until: '', periodicity: '',
  });

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    const { data: pkgData } = await supabase.from('packages').select('*').order('created_at');

    // Subscriber counts
    const { data: userPlans } = await supabase.from('user_plans').select('package_id').eq('status', 'active');
    const countMap: Record<string, number> = {};
    userPlans?.forEach((up: any) => { countMap[up.package_id] = (countMap[up.package_id] || 0) + 1; });

    // Package products
    const { data: ppData } = await supabase.from('package_products').select('package_id, product_id, products(id, name, type, payment_type)');
    const prodMap: Record<string, ProductRef[]> = {};
    ppData?.forEach((pp: any) => {
      if (!prodMap[pp.package_id]) prodMap[pp.package_id] = [];
      if (pp.products) prodMap[pp.package_id].push(pp.products);
    });

    // Package offers
    const { data: offersData } = await supabase.from('offers').select('*').not('package_id', 'is', null).order('is_default', { ascending: false });
    const offerMap: Record<string, Offer[]> = {};
    offersData?.forEach((o: any) => {
      if (!offerMap[o.package_id]) offerMap[o.package_id] = [];
      offerMap[o.package_id].push(o);
    });

    setPackages((pkgData || []).map((p: any) => ({
      ...p,
      features: p.features || [],
      subscriber_count: countMap[p.id] || 0,
      products: prodMap[p.id] || [],
      offers: offerMap[p.id] || [],
    })));
    setLoading(false);
  }, []);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('id, name, type, payment_type').eq('active', true).order('name');
    if (data) setAllProducts(data);
  }, []);

  useEffect(() => { fetchPackages(); fetchProducts(); }, [fetchPackages, fetchProducts]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', payment_type: 'one_time', features: '', duration_days: '', is_trail: false, show_in_showcase: false });
    setShowEditor(true);
  };

  const openEdit = (pkg: PackageData) => {
    setEditing(pkg);
    setForm({
      name: pkg.name, description: pkg.description || '',
      payment_type: pkg.payment_type, features: (pkg.features || []).join('\n'),
      duration_days: (pkg as any).duration_days?.toString() || '',
      is_trail: (pkg as any).is_trail || false,
      show_in_showcase: (pkg as any).show_in_showcase || false,
    });
    setShowEditor(true);
  };

  const savePackage = async () => {
    if (!form.name.trim()) return;
    const payload: any = {
      name: form.name,
      description: form.description || null,
      payment_type: form.payment_type,
      features: form.features.split('\n').filter(f => f.trim()),
      duration_days: form.duration_days ? parseInt(form.duration_days) : null,
      is_trail: form.is_trail,
      show_in_showcase: form.show_in_showcase,
    };

    if (editing) {
      await supabase.from('packages').update(payload).eq('id', editing.id);
      logSystemEvent({ action: 'Paquete actualizado', entity_type: 'package', entity_id: editing.id, details: form.name, level: 'info' });
      toast({ title: t('packageUpdated') || 'Paquete actualizado' });
    } else {
      const { data: newPkg } = await supabase.from('packages').insert({ ...payload, active: true }).select().single();
      if (newPkg) {
        await supabase.from('offers').insert({
          package_id: newPkg.id, name: 'Oferta Padrão', price: 0, currency: 'USD', is_default: true, active: true,
        });
      }
      logSystemEvent({ action: 'Paquete creado', entity_type: 'package', entity_id: newPkg?.id, details: form.name, level: 'success' });
      toast({ title: t('packageCreated') || 'Paquete creado' });
    }
    setShowEditor(false);
    fetchPackages();
  };

  const confirmDelete = (id: string) => { setDeleteId(id); setShowDelete(true); };
  const executeDelete = async () => {
    if (!deleteId) return;
    const pkg = packages.find(p => p.id === deleteId);
    await supabase.from('packages').delete().eq('id', deleteId);
    logSystemEvent({ action: 'Paquete eliminado', entity_type: 'package', entity_id: deleteId, details: pkg?.name, level: 'warning' });
    toast({ title: t('packageDeleted') || 'Paquete eliminado' });
    setShowDelete(false); setDeleteId(null); fetchPackages();
  };

  const toggleActive = async (pkg: PackageData) => {
    await supabase.from('packages').update({ active: !pkg.active }).eq('id', pkg.id);
    fetchPackages();
  };

  // Product linker
  const openProductLinker = async (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    setLinkerPkgId(pkgId);
    setLinkerPaymentType(pkg?.payment_type || 'one_time');
    const { data } = await supabase.from('package_products').select('product_id').eq('package_id', pkgId);
    setLinkedProductIds(new Set((data || []).map(d => d.product_id)));
    setShowProductLinker(true);
  };

  const saveProductLinks = async () => {
    if (!linkerPkgId) return;
    await supabase.from('package_products').delete().eq('package_id', linkerPkgId);
    const inserts = Array.from(linkedProductIds).map((product_id, i) => ({ package_id: linkerPkgId, product_id, sort_order: i }));
    if (inserts.length > 0) await supabase.from('package_products').insert(inserts);
    logSystemEvent({ action: 'Productos del paquete actualizados', entity_type: 'package', entity_id: linkerPkgId, level: 'info' });
    toast({ title: t('productLinksUpdated') || 'Productos del paquete actualizados' });
    setShowProductLinker(false);
    fetchPackages();
  };

  // Group management
  const openGroupManager = async (pkgId: string) => {
    setGroupPkgId(pkgId);
    const { data } = await supabase.from('package_product_groups').select('*').eq('package_id', pkgId).order('sort_order');
    setGroups(data || []);
    setEditingGroup(null);
    setGroupForm({ name: '', description: '', sort_order: 0 });
    setShowGroupManager(true);
  };

  const saveGroup = async () => {
    if (!groupPkgId || !groupForm.name.trim()) return;
    if (editingGroup) {
      await supabase.from('package_product_groups').update({ name: groupForm.name, description: groupForm.description || null, sort_order: groupForm.sort_order }).eq('id', editingGroup.id);
    } else {
      await supabase.from('package_product_groups').insert({ package_id: groupPkgId, name: groupForm.name, description: groupForm.description || null, sort_order: groupForm.sort_order });
    }
    const { data } = await supabase.from('package_product_groups').select('*').eq('package_id', groupPkgId).order('sort_order');
    setGroups(data || []);
    setEditingGroup(null);
    setGroupForm({ name: '', description: '', sort_order: 0 });
    logSystemEvent({ action: editingGroup ? 'Grupo de trilha atualizado' : 'Grupo de trilha criado', entity_type: 'package', entity_id: groupPkgId, level: 'info' });
    toast({ title: editingGroup ? 'Grupo atualizado' : 'Grupo criado' });
  };

  const deleteGroup = async (groupId: string) => {
    // Unlink products from this group
    await supabase.from('package_products').update({ group_id: null }).eq('group_id', groupId);
    await supabase.from('package_product_groups').delete().eq('id', groupId);
    setGroups(prev => prev.filter(g => g.id !== groupId));
    toast({ title: 'Grupo excluído' });
  };

  const compatibleProducts = allProducts.filter(p => p.payment_type === linkerPaymentType);
  const hasIncompatible = allProducts.some(p => p.payment_type !== linkerPaymentType);

  // Offer management
  const openNewOffer = (pkgId: string) => {
    setOfferPkgId(pkgId);
    setEditingOffer(null);
    setOfferForm({ name: '', price: '', currency: 'USD', stripe_price_id: '', is_default: false, active: true, valid_from: '', valid_until: '', periodicity: '' });
    setShowOfferEditor(true);
  };

  const openEditOffer = (offer: Offer, pkgId: string) => {
    setOfferPkgId(pkgId);
    setEditingOffer(offer);
    setOfferForm({
      name: offer.name, price: offer.price.toString(), currency: offer.currency,
      stripe_price_id: offer.stripe_price_id || '', is_default: offer.is_default, active: offer.active,
      valid_from: offer.valid_from ? offer.valid_from.slice(0, 16) : '',
      valid_until: offer.valid_until ? offer.valid_until.slice(0, 16) : '',
      periodicity: (offer as any).periodicity || '',
    });
    setShowOfferEditor(true);
  };

  const saveOffer = async () => {
    if (!offerForm.name.trim() || !offerForm.price.trim()) return;
    const payload: any = {
      name: offerForm.name, price: parseFloat(offerForm.price), currency: offerForm.currency,
      stripe_price_id: offerForm.stripe_price_id || null, is_default: offerForm.is_default, active: offerForm.active,
      valid_from: offerForm.valid_from ? new Date(offerForm.valid_from).toISOString() : null,
      valid_until: offerForm.valid_until ? new Date(offerForm.valid_until).toISOString() : null,
      periodicity: offerForm.periodicity || null,
    };
    if (editingOffer) {
      await supabase.from('offers').update(payload).eq('id', editingOffer.id);
      toast({ title: t('offerUpdated') || 'Oferta actualizada' });
    } else {
      await supabase.from('offers').insert({ ...payload, package_id: offerPkgId });
      toast({ title: t('offerCreated') || 'Oferta creada' });
    }
    setShowOfferEditor(false);
    fetchPackages();
  };

  const confirmDeleteOffer = (id: string) => { setDeleteOfferId(id); setShowDeleteOffer(true); };
  const executeDeleteOffer = async () => {
    if (!deleteOfferId) return;
    await supabase.from('offers').delete().eq('id', deleteOfferId);
    toast({ title: t('offerDeleted') || 'Oferta eliminada' });
    setShowDeleteOffer(false); setDeleteOfferId(null); fetchPackages();
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = { course: 'Curso', service: 'Servicio', consultation: 'Consultoría', implementation: 'Implementación', virtual_event: 'Evento Virtual', in_person_event: 'Evento Presencial' };
    return map[type] || type;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">{t('managePackages') || 'Gestionar Paquetes'}</h2>
          <p className="text-sm text-muted-foreground">{t('adminPackagesDesc') || 'Paquetes de productos con ofertas y precios'}</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> {t('addPackage') || 'Agregar Paquete'}
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">{t('loading')}...</p>
      ) : packages.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">{t('noPackagesFound') || 'No se encontraron paquetes.'}</p>
      ) : (
        <div className="space-y-4">
          {packages.map(pkg => {
            const isExpanded = expandedPkg === pkg.id;
            const defaultOffer = pkg.offers.find(o => o.is_default);
            return (
              <div key={pkg.id} className={`bg-card rounded-xl border overflow-hidden ${pkg.active ? 'border-primary/20' : 'border-border opacity-70'}`}>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={pkg.active ? 'default' : 'secondary'} className={pkg.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                        {pkg.active ? t('active') : t('inactive')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {pkg.payment_type === 'recurring' ? (t('recurring') || 'Recorrente') : (t('oneTime') || 'Único')}
                      </Badge>
                      {(pkg as any).is_trail && <Badge className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">Trilha</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openProductLinker(pkg.id)} title={t('linkProducts') || 'Vincular productos'}>
                        <PackageIcon className="w-4 h-4" />
                      </Button>
                      {pkg.is_trail && (
                        <Button variant="ghost" size="sm" onClick={() => openGroupManager(pkg.id)} title={t('trailGroups') || 'Grupos da Trilha'}>
                          <Layers className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEdit(pkg)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => confirmDelete(pkg.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>

                  <h3 className="text-lg font-display font-bold text-foreground">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{pkg.description}</p>

                  {defaultOffer && (
                    <p className="text-3xl font-display font-bold text-foreground mb-1">
                      {defaultOffer.currency === 'USD' ? 'U$' : defaultOffer.currency} {defaultOffer.price}
                      {pkg.payment_type === 'monthly' && <span className="text-sm font-normal text-muted-foreground">/{t('month')}</span>}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {pkg.subscriber_count} {t('subscribers')}</span>
                    <span className="flex items-center gap-1"><PackageIcon className="w-3 h-3" /> {pkg.products.length} {t('productsLabel') || 'productos'}</span>
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {pkg.offers.length} {t('offers') || 'ofertas'}</span>
                  </div>

                  {/* Products */}
                  {pkg.products.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t('includedProducts') || 'Productos incluidos'}:</p>
                      <div className="flex flex-wrap gap-1">
                        {pkg.products.map(p => (
                          <Badge key={p.id} variant="secondary" className="text-xs">{p.name} <span className="opacity-60 ml-1">({getTypeLabel(p.type)})</span></Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {(pkg.features || []).length > 0 && (
                    <ul className="space-y-1 mb-3">
                      {pkg.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleActive(pkg.id as any ? pkg : pkg)}>
                      {pkg.active ? t('deactivate') : t('activate')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setExpandedPkg(isExpanded ? null : pkg.id)} className="gap-1">
                      <Tag className="w-3.5 h-3.5" /> {t('offers') || 'Ofertas'}
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>

                {/* Expanded: Offers */}
                {isExpanded && (
                  <div className="border-t border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground">{t('packageOffers') || 'Ofertas del Paquete'}</h4>
                      <Button variant="outline" size="sm" onClick={() => openNewOffer(pkg.id)} className="gap-1">
                        <Plus className="w-3 h-3" /> {t('addOffer') || 'Nueva Oferta'}
                      </Button>
                    </div>
                    {pkg.offers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t('noOffers') || 'Sin ofertas'}</p>
                    ) : (
                      <div className="space-y-2">
                        {pkg.offers.map(offer => (
                          <div key={offer.id} className={`flex items-center gap-3 p-3 rounded-lg border ${offer.is_default ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{offer.name}</span>
                                {offer.is_default && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">Default</Badge>}
                                {!offer.active && <Badge variant="secondary" className="text-xs">{t('inactive')}</Badge>}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                  {offer.currency === 'USD' ? 'U$' : offer.currency} {offer.price}
                                </span>
                                {offer.stripe_price_id && <span className="truncate max-w-32">Stripe: {offer.stripe_price_id}</span>}
                                {offer.valid_from && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {format(new Date(offer.valid_from), 'dd/MM/yy')} - {offer.valid_until ? format(new Date(offer.valid_until), 'dd/MM/yy') : '∞'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditOffer(offer, pkg.id)}><Edit className="w-3.5 h-3.5" /></Button>
                              {!offer.is_default && (
                                <Button variant="ghost" size="sm" onClick={() => confirmDeleteOffer(offer.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Package */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar el paquete "{deleteId ? packages.find(p => p.id === deleteId)?.name : ''}"?</AlertDialogTitle>
            <AlertDialogDescription>Se eliminarán todas las ofertas y vinculaciones de productos asociadas. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90"><Trash2 className="w-4 h-4 mr-2" /> Eliminar Paquete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Offer */}
      <AlertDialog open={showDeleteOffer} onOpenChange={setShowDeleteOffer}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta oferta?</AlertDialogTitle>
            <AlertDialogDescription>Los links de pago asociados dejarán de funcionar. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteOffer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90"><Trash2 className="w-4 h-4 mr-2" /> Eliminar Oferta</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Package Editor */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? (t('editPackage') || 'Editar Paquete') : (t('addPackage') || 'Agregar Paquete')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('packageName') || 'Nombre del paquete'}</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('packageDescription') || 'Descrição do paquete'}</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" rows={4} placeholder="Descrição detalhada..." />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('paymentType') || 'Tipo de pago'}</label>
              <Select value={form.payment_type} onValueChange={v => setForm(f => ({ ...f, payment_type: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="recurring">{t('recurring') || 'Recorrente'}</SelectItem>
                  <SelectItem value="one_time">{t('oneTime') || 'Pago Único'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Duración (días)</label>
              <Input type="number" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} className="bg-secondary border-border" placeholder="Ej: 30, 90, 365 (vacío = sin expiración)" />
              <p className="text-xs text-muted-foreground mt-1">Define la duración del acceso en días. Déjelo vacío para acceso sin expiración.</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('packageFeatures') || 'Características (una por línea)'}</label>
              <Textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} className="bg-secondary border-border" rows={4} placeholder={t('packageFeaturesPlaceholder') || 'Acceso a la comunidad\nSoporte prioritario\nCursos incluidos'} />
            </div>
            {/* Trail toggles */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/50">
              <Switch checked={form.is_trail} onCheckedChange={v => setForm(f => ({ ...f, is_trail: v }))} />
              <div>
                <p className="text-sm font-medium text-foreground">Trilha de cursos</p>
                <p className="text-xs text-muted-foreground">Marque se este pacote é uma trilha de aprendizado.</p>
              </div>
            </div>
            {form.is_trail && (
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/50">
                <Switch checked={form.show_in_showcase} onCheckedChange={v => setForm(f => ({ ...f, show_in_showcase: v }))} />
                <div>
                  <p className="text-sm font-medium text-foreground">Exibir na vitrine</p>
                  <p className="text-xs text-muted-foreground">Mostrar esta trilha como carrossel na vitrine do aluno.</p>
                </div>
              </div>
            )}
            <Button onClick={savePackage} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Linker */}
      <Dialog open={showProductLinker} onOpenChange={setShowProductLinker}>
        <DialogContent className="bg-card border-border max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{t('linkProducts') || 'Vincular Productos al Paquete'}</DialogTitle>
          </DialogHeader>

          {hasIncompatible && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{t('paymentTypeMismatchWarning') || 'Solo se muestran productos con el mismo tipo de pago del paquete.'}</span>
            </div>
          )}

          {compatibleProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('noCompatibleProducts') || 'No hay productos compatibles.'}</p>
          ) : (
            <div className="space-y-2">
              {compatibleProducts.map(prod => (
                <label key={prod.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:bg-secondary">
                  <Checkbox checked={linkedProductIds.has(prod.id)} onCheckedChange={() => {
                    setLinkedProductIds(prev => {
                      const next = new Set(prev);
                      next.has(prod.id) ? next.delete(prod.id) : next.add(prod.id);
                      return next;
                    });
                  }} />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{prod.name}</span>
                    <Badge variant="outline" className="text-xs">{getTypeLabel(prod.type)}</Badge>
                  </div>
                </label>
              ))}
            </div>
          )}
          <Button onClick={saveProductLinks} className="w-full mt-4">{t('save')}</Button>
        </DialogContent>
      </Dialog>

      {/* Offer Editor */}
      <Dialog open={showOfferEditor} onOpenChange={setShowOfferEditor}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingOffer ? (t('editOffer') || 'Editar Oferta') : (t('addOffer') || 'Nueva Oferta')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('offerName') || 'Nombre de la oferta'}</label>
              <Input value={offerForm.name} onChange={e => setOfferForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('planPrice')} (USD)</label>
                <Input type="number" value={offerForm.price} onChange={e => setOfferForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Stripe Price ID</label>
                <Input value={offerForm.stripe_price_id} onChange={e => setOfferForm(f => ({ ...f, stripe_price_id: e.target.value }))} className="bg-secondary border-border" placeholder="price_..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('validFrom') || 'Válido desde'}</label>
                <Input type="datetime-local" value={offerForm.valid_from} onChange={e => setOfferForm(f => ({ ...f, valid_from: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('validUntil') || 'Válido hasta'}</label>
                <Input type="datetime-local" value={offerForm.valid_until} onChange={e => setOfferForm(f => ({ ...f, valid_until: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Periodicidade</label>
              <Select value={offerForm.periodicity || 'none'} onValueChange={v => setOfferForm(f => ({ ...f, periodicity: v === 'none' ? '' : v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">N/A (pagamento único)</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="semi_annual">Semestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={offerForm.is_default} onCheckedChange={v => setOfferForm(f => ({ ...f, is_default: v }))} />
                {t('defaultOffer') || 'Oferta padrão'}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={offerForm.active} onCheckedChange={v => setOfferForm(f => ({ ...f, active: v }))} />
                {t('active')}
              </label>
            </div>
            <Button onClick={saveOffer} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Group Manager */}
      <Dialog open={showGroupManager} onOpenChange={setShowGroupManager}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{t('trailGroups') || 'Grupos da Trilha'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Existing groups */}
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noGroups') || 'Sem grupos.'}</p>
            ) : (
              <div className="space-y-2">
                {groups.map(g => (
                  <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/50">
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{g.name}</span>
                      {g.description && <p className="text-xs text-muted-foreground">{g.description}</p>}
                      <span className="text-xs text-muted-foreground">Ordem: {g.sort_order}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditingGroup(g);
                      setGroupForm({ name: g.name, description: g.description || '', sort_order: g.sort_order });
                    }}><Edit className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteGroup(g.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                ))}
              </div>
            )}

            {/* Add/Edit group form */}
            <div className="border-t border-border pt-4 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">{editingGroup ? 'Editar Grupo' : (t('addGroup') || 'Adicionar Grupo')}</h4>
              <Input value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} placeholder={t('groupName') || 'Nome do grupo'} className="bg-secondary border-border" />
              <Textarea value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} placeholder={t('groupDescription') || 'Descrição'} className="bg-secondary border-border" rows={2} />
              <Input type="number" value={groupForm.sort_order} onChange={e => setGroupForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} placeholder="Ordem" className="bg-secondary border-border w-24" />
              <div className="flex gap-2">
                <Button onClick={saveGroup} size="sm" disabled={!groupForm.name.trim()}>{t('save')}</Button>
                {editingGroup && <Button variant="outline" size="sm" onClick={() => { setEditingGroup(null); setGroupForm({ name: '', description: '', sort_order: 0 }); }}>{t('cancel')}</Button>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPackages;
