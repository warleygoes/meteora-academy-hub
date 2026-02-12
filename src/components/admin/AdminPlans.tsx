import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Edit, Trash2, CheckCircle2, BookOpen, Link as LinkIcon, Users, ExternalLink, Wrench, AlertTriangle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Plan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  active: boolean;
  payment_type: string;
  duration_days: number | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  features: string[];
  subscriber_count?: number;
  linked_courses?: { id: string; title: string }[];
  linked_services?: { id: string; title: string }[];
}

interface Course {
  id: string;
  title: string;
}

interface Service {
  id: string;
  title: string;
  payment_type: string;
}

const AdminPlans: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showCourseLinker, setShowCourseLinker] = useState(false);
  const [showServiceLinker, setShowServiceLinker] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [selectedPlanPaymentType, setSelectedPlanPaymentType] = useState<string>('monthly');
  const [linkedCourseIds, setLinkedCourseIds] = useState<Set<string>>(new Set());
  const [linkedServiceIds, setLinkedServiceIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePlanId, setDeletePlanId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', description: '', price: '', payment_type: 'monthly',
    duration_days: '', stripe_price_id: '', stripe_product_id: '', features: '',
  });

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    const { data: plansData } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (plansData) {
      // Get subscriber counts
      const { data: userPlans } = await supabase
        .from('user_plans')
        .select('plan_id')
        .eq('status', 'active');

      const countMap: Record<string, number> = {};
      userPlans?.forEach(up => {
        countMap[up.plan_id] = (countMap[up.plan_id] || 0) + 1;
      });

      // Get linked courses
      const { data: planCourses } = await supabase
        .from('plan_courses')
        .select('plan_id, course_id, courses(id, title)')
        .order('created_at');

      const courseMap: Record<string, { id: string; title: string }[]> = {};
      planCourses?.forEach((pc: any) => {
        if (!courseMap[pc.plan_id]) courseMap[pc.plan_id] = [];
        if (pc.courses) courseMap[pc.plan_id].push({ id: pc.courses.id, title: pc.courses.title });
      });

      // Get linked services
      const { data: planServices } = await supabase
        .from('plan_services')
        .select('plan_id, service_id, services(id, title)')
        .order('created_at');

      const serviceMap: Record<string, { id: string; title: string }[]> = {};
      planServices?.forEach((ps: any) => {
        if (!serviceMap[ps.plan_id]) serviceMap[ps.plan_id] = [];
        if (ps.services) serviceMap[ps.plan_id].push({ id: ps.services.id, title: ps.services.title });
      });

      const mapped: Plan[] = plansData.map((p: any) => ({
        ...p,
        features: p.features || [],
        subscriber_count: countMap[p.id] || 0,
        linked_courses: courseMap[p.id] || [],
        linked_services: serviceMap[p.id] || [],
      }));
      setPlans(mapped);
    }
    setLoading(false);
  }, []);

  const fetchCourses = useCallback(async () => {
    const { data } = await supabase.from('courses').select('id, title').order('title');
    if (data) setCourses(data);
  }, []);

  const fetchServices = useCallback(async () => {
    const { data } = await supabase.from('services').select('id, title, payment_type').order('title');
    if (data) setServices(data);
  }, []);

  useEffect(() => {
    fetchPlans();
    fetchCourses();
    fetchServices();
  }, [fetchPlans, fetchCourses, fetchServices]);

  const openNew = () => {
    setEditingPlan(null);
    setForm({ name: '', description: '', price: '', payment_type: 'monthly', duration_days: '', stripe_price_id: '', stripe_product_id: '', features: '' });
    setShowEditor(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      description: plan.description || '',
      price: plan.price.toString(),
      payment_type: plan.payment_type,
      duration_days: plan.duration_days?.toString() || '',
      stripe_price_id: plan.stripe_price_id || '',
      stripe_product_id: plan.stripe_product_id || '',
      features: (plan.features || []).join('\n'),
    });
    setShowEditor(true);
  };

  const savePlan = async () => {
    if (!form.name.trim() || !form.price.trim()) return;
    const payload = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      payment_type: form.payment_type,
      duration_days: form.duration_days ? parseInt(form.duration_days) : null,
      stripe_price_id: form.stripe_price_id || null,
      stripe_product_id: form.stripe_product_id || null,
      features: form.features.split('\n').filter(f => f.trim()),
    };

    if (editingPlan) {
      await supabase.from('plans').update(payload).eq('id', editingPlan.id);
      toast({ title: t('planUpdated') || 'Plan actualizado' });
    } else {
      await supabase.from('plans').insert({ ...payload, active: false });
      toast({ title: t('planCreated') || 'Plan creado' });
    }
    setShowEditor(false);
    fetchPlans();
  };

  const confirmDeletePlan = (id: string) => {
    setDeletePlanId(id);
    setShowDeleteConfirm(true);
  };

  const executeDeletePlan = async () => {
    if (!deletePlanId) return;
    await supabase.from('plans').delete().eq('id', deletePlanId);
    toast({ title: t('planDeleted') || 'Plan eliminado' });
    setShowDeleteConfirm(false);
    setDeletePlanId(null);
    fetchPlans();
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from('plans').update({ active: !currentActive }).eq('id', id);
    fetchPlans();
  };

  // Course linking
  const openCourseLinker = async (planId: string) => {
    setSelectedPlanId(planId);
    const { data } = await supabase.from('plan_courses').select('course_id').eq('plan_id', planId);
    setLinkedCourseIds(new Set((data || []).map(d => d.course_id)));
    setShowCourseLinker(true);
  };

  const toggleCourseLink = (courseId: string) => {
    setLinkedCourseIds(prev => {
      const next = new Set(prev);
      next.has(courseId) ? next.delete(courseId) : next.add(courseId);
      return next;
    });
  };

  const saveCourseLinks = async () => {
    if (!selectedPlanId) return;
    // Delete existing
    await supabase.from('plan_courses').delete().eq('plan_id', selectedPlanId);
    // Insert new
    const inserts = Array.from(linkedCourseIds).map(course_id => ({
      plan_id: selectedPlanId,
      course_id,
    }));
    if (inserts.length > 0) {
      await supabase.from('plan_courses').insert(inserts);
    }
    toast({ title: t('courseLinksUpdated') || 'Cursos del plan actualizados' });
    setShowCourseLinker(false);
    fetchPlans();
  };

  // Service linking
  const openServiceLinker = async (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    setSelectedPlanId(planId);
    setSelectedPlanPaymentType(plan?.payment_type || 'monthly');
    const { data } = await supabase.from('plan_services').select('service_id').eq('plan_id', planId);
    setLinkedServiceIds(new Set((data || []).map(d => d.service_id)));
    setShowServiceLinker(true);
  };

  const toggleServiceLink = (serviceId: string) => {
    setLinkedServiceIds(prev => {
      const next = new Set(prev);
      next.has(serviceId) ? next.delete(serviceId) : next.add(serviceId);
      return next;
    });
  };

  const saveServiceLinks = async () => {
    if (!selectedPlanId) return;
    await supabase.from('plan_services').delete().eq('plan_id', selectedPlanId);
    const inserts = Array.from(linkedServiceIds).map(service_id => ({
      plan_id: selectedPlanId,
      service_id,
    }));
    if (inserts.length > 0) {
      await supabase.from('plan_services').insert(inserts);
    }
    toast({ title: t('serviceLinksUpdated') || 'Servicios del plan actualizados' });
    setShowServiceLinker(false);
    fetchPlans();
  };

  // Filter services compatible with plan payment type
  const compatibleServices = services.filter(s => s.payment_type === selectedPlanPaymentType);
  const incompatibleServices = services.filter(s => s.payment_type !== selectedPlanPaymentType);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">{t('managePlans')}</h2>
          <p className="text-sm text-muted-foreground">{t('adminPlansDesc')}</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> {t('addPlan')}
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">{t('loading')}...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map(plan => (
            <div key={plan.id} className={`bg-card rounded-xl border p-6 flex flex-col ${plan.active ? 'border-primary/30' : 'border-border opacity-70'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={plan.active ? 'default' : 'secondary'} className={plan.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                    {plan.active ? t('active') : t('inactive')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {plan.payment_type === 'monthly' ? (t('monthly') || 'Mensual') : (t('oneTime') || 'Único')}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openCourseLinker(plan.id)} title={t('linkCourses') || 'Vincular cursos'}>
                    <BookOpen className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openServiceLinker(plan.id)} title={t('linkServices') || 'Vincular servicios'}>
                    <Wrench className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => confirmDeletePlan(plan.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <h3 className="text-lg font-display font-bold text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>

              <p className="text-3xl font-display font-bold text-foreground mb-1">
                {plan.currency === 'USD' ? 'U$' : plan.currency} {plan.price}
                {plan.payment_type === 'monthly' && (
                  <span className="text-sm font-normal text-muted-foreground">/{t('month')}</span>
                )}
              </p>

              {plan.payment_type === 'one_time' && plan.duration_days && (
                <p className="text-xs text-muted-foreground mb-2">
                  {t('accessDuration') || 'Acceso por'} {plan.duration_days} {t('days') || 'días'}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {plan.subscriber_count} {t('subscribers')}</span>
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {(plan.linked_courses || []).length} {t('courses')}</span>
                <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> {(plan.linked_services || []).length} {t('servicesLabel') || 'Servicios'}</span>
              </div>

              {plan.stripe_price_id && (
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1 truncate">
                  <LinkIcon className="w-3 h-3 shrink-0" /> Stripe: {plan.stripe_price_id}
                </p>
              )}

              {/* Linked courses */}
              {(plan.linked_courses || []).length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t('includedCourses') || 'Cursos incluidos'}:</p>
                  <div className="flex flex-wrap gap-1">
                    {(plan.linked_courses || []).map(c => (
                      <Badge key={c.id} variant="secondary" className="text-xs">{c.title}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Linked services */}
              {(plan.linked_services || []).length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t('includedServices') || 'Servicios incluidos'}:</p>
                  <div className="flex flex-wrap gap-1">
                    {(plan.linked_services || []).map(s => (
                      <Badge key={s.id} variant="secondary" className="text-xs flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> {s.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <ul className="space-y-2 flex-1">
                {(plan.features || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => toggleActive(plan.id, plan.active)}>
                {plan.active ? t('deactivate') : t('activate')}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Delete Plan Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deletePlanConfirm') || '¿Eliminar este plan?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deletePlanDesc') || 'Esta acción es irreversible. Se eliminará el plan y sus vinculaciones con cursos.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('back') || 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeletePlan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('deleteUser') || 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan Editor */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingPlan ? t('editPlan') : t('addPlan')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('planName')}</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('planDescription')}</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('planPrice')} (USD)</label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('paymentType') || 'Tipo de pago'}</label>
                <Select value={form.payment_type} onValueChange={v => setForm(f => ({ ...f, payment_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t('monthly') || 'Mensual'}</SelectItem>
                    <SelectItem value="one_time">{t('oneTime') || 'Pago Único'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.payment_type === 'one_time' && (
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('accessDuration') || 'Duración de acceso'} ({t('days') || 'días'})</label>
                <Input type="number" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} className="bg-secondary border-border" placeholder="365" />
              </div>
            )}

            <div className="border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1">
                <ExternalLink className="w-4 h-4" /> Stripe
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Stripe Price ID</label>
                  <Input value={form.stripe_price_id} onChange={e => setForm(f => ({ ...f, stripe_price_id: e.target.value }))} className="bg-secondary border-border" placeholder="price_..." />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Stripe Product ID</label>
                  <Input value={form.stripe_product_id} onChange={e => setForm(f => ({ ...f, stripe_product_id: e.target.value }))} className="bg-secondary border-border" placeholder="prod_..." />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('planFeatures')}</label>
              <Textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} className="bg-secondary border-border" rows={4} placeholder={t('planFeaturesPlaceholder')} />
            </div>
            <Button onClick={savePlan} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Course Linker */}
      <Dialog open={showCourseLinker} onOpenChange={setShowCourseLinker}>
        <DialogContent className="bg-card border-border max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{t('linkCourses') || 'Vincular Cursos al Plan'}</DialogTitle>
          </DialogHeader>
          {courses.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('noCoursesFound')}</p>
          ) : (
            <div className="space-y-2">
              {courses.map(course => (
                <label key={course.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:bg-secondary">
                  <Checkbox checked={linkedCourseIds.has(course.id)} onCheckedChange={() => toggleCourseLink(course.id)} />
                  <span className="text-sm font-medium text-foreground">{course.title}</span>
                </label>
              ))}
            </div>
          )}
          <Button onClick={saveCourseLinks} className="w-full mt-4">{t('save')}</Button>
        </DialogContent>
      </Dialog>

      {/* Service Linker */}
      <Dialog open={showServiceLinker} onOpenChange={setShowServiceLinker}>
        <DialogContent className="bg-card border-border max-w-md max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{t('linkServices') || 'Vincular Servicios al Plan'}</DialogTitle>
          </DialogHeader>

          {incompatibleServices.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {t('paymentTypeMismatchWarning') || 'Solo se muestran servicios con el mismo tipo de pago del plan. No se pueden mezclar servicios de pago único con mensuales.'}
              </span>
            </div>
          )}

          {compatibleServices.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {t('noCompatibleServices') || 'No hay servicios compatibles con este tipo de pago.'}
            </p>
          ) : (
            <div className="space-y-2">
              {compatibleServices.map(service => (
                <label key={service.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border cursor-pointer hover:bg-secondary">
                  <Checkbox checked={linkedServiceIds.has(service.id)} onCheckedChange={() => toggleServiceLink(service.id)} />
                  <div className="flex items-center gap-2">
                    <Wrench className="w-3.5 h-3.5 text-primary" />
                    <span className="text-sm font-medium text-foreground">{service.title}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
          <Button onClick={saveServiceLinks} className="w-full mt-4">{t('save')}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlans;
