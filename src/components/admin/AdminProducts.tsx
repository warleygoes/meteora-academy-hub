import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Package, Plus, Edit, Trash2, Tag, ChevronDown, ChevronRight, Calendar, DollarSign, Upload, Image as ImageIcon, BookOpen, Sparkles, X, Loader2, FileText } from 'lucide-react';
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
import { format } from 'date-fns';
import { logSystemEvent } from '@/lib/systemLog';
import SalesPageEditor from './SalesPageEditor';

interface Offer {
  id: string; name: string; price: number; currency: string;
  stripe_price_id: string | null; is_default: boolean; active: boolean;
  valid_from: string | null; valid_until: string | null;
  periodicity: string | null; hotmart_url: string | null;
  payment_link_active: boolean; duration_type: string; duration_days: number | null;
  stripe_link_active: boolean; hotmart_link_active: boolean;
}

interface Product {
  id: string; type: string; name: string; description: string | null;
  payment_type: string; active: boolean; course_id: string | null;
  thumbnail_url: string | null; thumbnail_vertical_url: string | null;
  sort_order: number; offers: Offer[]; has_content: boolean;
  trial_enabled: boolean; trial_days: number | null;
  recurring_type: string | null; features_list: string[];
  saas_url: string | null;
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
  const [salesPageProduct, setSalesPageProduct] = useState<{ id: string; name: string } | null>(null);
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

  const PRODUCT_TYPES = [
    { value: 'course', label: t('typeCourse') },
    { value: 'service', label: t('typeService') },
    { value: 'consultation', label: t('typeConsultation') },
    { value: 'implementation', label: t('typeImplementation') },
    { value: 'virtual_event', label: t('typeVirtualEvent') },
    { value: 'in_person_event', label: t('typeInPersonEvent') },
    { value: 'saas', label: 'SaaS' },
  ];

  const [form, setForm] = useState({
    name: '', description: '', type: 'service' as string, payment_type: 'one_time',
    thumbnail_url: '', thumbnail_vertical_url: '', has_content: false, saas_url: '',
    trial_enabled: false, trial_days: '', recurring_type: '', features_list: [] as string[],
  });
  const [newFeature, setNewFeature] = useState('');
  const [generatingAI, setGeneratingAI] = useState<Record<string, boolean>>({});

  const [offerForm, setOfferForm] = useState({
    name: t('defaultOffer'), price: '', currency: 'USD', stripe_price_id: '',
    is_default: false, active: true, valid_from: '', valid_until: '', periodicity: '',
    hotmart_url: '', payment_link_active: true, duration_type: 'no_expiration', duration_days: '',
    stripe_link_active: false, hotmart_link_active: false,
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
      toast({ title: t('imageUploadError'), description: error.message, variant: 'destructive' });
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
    toast({ title: t('imageUploaded') });
  };

  const generateWithAI = async (section: string) => {
    if (!form.name.trim()) {
      toast({ title: 'Ingresa el nombre del producto primero', variant: 'destructive' });
      return;
    }
    setGeneratingAI(prev => ({ ...prev, [section]: true }));
    try {
      const { data, error } = await supabase.functions.invoke('generate-product-content', {
        body: { section, productName: form.name, productDescription: form.description, productType: form.type },
      });
      if (error) throw error;
      if (data?.error) { toast({ title: data.error, variant: 'destructive' }); return; }

      const content = data?.content || '';
      if (section === 'description') {
        setForm(f => ({ ...f, description: content }));
      } else if (section === 'features') {
        try {
          const features = JSON.parse(content);
          if (Array.isArray(features)) setForm(f => ({ ...f, features_list: features }));
        } catch { toast({ title: 'Error al parsear features', variant: 'destructive' }); }
      } else if (section === 'trial_days') {
        try {
          const parsed = JSON.parse(content);
          setForm(f => ({
            ...f,
            trial_days: parsed.trial_days?.toString() || '',
            recurring_type: parsed.recurring_type || '',
            trial_enabled: true,
          }));
        } catch { toast({ title: 'Error al parsear sugerencia', variant: 'destructive' }); }
      }
      toast({ title: 'Contenido generado con IA ✨' });
    } catch (e: any) {
      toast({ title: 'Error al generar', description: e.message, variant: 'destructive' });
    } finally {
      setGeneratingAI(prev => ({ ...prev, [section]: false }));
    }
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', type: 'service', payment_type: 'one_time', thumbnail_url: '', thumbnail_vertical_url: '', has_content: false, saas_url: '', trial_enabled: false, trial_days: '', recurring_type: '', features_list: [] });
    setNewFeature('');
    setShowEditor(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || '', type: p.type,
      payment_type: p.payment_type,
      thumbnail_url: p.thumbnail_url || '', thumbnail_vertical_url: p.thumbnail_vertical_url || '',
      has_content: p.has_content, saas_url: p.saas_url || '',
      trial_enabled: p.trial_enabled || false,
      trial_days: p.trial_days?.toString() || '',
      recurring_type: p.recurring_type || '',
      features_list: Array.isArray(p.features_list) ? p.features_list : [],
    });
    setNewFeature('');
    setShowEditor(true);
  };

