import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Trash2, ShoppingBag, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserPlan {
  id: string;
  package_id: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  package_name?: string;
}

interface AvailablePackage {
  id: string;
  name: string;
  description: string | null;
  duration_days?: number | null;
}

interface AvailableProduct {
  id: string;
  name: string;
  type: string;
  has_content: boolean;
}

interface UserProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  source: string;
  is_direct: boolean;
}

interface Props {
  userId: string;
  onUpdate?: () => void;
}

const UserPackagesManager: React.FC<Props> = ({ userId, onUpdate }) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [availablePackages, setAvailablePackages] = useState<AvailablePackage[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [addingPackage, setAddingPackage] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [addingProduct, setAddingProduct] = useState(false);

  // Date type for package assignment
  const [dateType, setDateType] = useState<'from_purchase' | 'until_date'>('from_purchase');
  const [customExpirationDate, setCustomExpirationDate] = useState('');

  const [removeItem, setRemoveItem] = useState<{ type: 'plan' | 'product'; id: string; name: string } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [{ data: plans }, { data: packages }, { data: products }, { data: directProducts }] = await Promise.all([
      supabase.from('user_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('packages').select('id, name, description, duration_days'),
      supabase.from('products').select('id, name, type, has_content').eq('active', true),
      supabase.from('user_products').select('*').eq('user_id', userId),
    ]);

    const enrichedPlans: UserPlan[] = (plans || []).map(p => ({
      ...p,
      package_name: (packages || []).find(pkg => pkg.id === p.package_id)?.name || 'Pacote desconhecido',
    }));
    setUserPlans(enrichedPlans);
    setAvailablePackages(packages || []);
    setAvailableProducts(products || []);

    const packageIds = (plans || []).map(p => p.package_id);
    let pkgProductList: UserProduct[] = [];
    if (packageIds.length > 0) {
      const { data: pkgProducts } = await supabase
        .from('package_products')
        .select('id, package_id, product_id')
        .in('package_id', packageIds);

      pkgProductList = (pkgProducts || []).map(pp => {
        const prod = (products || []).find(p => p.id === pp.product_id);
        const pkg = (packages || []).find(p => p.id === pp.package_id);
        return {
          id: pp.id,
          product_id: pp.product_id,
          product_name: prod?.name || '—',
          product_type: prod?.type || '—',
          source: pkg?.name || '—',
          is_direct: false,
        };
      });
    }

    const directList: UserProduct[] = (directProducts || []).map(dp => {
      const prod = (products || []).find(p => p.id === dp.product_id);
      return {
        id: dp.id,
        product_id: dp.product_id,
        product_name: prod?.name || '—',
        product_type: prod?.type || '—',
        source: t('directAssignment') || 'Directo',
        is_direct: true,
      };
    });

    setUserProducts([...pkgProductList, ...directList]);
    setLoading(false);
  }, [userId, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Get selected package's duration_days
  const selectedPackage = availablePackages.find(p => p.id === selectedPackageId);
  const packageDurationDays = selectedPackage?.duration_days;

  const addPackage = async () => {
    if (!selectedPackageId) return;
    setAddingPackage(true);
    
    const now = new Date();
    let expiresAt: string | null = null;

    if (dateType === 'from_purchase' && packageDurationDays) {
      const expDate = new Date(now);
      expDate.setDate(expDate.getDate() + packageDurationDays);
      expiresAt = expDate.toISOString();
    } else if (dateType === 'until_date' && customExpirationDate) {
      expiresAt = new Date(customExpirationDate).toISOString();
    }

    const { error } = await supabase.from('user_plans').insert({
      user_id: userId,
      package_id: selectedPackageId,
      status: 'active',
      starts_at: now.toISOString(),
      expires_at: expiresAt,
    });
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('packageAdded') || 'Pacote adicionado com sucesso!' });
      setSelectedPackageId('');
      setDateType('from_purchase');
      setCustomExpirationDate('');
      fetchData();
      onUpdate?.();
    }
    setAddingPackage(false);
  };

  const addProduct = async () => {
    if (!selectedProductId) return;
    setAddingProduct(true);
    const { error } = await supabase.from('user_products').insert({
      user_id: userId,
      product_id: selectedProductId,
    });
    if (error) {
      if (error.code === '23505') {
        toast({ title: t('productAlreadyAssigned') || 'Este produto já está atribuído.', variant: 'destructive' });
      } else {
        toast({ title: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: t('productAdded') || 'Produto adicionado com sucesso!' });
      setSelectedProductId('');
      fetchData();
      onUpdate?.();
    }
    setAddingProduct(false);
  };

  const executeRemove = async () => {
    if (!removeItem) return;
    const table = removeItem.type === 'plan' ? 'user_plans' : 'user_products';
    const { error } = await supabase.from(table).delete().eq('id', removeItem.id);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: removeItem.type === 'plan' ? (t('packageRemoved') || 'Pacote removido.') : (t('productRemoved') || 'Produto removido.') });
      fetchData();
      onUpdate?.();
    }
    setRemoveItem(null);
  };

  const productTypeLabels: Record<string, string> = {
    course: t('typeCourse') || 'Curso',
    service: t('typeService') || 'Serviço',
    consultation: t('typeConsultation') || 'Consultoria',
    implementation: t('typeImplementation') || 'Implementação',
    virtual_event: t('typeVirtualEvent') || 'Evento Virtual',
    in_person_event: t('typeInPersonEvent') || 'Evento Presencial',
  };

  const directProductIds = new Set(userProducts.filter(p => p.is_direct).map(p => p.product_id));
  const assignableProducts = availableProducts.filter(p => p.has_content && !directProductIds.has(p.id));

  if (loading) return <p className="text-sm text-muted-foreground py-2">{t('loading')}...</p>;

  return (
    <div className="space-y-4">
      {/* Packages Section */}
      <div>
        <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
          <Package className="w-4 h-4 text-primary" /> {t('packages') || 'Pacotes'}
        </p>

        {userPlans.length === 0 ? (
          <p className="text-xs text-muted-foreground mb-2">{t('noPackagesAssigned') || 'Nenhum pacote atribuído.'}</p>
        ) : (
          <div className="space-y-1.5 mb-2">
            {userPlans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50 border border-border">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{plan.package_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={plan.status === 'active' ? 'default' : 'secondary'} className="text-xs h-5">
                      {plan.status === 'active' ? (t('active') || 'Ativo') : plan.status}
                    </Badge>
                    <span>{new Date(plan.starts_at).toLocaleDateString()}</span>
                    {plan.expires_at && <span>→ {new Date(plan.expires_at).toLocaleDateString()}</span>}
                    {!plan.expires_at && <span className="text-primary">∞</span>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => setRemoveItem({ type: 'plan', id: plan.id, name: plan.package_name || '' })}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Package */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
              <SelectTrigger className="flex-1 bg-secondary border-border text-sm h-9">
                <SelectValue placeholder={t('selectPackage') || 'Selecionar pacote...'} />
              </SelectTrigger>
              <SelectContent>
                {availablePackages.map(pkg => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name} {pkg.duration_days ? `(${pkg.duration_days}d)` : '(∞)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-1 h-9" onClick={addPackage} disabled={!selectedPackageId || addingPackage}>
              <Plus className="w-4 h-4" /> {t('add') || 'Adicionar'}
            </Button>
          </div>

          {/* Date type selection - only shown when package is selected */}
          {selectedPackageId && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2">
              <p className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Tipo de acceso
              </p>
              <RadioGroup value={dateType} onValueChange={(v) => setDateType(v as 'from_purchase' | 'until_date')} className="gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="from_purchase" id="from_purchase" />
                  <Label htmlFor="from_purchase" className="text-xs cursor-pointer">
                    A partir de la fecha de compra
                    {packageDurationDays ? (
                      <span className="text-muted-foreground ml-1">({packageDurationDays} días → expira {new Date(Date.now() + packageDurationDays * 86400000).toLocaleDateString()})</span>
                    ) : (
                      <span className="text-muted-foreground ml-1">(sin expiración definida en el paquete)</span>
                    )}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="until_date" id="until_date" />
                  <Label htmlFor="until_date" className="text-xs cursor-pointer">
                    Hasta una fecha de expiración específica
                  </Label>
                </div>
              </RadioGroup>
              {dateType === 'until_date' && (
                <Input
                  type="date"
                  value={customExpirationDate}
                  onChange={e => setCustomExpirationDate(e.target.value)}
                  className="bg-background border-border text-sm h-8 w-48"
                  min={new Date().toISOString().split('T')[0]}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Direct Products Section */}
      <div>
        <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
          <ShoppingBag className="w-4 h-4 text-primary" /> {t('directProducts') || 'Produtos (directo)'}
        </p>

        {userProducts.filter(p => p.is_direct).length > 0 && (
          <div className="space-y-1.5 mb-2">
            {userProducts.filter(p => p.is_direct).map(prod => (
              <div key={prod.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Badge variant="outline" className="text-xs h-5 shrink-0">{productTypeLabels[prod.product_type] || prod.product_type}</Badge>
                  <span className="text-sm text-foreground truncate">{prod.product_name}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => setRemoveItem({ type: 'product', id: prod.id, name: prod.product_name })}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
            <SelectTrigger className="flex-1 bg-secondary border-border text-sm h-9">
              <SelectValue placeholder={t('selectProduct') || 'Selecionar produto...'} />
            </SelectTrigger>
            <SelectContent>
              {assignableProducts.map(prod => (
                <SelectItem key={prod.id} value={prod.id}>
                  {prod.name} ({productTypeLabels[prod.type] || prod.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1 h-9" onClick={addProduct} disabled={!selectedProductId || addingProduct}>
            <Plus className="w-4 h-4" /> {t('add') || 'Adicionar'}
          </Button>
        </div>
      </div>

      {/* Products via packages (read-only) */}
      {userProducts.filter(p => !p.is_direct).length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
            <Package className="w-4 h-4 text-muted-foreground" /> {t('productsViaPackages') || 'Produtos (via pacotes)'}
          </p>
          <div className="space-y-1">
            {userProducts.filter(p => !p.is_direct).map(prod => (
              <div key={prod.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-secondary/30">
                <Badge variant="outline" className="text-xs h-5">{productTypeLabels[prod.product_type] || prod.product_type}</Badge>
                <span className="text-foreground truncate">{prod.product_name}</span>
                <span className="text-muted-foreground ml-auto shrink-0">← {prod.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remove Confirmation */}
      <AlertDialog open={!!removeItem} onOpenChange={() => setRemoveItem(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {removeItem?.type === 'plan'
                ? (t('removePackageConfirm') || `Remover pacote "${removeItem?.name}"?`)
                : (t('removeProductConfirm') || `Remover produto "${removeItem?.name}"?`)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {removeItem?.type === 'plan'
                ? (t('removePackageDesc') || 'O usuário perderá acesso aos produtos incluídos neste pacote.')
                : (t('removeProductDesc') || 'O usuário perderá acesso a este produto.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel') || 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction onClick={executeRemove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" /> {t('remove') || 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserPackagesManager;
