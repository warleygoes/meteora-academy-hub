import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Edit, Trash2, Tag, ChevronDown, ChevronRight, Calendar, DollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const PRODUCT_TYPES = [
  { value: 'course', label: 'Curso' },
  { value: 'service', label: 'Servicio' },
  { value: 'consultation', label: 'Consultoría' },
  { value: 'implementation', label: 'Implementación' },
  { value: 'virtual_event', label: 'Evento Virtual' },
  { value: 'in_person_event', label: 'Evento Presencial' },
] as const;

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

interface Product {
  id: string;
  type: string;
  name: string;
  description: string | null;
  payment_type: string;
  active: boolean;
  course_id: string | null;
  thumbnail_url: string | null;
  thumbnail_vertical_url: string | null;
  sort_order: number;
  offers: Offer[];
}

const AdminProducts: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showOfferEditor, setShowOfferEditor] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offerProductId, setOfferProductId] = useState<string | null>(null);
  const [showDeleteOffer, setShowDeleteOffer] = useState(false);
  const [deleteOfferId, setDeleteOfferId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', description: '', type: 'service' as string, payment_type: 'one_time',
    course_id: '', thumbnail_url: '', thumbnail_vertical_url: '',
  });

  const [offerForm, setOfferForm] = useState({
    name: 'Oferta Padrão', price: '', currency: 'USD', stripe_price_id: '',
    is_default: false, active: true, valid_from: '', valid_until: '',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true });

    const { data: offersData } = await supabase
      .from('offers')
      .select('*')
      .not('product_id', 'is', null)
      .order('is_default', { ascending: false });

    const offersByProduct: Record<string, Offer[]> = {};
    offersData?.forEach((o: any) => {
      if (!offersByProduct[o.product_id]) offersByProduct[o.product_id] = [];
      offersByProduct[o.product_id].push(o);
    });

    setProducts((productsData || []).map((p: any) => ({
      ...p,
      offers: offersByProduct[p.id] || [],
    })));
    setLoading(false);
  }, []);

  const fetchCourses = useCallback(async () => {
    const { data } = await supabase.from('courses').select('id, title').order('title');
    if (data) setCourses(data);
  }, []);

  useEffect(() => { fetchProducts(); fetchCourses(); }, [fetchProducts, fetchCourses]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', type: 'service', payment_type: 'one_time', course_id: '', thumbnail_url: '', thumbnail_vertical_url: '' });
    setShowEditor(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || '', type: p.type,
      payment_type: p.payment_type, course_id: p.course_id || '',
      thumbnail_url: p.thumbnail_url || '', thumbnail_vertical_url: p.thumbnail_vertical_url || '',
    });
    setShowEditor(true);
  };

  const saveProduct = async () => {
    if (!form.name.trim()) return;
    const payload: any = {
      name: form.name,
      description: form.description || null,
      type: form.type,
      payment_type: form.payment_type,
      course_id: form.type === 'course' && form.course_id ? form.course_id : null,
      thumbnail_url: form.thumbnail_url || null,
      thumbnail_vertical_url: form.thumbnail_vertical_url || null,
    };

    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id);
      toast({ title: t('productUpdated') || 'Producto actualizado' });
    } else {
      const { data: newProduct } = await supabase.from('products').insert({ ...payload, active: true }).select().single();
      // Create default offer
      if (newProduct) {
        await supabase.from('offers').insert({
          product_id: newProduct.id,
          name: 'Oferta Padrão',
          price: 0,
          currency: 'USD',
          is_default: true,
          active: true,
        });
      }
      toast({ title: t('productCreated') || 'Producto creado' });
    }
    setShowEditor(false);
    fetchProducts();
  };

  const confirmDelete = (id: string) => { setDeleteId(id); setShowDelete(true); };
  const executeDelete = async () => {
    if (!deleteId) return;
    await supabase.from('products').delete().eq('id', deleteId);
    toast({ title: t('productDeleted') || 'Producto eliminado' });
    setShowDelete(false); setDeleteId(null); fetchProducts();
  };

  const toggleActive = async (p: Product) => {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id);
    fetchProducts();
  };

  // Offers
  const openNewOffer = (productId: string) => {
    setOfferProductId(productId);
    setEditingOffer(null);
    setOfferForm({ name: '', price: '', currency: 'USD', stripe_price_id: '', is_default: false, active: true, valid_from: '', valid_until: '' });
    setShowOfferEditor(true);
  };

  const openEditOffer = (offer: Offer, productId: string) => {
    setOfferProductId(productId);
    setEditingOffer(offer);
    setOfferForm({
      name: offer.name, price: offer.price.toString(), currency: offer.currency,
      stripe_price_id: offer.stripe_price_id || '', is_default: offer.is_default, active: offer.active,
      valid_from: offer.valid_from ? offer.valid_from.slice(0, 16) : '',
      valid_until: offer.valid_until ? offer.valid_until.slice(0, 16) : '',
    });
    setShowOfferEditor(true);
  };

  const saveOffer = async () => {
    if (!offerForm.name.trim() || !offerForm.price.trim()) return;
    const payload: any = {
      name: offerForm.name,
      price: parseFloat(offerForm.price),
      currency: offerForm.currency,
      stripe_price_id: offerForm.stripe_price_id || null,
      is_default: offerForm.is_default,
      active: offerForm.active,
      valid_from: offerForm.valid_from ? new Date(offerForm.valid_from).toISOString() : null,
      valid_until: offerForm.valid_until ? new Date(offerForm.valid_until).toISOString() : null,
    };

    if (editingOffer) {
      await supabase.from('offers').update(payload).eq('id', editingOffer.id);
      toast({ title: t('offerUpdated') || 'Oferta actualizada' });
    } else {
      await supabase.from('offers').insert({ ...payload, product_id: offerProductId });
      toast({ title: t('offerCreated') || 'Oferta creada' });
    }
    setShowOfferEditor(false);
    fetchProducts();
  };

  const confirmDeleteOffer = (id: string) => { setDeleteOfferId(id); setShowDeleteOffer(true); };
  const executeDeleteOffer = async () => {
    if (!deleteOfferId) return;
    await supabase.from('offers').delete().eq('id', deleteOfferId);
    toast({ title: t('offerDeleted') || 'Oferta eliminada' });
    setShowDeleteOffer(false); setDeleteOfferId(null); fetchProducts();
  };

  const getTypeLabel = (type: string) => PRODUCT_TYPES.find(t => t.value === type)?.label || type;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">{t('manageProducts') || 'Gestionar Productos'}</h2>
          <p className="text-sm text-muted-foreground">{t('adminProductsDesc') || 'Cursos, servicios, consultorías y más'}</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> {t('addProduct') || 'Agregar Producto'}
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">{t('loading')}...</p>
      ) : products.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">{t('noProductsFound') || 'No se encontraron productos.'}</p>
      ) : (
        <div className="space-y-3">
          {products.map(p => {
            const isExpanded = expandedProduct === p.id;
            const defaultOffer = p.offers.find(o => o.is_default);
            return (
              <div key={p.id} className={`bg-card rounded-xl border overflow-hidden ${p.active ? 'border-primary/20' : 'border-border opacity-70'}`}>
                <div className="p-4 flex items-center gap-4">
                  <button onClick={() => setExpandedProduct(isExpanded ? null : p.id)} className="text-muted-foreground hover:text-foreground">
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Package className="w-5 h-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-foreground truncate">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{getTypeLabel(p.type)}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {p.payment_type === 'monthly' ? (t('monthly') || 'Mensual') : (t('oneTime') || 'Único')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {p.offers.length} {t('offers') || 'ofertas'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {defaultOffer && (
                    <span className="text-lg font-bold text-foreground hidden sm:block">
                      {defaultOffer.currency === 'USD' ? 'U$' : defaultOffer.currency} {defaultOffer.price}
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDelete(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>

                {/* Expanded: Offers */}
                {isExpanded && (
                  <div className="border-t border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1">
                        <Tag className="w-4 h-4" /> {t('offers') || 'Ofertas'}
                      </h4>
                      <Button variant="outline" size="sm" onClick={() => openNewOffer(p.id)} className="gap-1">
                        <Plus className="w-3 h-3" /> {t('addOffer') || 'Nueva Oferta'}
                      </Button>
                    </div>
                    {p.offers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t('noOffers') || 'Sin ofertas'}</p>
                    ) : (
                      <div className="space-y-2">
                        {p.offers.map(offer => (
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
                              <Button variant="ghost" size="sm" onClick={() => openEditOffer(offer, p.id)}><Edit className="w-3.5 h-3.5" /></Button>
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

      {/* Delete Product */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteProductConfirm') || '¿Eliminar este producto?'}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteProductDesc') || 'Se eliminarán todas sus ofertas. Esta acción es irreversible.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('back') || 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('deleteUser') || 'Eliminar'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Offer */}
      <AlertDialog open={showDeleteOffer} onOpenChange={setShowDeleteOffer}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteOfferConfirm') || '¿Eliminar esta oferta?'}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteOfferDesc') || 'Esta acción es irreversible.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('back') || 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteOffer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('deleteUser') || 'Eliminar'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Editor */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? (t('editProduct') || 'Editar Producto') : (t('addProduct') || 'Agregar Producto')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('productName') || 'Nombre'}</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('planDescription')}</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('productType') || 'Tipo'}</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map(pt => (
                      <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('paymentType') || 'Tipo de pago'}</label>
                <Select value={form.payment_type} onValueChange={v => setForm(f => ({ ...f, payment_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t('monthly') || 'Mensual'}</SelectItem>
                    <SelectItem value="one_time">{t('oneTime') || 'Pago Único'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.type === 'course' && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('linkedCourse') || 'Curso vinculado'}</label>
                <Select value={form.course_id} onValueChange={v => setForm(f => ({ ...f, course_id: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder={t('selectCourse') || 'Seleccionar curso...'} /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('thumbnailHorizontal') || 'Imagen Horizontal (URL)'}</label>
              <Input value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} className="bg-secondary border-border" placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('thumbnailVertical') || 'Imagen Vertical (URL)'}</label>
              <Input value={form.thumbnail_vertical_url} onChange={e => setForm(f => ({ ...f, thumbnail_vertical_url: e.target.value }))} className="bg-secondary border-border" placeholder="https://..." />
            </div>

            <Button onClick={saveProduct} className="w-full">{t('save')}</Button>
          </div>
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

export default AdminProducts;