  const saveProduct = async () => {
    if (!form.name.trim()) return;
    const payload: any = {
      name: form.name, description: form.description || null, type: form.type,
      payment_type: form.payment_type, thumbnail_url: form.thumbnail_url || null,
      thumbnail_vertical_url: form.thumbnail_vertical_url || null,
      has_content: form.has_content, saas_url: form.saas_url || null,
      trial_enabled: form.trial_enabled,
      trial_days: form.trial_days ? parseInt(form.trial_days) : null,
      recurring_type: form.recurring_type || null,
      features_list: form.features_list,
    };

    if (editing) {
      await supabase.from('products').update(payload).eq('id', editing.id);
      // Sync course record if has_content
      if (form.has_content && editing.course_id) {
        await supabase.from('courses').update({
          title: form.name, description: form.description || null,
          thumbnail_url: form.thumbnail_url || null, thumbnail_vertical_url: form.thumbnail_vertical_url || null,
        }).eq('id', editing.course_id);
      }
      // Create course record if toggling has_content on
      if (form.has_content && !editing.course_id) {
        const { data: newCourse } = await supabase.from('courses').insert({
          title: form.name, description: form.description || null,
          thumbnail_url: form.thumbnail_url || null, thumbnail_vertical_url: form.thumbnail_vertical_url || null,
        }).select().single();
        if (newCourse) {
          await supabase.from('products').update({ course_id: newCourse.id }).eq('id', editing.id);
        }
      }
      logSystemEvent({ action: 'Producto actualizado', entity_type: 'product', entity_id: editing.id, details: form.name, level: 'info' });
      toast({ title: t('productUpdated') });
    } else {
      let courseId: string | null = null;
      if (form.has_content) {
        const { data: newCourse } = await supabase.from('courses').insert({
          title: form.name, description: form.description || null,
          thumbnail_url: form.thumbnail_url || null, thumbnail_vertical_url: form.thumbnail_vertical_url || null,
        }).select().single();
        courseId = newCourse?.id || null;
      }
      const { data: newProduct } = await supabase.from('products').insert({ ...payload, active: true, course_id: courseId }).select().single();
      if (newProduct) {
        await supabase.from('offers').insert({ product_id: newProduct.id, name: t('defaultOffer'), price: 0, currency: 'USD', is_default: true, active: true });
      }
      logSystemEvent({ action: 'Producto creado', entity_type: 'product', entity_id: newProduct?.id, details: form.name, level: 'success' });
      toast({ title: t('productCreated') });
    }
    setShowEditor(false);
    fetchProducts();
  };

