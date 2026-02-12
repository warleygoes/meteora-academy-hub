import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package, Plus, Edit, Trash2, Tag, ChevronDown, ChevronRight, Calendar, DollarSign, Upload, Image as ImageIcon } from 'lucide-react';
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
  id: string; name: string; price: number; currency: string;
  stripe_price_id: string | null; is_default: boolean; active: boolean;
  valid_from: string | null; valid_until: string | null;
}

interface Product {
  id: string; type: string; name: string; description: string | null;
  payment_type: string; active: boolean; course_id: string | null;
  thumbnail_url: string | null; thumbnail_vertical_url: string | null;
  sort_order: number; offers: Offer[];
}

const AdminProducts: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
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
  const [uploadingH, setUploadingH] = useState(false);
  const [uploadingV, setUploadingV] = useState(false);
  const fileRefH = useRef<HTMLInputElement>(null);
  const fileRefV = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', description: '', type: 'service' as string, payment_type: 'one_time',
    thumbnail_url: '', thumbnail_vertical_url: '',
  });

  const [offerForm, setOfferForm] = useState({
    name: 'Oferta Padrão', price: '', currency: 'USD', stripe_price_id: '',
    is_default: false, active: true, valid_from: '', valid_until: '',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data: productsData } = await supabase.from('products').select('*').order('sort_order', { ascending: true });
    const { data: offersData } = await supabase.from('offers').select('*').not('product_id', 'is', null).order('is_default', { ascending: false });
    const offersByProduct: Record<string, Offer[]> = {};
    offersData?.forEach((o: any) => {
      if (!offersByProduct[o.product_id]) offersByProduct[o.product_id] = [];
      offersByProduct[o.product_id].push(o);
    });
    setProducts((productsData || []).map((p: any) => ({ ...p, offers: offersByProduct[p.id] || [] })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const uploadImage = async (file: File, orientation: 'horizontal' | 'vertical') => {
    const setter = orientation === 'horizontal' ? setUploadingH : setUploadingV;
    setter(true);
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) {
      toast({ title: 'Error al subir imagen', description: error.message, variant: 'destructive' });
      setter(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    if (orientation === 'horizontal') {
      setForm(f => ({ ...f, thumbnail_url: publicUrl }));
    } else {
      setForm(f => ({ ...f, thumbnail_vertical_url: publicUrl }));
    }
    setter(false);
    toast({ title: 'Imagen subida correctamente' });
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', type: 'service', payment_type: 'one_time', thumbnail_url: '', thumbnail_vertical_url: '' });
    setShowEditor(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || '', type: p.type,
      payment_type: p.payment_type,
      thumbnail_url: p.thumbnail_url || '', thumbnail_vertical_url: p.thumbnail_vertical_url || '',
    });
    setShowEditor(true);
  };

  const saveProduct = async () => {
    if (!form.name.trim()) return;
    const payload: any = {
      name: form.name, description: form.description || null, type: form.type,
      payment_type: form.payment_type, thumbnail_url: form.thumbnail_url || null,
      thumbnail_vertical_url: form.thumbnail_vertical_url || null,
    };

    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id);
      if (form.type === 'course' && editing.course_id) {
        await supabase.from('courses').update({
          title: form.name, description: form.description || null,
          thumbnail_url: form.thumbnail_url || null, thumbnail_vertical_url: form.thumbnail_vertical_url || null,
        }).eq('id', editing.course_id);
      }
      toast({ title: 'Producto actualizado' });
    } else {
      let courseId: string | null = null;
      if (form.type === 'course') {
        const { data: newCourse } = await supabase.from('courses').insert({
          title: form.name, description: form.description || null,
          thumbnail_url: form.thumbnail_url || null, thumbnail_vertical_url: form.thumbnail_vertical_url || null,
        }).select().single();
        courseId = newCourse?.id || null;
      }
      const { data: newProduct } = await supabase.from('products').insert({ ...payload, active: true, course_id: courseId }).select().single();
      if (newProduct) {
        await supabase.from('offers').insert({ product_id: newProduct.id, name: 'Oferta Padrão', price: 0, currency: 'USD', is_default: true, active: true });
      }
      toast({ title: 'Producto creado' });
    }
    setShowEditor(false);
    fetchProducts();
  };

  const confirmDelete = (id: string) => { setDeleteId(id); setShowDelete(true); };
  const executeDelete = async () => {
    if (!deleteId) return;
    const product = products.find(p => p.id === deleteId);
    await supabase.from('products').delete().eq('id', deleteId);
    toast({ title: 'Producto eliminado' });
    setShowDelete(false); setDeleteId(null); fetchProducts();
  };

  const toggleActive = async (p: Product) => {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id);
    fetchProducts();
  };

  // Offers
  const openNewOffer = (productId: string) => {
    setOfferProductId(productId); setEditingOffer(null);
    setOfferForm({ name: '', price: '', currency: 'USD', stripe_price_id: '', is_default: false, active: true, valid_from: '', valid_until: '' });
    setShowOfferEditor(true);
  };

  const openEditOffer = (offer: Offer, productId: string) => {
    setOfferProductId(productId); setEditingOffer(offer);
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
      name: offerForm.name, price: parseFloat(offerForm.price), currency: offerForm.currency,
      stripe_price_id: offerForm.stripe_price_id || null, is_default: offerForm.is_default, active: offerForm.active,
      valid_from: offerForm.valid_from ? new Date(offerForm.valid_from).toISOString() : null,
      valid_until: offerForm.valid_until ? new Date(offerForm.valid_until).toISOString() : null,
    };
    if (editingOffer) {
      await supabase.from('offers').update(payload).eq('id', editingOffer.id);
      toast({ title: 'Oferta actualizada' });
    } else {
      await supabase.from('offers').insert({ ...payload, product_id: offerProductId });
      toast({ title: 'Oferta creada' });
    }
    setShowOfferEditor(false); fetchProducts();
  };

  const confirmDeleteOffer = (id: string) => { setDeleteOfferId(id); setShowDeleteOffer(true); };
  const executeDeleteOffer = async () => {
    if (!deleteOfferId) return;
    await supabase.from('offers').delete().eq('id', deleteOfferId);
    toast({ title: 'Oferta eliminada' });
    setShowDeleteOffer(false); setDeleteOfferId(null); fetchProducts();
  };

  const getTypeLabel = (type: string) => PRODUCT_TYPES.find(t => t.value === type)?.label || type;
  const deleteProductName = deleteId ? products.find(p => p.id === deleteId)?.name : '';
  const deleteOfferName = deleteOfferId ? products.flatMap(p => p.offers).find(o => o.id === deleteOfferId)?.name : '';

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">{t('manageProducts') || 'Gestionar Productos'}</h2>
          <p className="text-sm text-muted-foreground">{t('adminProductsDesc') || 'Cursos, servicios, consultorías y más'}</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Agregar Producto</Button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">{t('loading')}...</p>
      ) : products.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No se encontraron productos.</p>
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

                  {/* Thumbnail preview */}
                  {p.thumbnail_url ? (
                    <img src={p.thumbnail_url} alt="" className="w-16 h-10 rounded object-cover shrink-0 hidden sm:block" />
                  ) : (
                    <div className="w-16 h-10 rounded bg-secondary flex items-center justify-center shrink-0 hidden sm:block">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="min-w-0">
                      <h3 className="font-display font-bold text-foreground truncate">{p.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-xs">{getTypeLabel(p.type)}</Badge>
                        <Badge variant="outline" className="text-xs">
                          {p.payment_type === 'monthly' ? 'Mensual' : 'Único'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{p.offers.length} ofertas</span>
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

                {isExpanded && (
                  <div className="border-t border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1"><Tag className="w-4 h-4" /> Ofertas</h4>
                      <Button variant="outline" size="sm" onClick={() => openNewOffer(p.id)} className="gap-1"><Plus className="w-3 h-3" /> Nueva Oferta</Button>
                    </div>
                    {p.offers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Sin ofertas</p>
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
                                <span className="font-semibold text-foreground">{offer.currency === 'USD' ? 'U$' : offer.currency} {offer.price}</span>
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
            <AlertDialogTitle>¿Eliminar el producto "{deleteProductName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todas las ofertas asociadas a este producto. Si es un curso, también se eliminará todo su contenido (módulos y aulas). Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar Producto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Offer */}
      <AlertDialog open={showDeleteOffer} onOpenChange={setShowDeleteOffer}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la oferta "{deleteOfferName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará esta oferta de forma permanente. Los links de pago asociados dejarán de funcionar. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteOffer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar Oferta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Editor */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Editar Producto' : 'Agregar Producto'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nombre del producto</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Descripción</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Tipo de producto</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map(pt => (<SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Tipo de cobro</label>
                <Select value={form.payment_type} onValueChange={v => setForm(f => ({ ...f, payment_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensual</SelectItem>
                    <SelectItem value="one_time">Pago Único</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Image uploads */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Imagen Horizontal (16:9)</label>
              <div className="flex gap-2 items-center">
                <Input value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} className="bg-secondary border-border flex-1" placeholder="URL o sube un archivo" />
                <input ref={fileRefH} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'horizontal')} />
                <Button variant="outline" size="sm" onClick={() => fileRefH.current?.click()} disabled={uploadingH} className="gap-1 shrink-0">
                  <Upload className="w-4 h-4" /> {uploadingH ? '...' : 'Subir'}
                </Button>
              </div>
              {form.thumbnail_url && <img src={form.thumbnail_url} alt="" className="mt-2 h-20 rounded object-cover" />}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Imagen Vertical (2:3 estilo poster)</label>
              <div className="flex gap-2 items-center">
                <Input value={form.thumbnail_vertical_url} onChange={e => setForm(f => ({ ...f, thumbnail_vertical_url: e.target.value }))} className="bg-secondary border-border flex-1" placeholder="URL o sube un archivo" />
                <input ref={fileRefV} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'vertical')} />
                <Button variant="outline" size="sm" onClick={() => fileRefV.current?.click()} disabled={uploadingV} className="gap-1 shrink-0">
                  <Upload className="w-4 h-4" /> {uploadingV ? '...' : 'Subir'}
                </Button>
              </div>
              {form.thumbnail_vertical_url && <img src={form.thumbnail_vertical_url} alt="" className="mt-2 h-28 rounded object-cover" />}
            </div>

            <Button onClick={saveProduct} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Offer Editor */}
      <Dialog open={showOfferEditor} onOpenChange={setShowOfferEditor}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingOffer ? 'Editar Oferta' : 'Nueva Oferta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Nombre de la oferta</label>
              <Input value={offerForm.name} onChange={e => setOfferForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Precio (USD)</label>
                <Input type="number" value={offerForm.price} onChange={e => setOfferForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Stripe Price ID</label>
                <Input value={offerForm.stripe_price_id} onChange={e => setOfferForm(f => ({ ...f, stripe_price_id: e.target.value }))} className="bg-secondary border-border" placeholder="price_..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Válido desde</label>
                <Input type="datetime-local" value={offerForm.valid_from} onChange={e => setOfferForm(f => ({ ...f, valid_from: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Válido hasta</label>
                <Input type="datetime-local" value={offerForm.valid_until} onChange={e => setOfferForm(f => ({ ...f, valid_until: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={offerForm.is_default} onCheckedChange={v => setOfferForm(f => ({ ...f, is_default: v }))} />
                Oferta padrão
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
