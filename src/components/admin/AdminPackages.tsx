import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DollarSign, Plus, Edit, Trash2, CheckCircle2, Package as PackageIcon, Users, Tag, ChevronDown, ChevronRight, AlertTriangle, Calendar, GripVertical, Upload } from 'lucide-react';
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
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Offer {
  id: string; name: string; price: number; currency: string;
  stripe_price_id: string | null; is_default: boolean; active: boolean;
  valid_from: string | null; valid_until: string | null;
  periodicity: string | null; hotmart_url: string | null;
  payment_link_active: boolean; duration_type: string; duration_days: number | null;
  stripe_link_active: boolean; hotmart_link_active: boolean;
}

interface ProductRef {
  id: string; name: string; type: string; payment_type: string;
  pp_id?: string;
  sort_order?: number;
}

interface PackageData {
  id: string; name: string; description: string | null; payment_type: string;
  active: boolean; features: string[]; subscriber_count: number;
  products: ProductRef[]; offers: Offer[];
  show_in_showcase: boolean;
  thumbnail_url: string | null; thumbnail_vertical_url: string | null;
}

// Sortable product item for linker
const SortableProductItem: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className="flex items-center">
        <button {...listeners} className="px-1.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground">
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
};

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

  // Product linker with ordering
  const [showProductLinker, setShowProductLinker] = useState(false);
  const [linkerPkgId, setLinkerPkgId] = useState<string | null>(null);
  const [linkerPaymentType, setLinkerPaymentType] = useState('one_time');
  const [linkedProducts, setLinkedProducts] = useState<ProductRef[]>([]);

  // Offer editor
  const [showOfferEditor, setShowOfferEditor] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerPkgId, setOfferPkgId] = useState<string | null>(null);
  const [showDeleteOffer, setShowDeleteOffer] = useState(false);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);

  // Image upload
  const [uploadingH, setUploadingH] = useState(false);
  const [uploadingV, setUploadingV] = useState(false);
  const fileRefH = useRef<HTMLInputElement>(null);
  const fileRefV = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', description: '', payment_type: 'one_time', features: '', duration_days: '',
    show_in_showcase: false, thumbnail_url: '', thumbnail_vertical_url: '',
  });

  const [offerForm, setOfferForm] = useState({
    name: 'Oferta Padrão', price: '', currency: 'USD', stripe_price_id: '',
    is_default: false, active: true, valid_from: '', valid_until: '', periodicity: '',
    hotmart_url: '', payment_link_active: true, duration_type: 'no_expiration', duration_days: '',
    stripe_link_active: false, hotmart_link_active: false,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    const { data: pkgData } = await supabase.from('packages').select('*').order('created_at');
    const { data: userPlans } = await supabase.from('user_plans').select('package_id').eq('status', 'active');
    const countMap: Record<string, number> = {};
    userPlans?.forEach((up: any) => { countMap[up.package_id] = (countMap[up.package_id] || 0) + 1; });

    const { data: ppData } = await supabase.from('package_products').select('package_id, product_id, sort_order, products(id, name, type, payment_type)').order('sort_order');
    const prodMap: Record<string, ProductRef[]> = {};
    ppData?.forEach((pp: any) => {
      if (!prodMap[pp.package_id]) prodMap[pp.package_id] = [];
      if (pp.products) prodMap[pp.package_id].push({ ...pp.products, sort_order: pp.sort_order });
    });

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
      products: (prodMap[p.id] || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)),
      offers: offerMap[p.id] || [],
    })));
    setLoading(false);
  }, []);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('id, name, type, payment_type').eq('active', true).order('name');
    if (data) setAllProducts(data);
  }, []);

  useEffect(() => { fetchPackages(); fetchProducts(); }, [fetchPackages, fetchProducts]);

  // Image upload helper
  const uploadPackageImage = async (file: File, orientation: 'horizontal' | 'vertical') => {
    const setter = orientation === 'horizontal' ? setUploadingH : setUploadingV;
    setter(true);
    const ext = file.name.split('.').pop();
    const path = `pkg-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) { toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' }); setter(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    if (orientation === 'horizontal') setForm(f => ({ ...f, thumbnail_url: publicUrl }));
    else setForm(f => ({ ...f, thumbnail_vertical_url: publicUrl }));
    setter(false);
    toast({ title: 'Imagen subida' });
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', payment_type: 'one_time', features: '', duration_days: '', show_in_showcase: false, thumbnail_url: '', thumbnail_vertical_url: '' });
    setShowEditor(true);
  };

  const openEdit = (pkg: PackageData) => {
    setEditing(pkg);
    setForm({
      name: pkg.name, description: pkg.description || '',
      payment_type: pkg.payment_type, features: (pkg.features || []).join('\n'),
      duration_days: (pkg as any).duration_days?.toString() || '',
      show_in_showcase: pkg.show_in_showcase,
      thumbnail_url: pkg.thumbnail_url || '',
      thumbnail_vertical_url: pkg.thumbnail_vertical_url || '',
    });
    setShowEditor(true);
  };

  const savePackage = async () => {
    if (!form.name.trim()) return;
    const payload: any = {
      name: form.name, description: form.description || null,
      payment_type: form.payment_type,
      features: form.features.split('\n').filter(f => f.trim()),
      duration_days: form.duration_days ? parseInt(form.duration_days) : null,
      show_in_showcase: form.show_in_showcase,
      thumbnail_url: form.thumbnail_url || null,
      thumbnail_vertical_url: form.thumbnail_vertical_url || null,
    };
    if (editing) {
      await supabase.from('packages').update(payload).eq('id', editing.id);
      logSystemEvent({ action: 'Paquete actualizado', entity_type: 'package', entity_id: editing.id, details: form.name, level: 'info' });
      toast({ title: t('packageUpdated') || 'Paquete actualizado' });
    } else {
      const { data: newPkg } = await supabase.from('packages').insert({ ...payload, active: true }).select().single();
      if (newPkg) {
        await supabase.from('offers').insert({ package_id: newPkg.id, name: 'Oferta Padrão', price: 0, currency: 'USD', is_default: true, active: true });
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

  // Product linker with drag-drop ordering
  const openProductLinker = async (pkgId: string) => {
    const pkg = packages.find(p => p.id === pkgId);
    setLinkerPkgId(pkgId);
    setLinkerPaymentType(pkg?.payment_type || 'one_time');
    const { data } = await supabase.from('package_products').select('id, product_id, sort_order').eq('package_id', pkgId).order('sort_order');
    const linked = (data || []).map(d => {
      const prod = allProducts.find(p => p.id === d.product_id);
      return prod ? { ...prod, pp_id: d.id, sort_order: d.sort_order } : null;
    }).filter(Boolean) as ProductRef[];
    setLinkedProducts(linked);
    setShowProductLinker(true);
  };

  const toggleProductInLinker = (prod: ProductRef) => {
    setLinkedProducts(prev => {
      const exists = prev.find(p => p.id === prod.id);
      if (exists) return prev.filter(p => p.id !== prod.id);
      return [...prev, { ...prod, sort_order: prev.length }];
    });
  };

  const handleProductDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setLinkedProducts(prev => {
      const oldIndex = prev.findIndex(p => p.id === active.id);
      const newIndex = prev.findIndex(p => p.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const saveProductLinks = async () => {
    if (!linkerPkgId) return;
    await supabase.from('package_products').delete().eq('package_id', linkerPkgId);
    const inserts = linkedProducts.map((p, i) => ({ package_id: linkerPkgId, product_id: p.id, sort_order: i }));
    if (inserts.length > 0) await supabase.from('package_products').insert(inserts);
    logSystemEvent({ action: 'Productos del paquete actualizados', entity_type: 'package', entity_id: linkerPkgId, level: 'info' });
    toast({ title: t('productLinksUpdated') || 'Productos del paquete actualizados' });
    setShowProductLinker(false);
    fetchPackages();
  };

  const compatibleProducts = allProducts.filter(p => p.payment_type === linkerPaymentType);
  const linkedProductIds = new Set(linkedProducts.map(p => p.id));

  // Offer management
  const openNewOffer = (pkgId: string) => {
    setOfferPkgId(pkgId);
    setEditingOffer(null);
    setOfferForm({ name: '', price: '', currency: 'USD', stripe_price_id: '', is_default: false, active: true, valid_from: '', valid_until: '', periodicity: '', hotmart_url: '', payment_link_active: true, duration_type: 'no_expiration', duration_days: '', stripe_link_active: false, hotmart_link_active: false });
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
      periodicity: offer.periodicity || '',
      hotmart_url: offer.hotmart_url || '',
      payment_link_active: offer.payment_link_active ?? true,
      duration_type: offer.duration_type || 'no_expiration',
      duration_days: offer.duration_days?.toString() || '',
      stripe_link_active: offer.stripe_link_active ?? false,
      hotmart_link_active: offer.hotmart_link_active ?? false,
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
      hotmart_url: offerForm.hotmart_url || null,
      payment_link_active: offerForm.stripe_link_active || offerForm.hotmart_link_active,
      duration_type: offerForm.duration_type,
      duration_days: offerForm.duration_days ? parseInt(offerForm.duration_days) : null,
      stripe_link_active: offerForm.stripe_link_active,
      hotmart_link_active: offerForm.hotmart_link_active,
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
    const map: Record<string, string> = { course: 'Curso', service: 'Servicio', consultation: 'Consultoría', implementation: 'Implementación', virtual_event: 'Evento Virtual', in_person_event: 'Evento Presencial', saas: 'SaaS' };
    return map[type] || type;
  };

  return (
    <div>
      <input type="file" ref={fileRefH} className="hidden" accept="image/*" onChange={e => { if (e.target.files?.[0]) uploadPackageImage(e.target.files[0], 'horizontal'); }} />
      <input type="file" ref={fileRefV} className="hidden" accept="image/*" onChange={e => { if (e.target.files?.[0]) uploadPackageImage(e.target.files[0], 'vertical'); }} />

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
                      {pkg.show_in_showcase && <Badge className="text-xs bg-blue-500/10 text-blue-500 border-blue-500/20">Vitrine</Badge>}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openProductLinker(pkg.id)} title={t('linkProducts') || 'Vincular productos'}>
                        <PackageIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(pkg)}><Edit className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => confirmDelete(pkg.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    {pkg.thumbnail_url && <img src={pkg.thumbnail_url} alt="" className="w-24 h-16 object-cover rounded shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-display font-bold text-foreground">{pkg.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{pkg.description}</p>
                    </div>
                  </div>

                  {defaultOffer && (
                    <p className="text-3xl font-display font-bold text-foreground mb-1 mt-2">
                      {defaultOffer.currency === 'USD' ? 'U$' : defaultOffer.currency} {defaultOffer.price}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {pkg.subscriber_count} {t('subscribers')}</span>
                    <span className="flex items-center gap-1"><PackageIcon className="w-3 h-3" /> {pkg.products.length} {t('productsLabel') || 'productos'}</span>
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> {pkg.offers.length} {t('offers') || 'ofertas'}</span>
                  </div>

                  {pkg.products.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">{t('includedProducts') || 'Productos incluidos'}:</p>
                      <div className="flex flex-wrap gap-1">
                        {pkg.products.map((p, i) => (
                          <Badge key={p.id} variant="secondary" className="text-xs">
                            <span className="opacity-50 mr-1">{i + 1}.</span>
                            {p.name} <span className="opacity-60 ml-1">({getTypeLabel(p.type)})</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

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
                    <Button variant="outline" size="sm" onClick={() => toggleActive(pkg)}>
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
                                <span className="font-semibold text-foreground">{offer.currency === 'USD' ? 'U$' : offer.currency} {offer.price}</span>
                                {offer.stripe_price_id && <span className="truncate max-w-32">Stripe ✓</span>}
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
            <AlertDialogDescription>Se eliminarán todas las ofertas y vinculaciones de productos asociadas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Offer */}
      <AlertDialog open={showDeleteOffer} onOpenChange={setShowDeleteOffer}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta oferta?</AlertDialogTitle>
            <AlertDialogDescription>Los links de pago asociados dejarán de funcionar.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteOffer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</AlertDialogAction>
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
              <label className="text-sm text-muted-foreground mb-1 block">Descripción</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" rows={4} />
            </div>
            {/* Images */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Imagen Horizontal</label>
                {form.thumbnail_url ? (
                  <div className="relative">
                    <img src={form.thumbnail_url} alt="" className="w-full h-20 object-cover rounded border border-border" />
                    <Button variant="ghost" size="sm" className="absolute top-0 right-0 text-destructive" onClick={() => setForm(f => ({ ...f, thumbnail_url: '' }))}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => fileRefH.current?.click()} disabled={uploadingH}>
                    <Upload className="w-3.5 h-3.5" /> {uploadingH ? 'Subiendo...' : 'Subir'}
                  </Button>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Imagen Vertical</label>
                {form.thumbnail_vertical_url ? (
                  <div className="relative">
                    <img src={form.thumbnail_vertical_url} alt="" className="w-full h-20 object-cover rounded border border-border" />
                    <Button variant="ghost" size="sm" className="absolute top-0 right-0 text-destructive" onClick={() => setForm(f => ({ ...f, thumbnail_vertical_url: '' }))}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" className="w-full gap-1" onClick={() => fileRefV.current?.click()} disabled={uploadingV}>
                    <Upload className="w-3.5 h-3.5" /> {uploadingV ? 'Subiendo...' : 'Subir'}
                  </Button>
                )}
              </div>
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
              <Input type="number" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} className="bg-secondary border-border" placeholder="Vacío = sin expiración" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Características (una por línea)</label>
              <Textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} className="bg-secondary border-border" rows={3} />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/50">
              <Switch checked={form.show_in_showcase} onCheckedChange={v => setForm(f => ({ ...f, show_in_showcase: v }))} />
              <div>
                <p className="text-sm font-medium text-foreground">Exibir na vitrine</p>
                <p className="text-xs text-muted-foreground">Mostrar como carrossel na vitrine do aluno.</p>
              </div>
            </div>
            <Button onClick={savePackage} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Product Linker with drag-drop */}
      <Dialog open={showProductLinker} onOpenChange={setShowProductLinker}>
        <DialogContent className="bg-card border-border max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{t('linkProducts') || 'Vincular Productos al Paquete'}</DialogTitle>
          </DialogHeader>

          {/* Linked products (ordered, draggable) */}
          {linkedProducts.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Orden actual (arrastre para reordenar):</p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProductDragEnd}>
                <SortableContext items={linkedProducts.map(p => p.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1">
                    {linkedProducts.map((prod, i) => (
                      <SortableProductItem key={prod.id} id={prod.id}>
                        <div className="flex items-center gap-2 p-2 rounded bg-primary/5 border border-primary/20">
                          <span className="text-xs text-muted-foreground w-5">{i + 1}.</span>
                          <span className="text-sm font-medium text-foreground flex-1">{prod.name}</span>
                          <Badge variant="outline" className="text-xs">{getTypeLabel(prod.type)}</Badge>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => toggleProductInLinker(prod)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </SortableProductItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Available products */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Productos disponibles:</p>
            <div className="space-y-1">
              {compatibleProducts.filter(p => !linkedProductIds.has(p.id)).map(prod => (
                <label key={prod.id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:bg-secondary">
                  <Checkbox checked={false} onCheckedChange={() => toggleProductInLinker(prod)} />
                  <span className="text-sm text-foreground">{prod.name}</span>
                  <Badge variant="outline" className="text-xs ml-auto">{getTypeLabel(prod.type)}</Badge>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={saveProductLinks} className="w-full mt-2">{t('save')}</Button>
        </DialogContent>
      </Dialog>

      {/* Offer Editor */}
      <Dialog open={showOfferEditor} onOpenChange={setShowOfferEditor}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingOffer ? (t('editOffer') || 'Editar Oferta') : (t('addOffer') || 'Nueva Oferta')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('offerName') || 'Nombre de la oferta'}</label>
              <Input value={offerForm.name} onChange={e => setOfferForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('planPrice')} (USD)</label>
              <Input type="number" value={offerForm.price} onChange={e => setOfferForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary border-border" />
            </div>

            {/* Stripe Payment Link */}
            <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{t('stripePaymentLink')}</label>
                <Switch checked={offerForm.stripe_link_active} onCheckedChange={v => setOfferForm(f => ({ ...f, stripe_link_active: v }))} />
              </div>
              <Input value={offerForm.stripe_price_id} onChange={e => setOfferForm(f => ({ ...f, stripe_price_id: e.target.value }))} className="bg-secondary border-border" placeholder="https://buy.stripe.com/..." />
              <p className="text-xs text-muted-foreground">{t('stripePaymentLinkHint')}</p>
            </div>

            {/* Hotmart Payment Link */}
            <div className="p-3 rounded-lg border border-border bg-secondary/30 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">{t('hotmartUrl')}</label>
                <Switch checked={offerForm.hotmart_link_active} onCheckedChange={v => setOfferForm(f => ({ ...f, hotmart_link_active: v }))} />
              </div>
              <Input value={offerForm.hotmart_url} onChange={e => setOfferForm(f => ({ ...f, hotmart_url: e.target.value }))} className="bg-secondary border-border" placeholder="https://pay.hotmart.com/..." />
            </div>

            {/* Periodicity - only for recurring packages */}
            {(() => {
              const pkg = packages.find(p => p.id === offerPkgId);
              const isRecurring = pkg?.payment_type === 'recurring';
              return isRecurring ? (
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">{t('periodicity') || 'Periodicidade'}</label>
                  <Select value={offerForm.periodicity || 'monthly'} onValueChange={v => setOfferForm(f => ({ ...f, periodicity: v }))}>
                    <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{t('periodicityMonthly') || 'Mensal'}</SelectItem>
                      <SelectItem value="quarterly">{t('periodicityQuarterly') || 'Trimestral'}</SelectItem>
                      <SelectItem value="semi_annual">{t('periodicitySemiannual') || 'Semestral'}</SelectItem>
                      <SelectItem value="annual">{t('periodicityAnnual') || 'Anual'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm text-muted-foreground">{t('oneTime') || 'Pagamento Único'}</p>
                </div>
              );
            })()}

            {/* Duration control */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('accessDurationType') || 'Tipo de Acesso'}</label>
              <Select value={offerForm.duration_type} onValueChange={v => setOfferForm(f => ({ ...f, duration_type: v }))}>
                <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="no_expiration">{t('noExpiration') || 'Sem expiração'}</SelectItem>
                  <SelectItem value="days">{t('daysAccess') || 'Número de dias'}</SelectItem>
                  <SelectItem value="fixed_date">{t('fixedExpiration') || 'Até uma data'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {offerForm.duration_type === 'days' && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('durationDays') || 'Dias de acesso'}</label>
                <Input type="number" value={offerForm.duration_days} onChange={e => setOfferForm(f => ({ ...f, duration_days: e.target.value }))} className="bg-secondary border-border" placeholder="30" />
              </div>
            )}
            {offerForm.duration_type === 'fixed_date' && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('expirationDate') || 'Data de expiração do acesso'}</label>
                <Input type="date" value={offerForm.valid_until ? offerForm.valid_until.slice(0, 10) : ''} onChange={e => setOfferForm(f => ({ ...f, valid_until: e.target.value ? new Date(e.target.value).toISOString() : '' }))} className="bg-secondary border-border" />
                <p className="text-xs text-muted-foreground mt-1">Após esta data, o acesso do usuário será expirado.</p>
              </div>
            )}

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
    </div>
  );
};

export default AdminPackages;