  const confirmDelete = (id: string) => { setDeleteId(id); setShowDelete(true); };
  const executeDelete = async () => {
    if (!deleteId) return;
    const product = products.find(p => p.id === deleteId);
    
    // Cascade delete: course content → course → offers → user_products → product
    if (product?.course_id) {
      // Get modules for this course
      const { data: modules } = await supabase.from('course_modules').select('id').eq('course_id', product.course_id);
      const moduleIds = (modules || []).map(m => m.id);
      
      if (moduleIds.length > 0) {
        // Get lessons for these modules
        const { data: lessons } = await supabase.from('course_lessons').select('id').in('module_id', moduleIds);
        const lessonIds = (lessons || []).map(l => l.id);
        
        // Delete lesson contents
        if (lessonIds.length > 0) {
          await supabase.from('lesson_contents').delete().in('lesson_id', lessonIds);
          await supabase.from('lesson_progress').delete().eq('course_id', product.course_id);
        }
        // Delete lessons
        await supabase.from('course_lessons').delete().in('module_id', moduleIds);
      }
      // Delete modules
      await supabase.from('course_modules').delete().eq('course_id', product.course_id);
      // Delete enrollments
      await supabase.from('course_enrollments').delete().eq('course_id', product.course_id);
    }
    
    // Delete offers linked to this product
    await supabase.from('offers').delete().eq('product_id', deleteId);
    // Delete user_products assignments
    await supabase.from('user_products').delete().eq('product_id', deleteId);
    // Delete the product itself
    await supabase.from('products').delete().eq('id', deleteId);
    // Delete the course record last
    if (product?.course_id) {
      await supabase.from('courses').delete().eq('id', product.course_id);
    }
    
    logSystemEvent({ action: 'Producto eliminado', entity_type: 'product', entity_id: deleteId, details: product?.name, level: 'warning' });
    toast({ title: t('productDeleted') });
    setShowDelete(false); setDeleteId(null); fetchProducts();
  };

  const toggleActive = async (p: Product) => {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id);
    fetchProducts();
  };

  // Offers
  const openNewOffer = (productId: string) => {
    setOfferProductId(productId); setEditingOffer(null);
    setOfferForm({ name: '', price: '', currency: 'USD', stripe_price_id: '', is_default: false, active: true, valid_from: '', valid_until: '', periodicity: '', hotmart_url: '', payment_link_active: true, duration_type: 'no_expiration', duration_days: '', stripe_link_active: false, hotmart_link_active: false });
    setShowOfferEditor(true);
  };

  const openEditOffer = (offer: Offer, productId: string) => {
    setOfferProductId(productId); setEditingOffer(offer);
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
      toast({ title: t('editOffer') });
    } else {
      await supabase.from('offers').insert({ ...payload, product_id: offerProductId });
      toast({ title: t('newOffer') });
    }
    setShowOfferEditor(false); fetchProducts();
  };

  const confirmDeleteOffer = (id: string) => { setDeleteOfferId(id); setShowDeleteOffer(true); };
  const executeDeleteOffer = async () => {
    if (!deleteOfferId) return;
    await supabase.from('offers').delete().eq('id', deleteOfferId);
    toast({ title: t('delete') });
    setShowDeleteOffer(false); setDeleteOfferId(null); fetchProducts();
  };

  const getTypeLabel = (type: string) => PRODUCT_TYPES.find(t => t.value === type)?.label || type;
  const deleteProductName = deleteId ? products.find(p => p.id === deleteId)?.name : '';
  const deleteOfferName = deleteOfferId ? products.flatMap(p => p.offers).find(o => o.id === deleteOfferId)?.name : '';

  if (salesPageProduct) {
    return <SalesPageEditor productId={salesPageProduct.id} productName={salesPageProduct.name} onClose={() => setSalesPageProduct(null)} />;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">{t('manageProducts')}</h2>
          <p className="text-sm text-muted-foreground">{t('adminProductsDesc')}</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> {t('addProduct')}</Button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">{t('loading')}...</p>
      ) : products.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">{t('noProductsFound')}</p>
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
                          {p.payment_type === 'recurring' ? (t('recurring') || 'Recorrente') : t('oneTime')}
                        </Badge>
                        {p.has_content && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <BookOpen className="w-3 h-3" /> {t('hasContent')}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">{p.offers.length} {t('offers').toLowerCase()}</span>
                      </div>
                    </div>
                  </div>

                  {defaultOffer && (
                    <span className="text-lg font-bold text-foreground hidden sm:block">
                      {defaultOffer.currency === 'USD' ? 'U$' : defaultOffer.currency} {defaultOffer.price}
                    </span>
                  )}

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSalesPageProduct({ id: p.id, name: p.name })} title="Página de Ventas"><FileText className="w-4 h-4" /></Button>
                    <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => confirmDelete(p.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-border bg-secondary/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-1"><Tag className="w-4 h-4" /> {t('offers')}</h4>
                      <Button variant="outline" size="sm" onClick={() => openNewOffer(p.id)} className="gap-1"><Plus className="w-3 h-3" /> {t('newOffer')}</Button>
                    </div>
                    {p.offers.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">{t('noOffers')}</p>
                    ) : (
                      <div className="space-y-2">
                        {p.offers.map(offer => (
                          <div key={offer.id} className={`flex items-center gap-3 p-3 rounded-lg border ${offer.is_default ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'}`}>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{offer.name}</span>
                                {offer.is_default && <Badge className="text-xs bg-primary/10 text-primary border-primary/20">{t('defaultOffer')}</Badge>}
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
            <AlertDialogTitle>{t('deleteProductConfirm')} "{deleteProductName}"?</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteProductDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" /> {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Offer */}
      <AlertDialog open={showDeleteOffer} onOpenChange={setShowDeleteOffer}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteOfferConfirm')} "{deleteOfferName}"?</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteOfferDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteOffer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" /> {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Product Editor */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? t('editProduct') : t('addProduct')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('productName')}</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm text-muted-foreground">{t('productDescription')}</label>
                <Button variant="ghost" size="sm" onClick={() => generateWithAI('description')} disabled={generatingAI.description} className="gap-1 text-xs h-7 text-primary">
                  {generatingAI.description ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Generar con IA
                </Button>
              </div>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" rows={4} placeholder="Descripción detallada del producto..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('productType')}</label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRODUCT_TYPES.map(pt => (<SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('chargeType')}</label>
                <Select value={form.payment_type} onValueChange={v => setForm(f => ({ ...f, payment_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recurring">{t('recurring') || 'Recorrente'}</SelectItem>
                    <SelectItem value="one_time">{t('oneTime')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SaaS URL */}
            {form.type === 'saas' && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">URL do SaaS</label>
                <Input value={form.saas_url} onChange={e => setForm(f => ({ ...f, saas_url: e.target.value }))} className="bg-secondary border-border" placeholder="https://app.example.com" />
                <p className="text-xs text-muted-foreground mt-1">URL que o aluno acessará quando tiver assinatura ativa.</p>
              </div>
            )}

            {/* SaaS Advanced Fields */}
            {form.type === 'saas' && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Variables Avanzadas SaaS
                </h4>

                {/* Trial */}
                <div className="flex items-center gap-3">
                  <Switch checked={form.trial_enabled} onCheckedChange={v => setForm(f => ({ ...f, trial_enabled: v }))} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Trial gratuito</p>
                    <p className="text-xs text-muted-foreground">Permitir periodo de prueba antes de cobrar</p>
                  </div>
                </div>

                {form.trial_enabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Días de trial</label>
                      <Input type="number" value={form.trial_days} onChange={e => setForm(f => ({ ...f, trial_days: e.target.value }))} className="bg-secondary border-border" placeholder="7" />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground mb-1 block">Tipo de recurrencia</label>
                      <Select value={form.recurring_type || ''} onValueChange={v => setForm(f => ({ ...f, recurring_type: v }))}>
                        <SelectTrigger className="bg-secondary border-border"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Mensual</SelectItem>
                          <SelectItem value="quarterly">Trimestral</SelectItem>
                          <SelectItem value="semi_annual">Semestral</SelectItem>
                          <SelectItem value="annual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => generateWithAI('trial_days')} disabled={generatingAI.trial_days} className="gap-1 text-xs h-7 text-primary">
                    {generatingAI.trial_days ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Sugerir trial y recurrencia con IA
                  </Button>
                </div>

                {/* Features list */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">Lista de funcionalidades</label>
                    <Button variant="ghost" size="sm" onClick={() => generateWithAI('features')} disabled={generatingAI.features} className="gap-1 text-xs h-7 text-primary">
                      {generatingAI.features ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Generar con IA
                    </Button>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newFeature}
                      onChange={e => setNewFeature(e.target.value)}
                      className="bg-secondary border-border flex-1"
                      placeholder="Nueva funcionalidad..."
                      onKeyDown={e => {
                        if (e.key === 'Enter' && newFeature.trim()) {
                          e.preventDefault();
                          setForm(f => ({ ...f, features_list: [...f.features_list, newFeature.trim()] }));
                          setNewFeature('');
                        }
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => { if (newFeature.trim()) { setForm(f => ({ ...f, features_list: [...f.features_list, newFeature.trim()] })); setNewFeature(''); } }}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {form.features_list.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.features_list.map((feat, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1 text-xs">
                          {feat}
                          <button onClick={() => setForm(f => ({ ...f, features_list: f.features_list.filter((_, i) => i !== idx) }))} className="ml-1 hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/50">
              <Switch checked={form.has_content} onCheckedChange={v => setForm(f => ({ ...f, has_content: v }))} />
              <div>
                <p className="text-sm font-medium text-foreground">{t('hasContent')}</p>
                <p className="text-xs text-muted-foreground">{t('hasContentDesc')}</p>
              </div>
            </div>

            {/* Image uploads */}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('horizontalImage')}</label>
              <div className="flex gap-2 items-center">
                <Input value={form.thumbnail_url} onChange={e => setForm(f => ({ ...f, thumbnail_url: e.target.value }))} className="bg-secondary border-border flex-1" placeholder={t('imageUrlPlaceholder')} />
                <input ref={fileRefH} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'horizontal')} />
                <Button variant="outline" size="sm" onClick={() => fileRefH.current?.click()} disabled={uploadingH} className="gap-1 shrink-0">
                  <Upload className="w-4 h-4" /> {uploadingH ? '...' : t('uploadImage')}
                </Button>
              </div>
              {form.thumbnail_url && <img src={form.thumbnail_url} alt="" className="mt-2 h-20 rounded object-cover" />}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('verticalImage')}</label>
              <div className="flex gap-2 items-center">
                <Input value={form.thumbnail_vertical_url} onChange={e => setForm(f => ({ ...f, thumbnail_vertical_url: e.target.value }))} className="bg-secondary border-border flex-1" placeholder={t('imageUrlPlaceholder')} />
                <input ref={fileRefV} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0], 'vertical')} />
                <Button variant="outline" size="sm" onClick={() => fileRefV.current?.click()} disabled={uploadingV} className="gap-1 shrink-0">
                  <Upload className="w-4 h-4" /> {uploadingV ? '...' : t('uploadImage')}
                </Button>
              </div>
              {form.thumbnail_vertical_url && <img src={form.thumbnail_vertical_url} alt="" className="mt-2 h-28 rounded object-cover" />}
            </div>

            <Button onClick={saveProduct} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showOfferEditor} onOpenChange={setShowOfferEditor}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingOffer ? t('editOffer') : t('newOffer')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('offerName')}</label>
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

            {/* Periodicity - only for recurring products */}
            {(() => {
              const product = products.find(p => p.id === offerProductId);
              const isRecurring = product?.payment_type === 'recurring';
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
                <label className="text-sm text-muted-foreground mb-1 block">{t('validFrom')}</label>
                <Input type="datetime-local" value={offerForm.valid_from} onChange={e => setOfferForm(f => ({ ...f, valid_from: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('validUntil')}</label>
                <Input type="datetime-local" value={offerForm.valid_until} onChange={e => setOfferForm(f => ({ ...f, valid_until: e.target.value }))} className="bg-secondary border-border" />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={offerForm.is_default} onCheckedChange={v => setOfferForm(f => ({ ...f, is_default: v }))} />
                {t('defaultOffer')}
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
