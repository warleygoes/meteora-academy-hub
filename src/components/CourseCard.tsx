import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, BookOpen, Users, Info, ExternalLink, Lock, ShoppingCart } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import type { ContentProduct } from '@/lib/courseTypes';

interface Offer {
  id: string; name: string; price: number; currency: string;
  stripe_price_id: string | null; hotmart_url: string | null;
  payment_link_active: boolean; active: boolean;
  stripe_link_active: boolean; hotmart_link_active: boolean;
}

interface CourseCardProps {
  product: ContentProduct;
  variant?: 'horizontal' | 'vertical';
  hasAccess?: boolean;
  offers?: Offer[];
}

export const CourseCard: React.FC<CourseCardProps> = ({ product, variant = 'horizontal', hasAccess = true, offers }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [showPurchase, setShowPurchase] = useState(false);

  const thumbnail = variant === 'vertical'
    ? (product.thumbnail_vertical_url || product.thumbnail_url)
    : (product.thumbnail_url || product.thumbnail_vertical_url);

  const aspectClass = variant === 'vertical' ? 'aspect-[2/3]' : 'aspect-video';

  const isSaas = product.type === 'saas' && !!product.saas_url;

  const goToCourse = () => {
    if (product.course_id) navigate(`/app/courses/${product.course_id}`);
  };

  const openSaas = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.saas_url) window.open(product.saas_url, '_blank', 'noopener');
  };

  const handleCardClick = () => {
    if (hasAccess) {
      goToCourse();
    } else {
      setShowPurchase(true);
    }
  };

  const activeOffers = (offers || []).filter(o => o.active && (o.stripe_link_active || o.hotmart_link_active));
  const hasStripeOffers = activeOffers.some(o => o.stripe_price_id && o.stripe_link_active);
  const hasHotmartOffers = activeOffers.some(o => o.hotmart_url && o.hotmart_link_active);

  return (
    <>
      <motion.div
        className="relative rounded-lg overflow-hidden cursor-pointer group card-shadow bg-card"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05, zIndex: 10 }}
        transition={{ duration: 0.2 }}
        onClick={handleCardClick}
      >
        <div className={`relative ${aspectClass} overflow-hidden`}>
          {thumbnail ? (
            <img src={thumbnail} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
          ) : (
            <div className="w-full h-full bg-secondary flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />

          {/* Lock overlay for inaccessible products */}
          {!hasAccess && !isHovered && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/40">
              <div className="bg-background/90 backdrop-blur-sm rounded-full p-4 shadow-lg">
                <Lock className="w-10 h-10 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Hover overlay */}
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center p-3 gap-2"
            >
              {product.description && (
                <p className="text-xs text-center text-muted-foreground line-clamp-3 max-w-[90%]">{product.description}</p>
              )}
              <div className="flex flex-col gap-1.5 w-full max-w-[85%]">
                {hasAccess ? (
                  <>
                    {product.course_id && (
                      <Button size="sm" className="gap-1.5 w-full text-xs" onClick={(e) => { e.stopPropagation(); goToCourse(); }}>
                        <Play className="w-3 h-3" /> {t('watchNow')}
                      </Button>
                    )}
                    {isSaas && (
                      <Button size="sm" variant="secondary" className="gap-1.5 w-full text-xs" onClick={openSaas}>
                        <ExternalLink className="w-3 h-3" /> {t('accessApp')}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="gap-1.5 w-full text-xs" onClick={(e) => { e.stopPropagation(); setShowPurchase(true); }}>
                      <Info className="w-3 h-3" /> {t('moreInfo')}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button size="sm" className="gap-1.5 w-full text-xs" onClick={(e) => { e.stopPropagation(); setShowPurchase(true); }}>
                      <ShoppingCart className="w-3 h-3" /> {t('buyAccess')}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1.5 w-full text-xs" onClick={(e) => { e.stopPropagation(); setShowPurchase(true); }}>
                      <Info className="w-3 h-3" /> {t('moreInfo')}
                    </Button>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </div>

        <div className="p-3">
          {product.category_name && (
            <Badge variant="secondary" className="text-xs mb-1">{product.category_name}</Badge>
          )}
          <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">{product.name}</h3>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            {product.lesson_count > 0 && (
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {product.lesson_count} {t('lessons')}
              </span>
            )}
            {product.enrollment_count > 0 && (
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {product.enrollment_count}
              </span>
            )}
            {!hasAccess && (
              <span className="flex items-center gap-1 text-yellow-500">
                <Lock className="w-3 h-3" />
              </span>
            )}
          </div>

          {hasAccess && product.progress !== undefined && product.progress > 0 && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>{product.progress}% {t('completed')}</span>
              </div>
              <Progress value={product.progress} className="h-1" />
            </div>
          )}

          {!hasAccess && activeOffers.length > 0 && (
            <div className="mt-1">
              <span className="text-xs font-semibold text-primary">
                {activeOffers[0].currency === 'USD' ? 'U$' : activeOffers[0].currency} {activeOffers[0].price}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Product Details / Purchase Dialog */}
      <Dialog open={showPurchase} onOpenChange={setShowPurchase}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{product.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {thumbnail && (
              <img src={product.thumbnail_url || thumbnail} alt={product.name} className="w-full h-40 object-cover rounded-lg" />
            )}
            {product.description && (
              <p className="text-sm text-muted-foreground">{product.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {product.lesson_count > 0 && (
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {product.lesson_count} {t('lessons')}</span>
              )}
              {product.enrollment_count > 0 && (
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {product.enrollment_count} {t('students')}</span>
              )}
            </div>

            {/* Show action buttons for accessible products */}
            {hasAccess && (
              <div className="flex flex-col gap-2">
                {product.course_id && (
                  <Button className="gap-1.5 w-full" onClick={() => { setShowPurchase(false); goToCourse(); }}>
                    <Play className="w-4 h-4" /> {t('watchNow')}
                  </Button>
                )}
                {isSaas && (
                  <Button variant="secondary" className="gap-1.5 w-full" onClick={openSaas}>
                    <ExternalLink className="w-4 h-4" /> {t('accessApp')}
                  </Button>
                )}
              </div>
            )}

            {/* Show purchase options for inaccessible products */}
            {!hasAccess && activeOffers.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{t('offers')}:</p>
                {activeOffers.map(offer => (
                  <div key={offer.id} className="flex flex-col gap-2 p-3 rounded-lg border border-border bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{offer.name}</p>
                        <p className="text-lg font-bold text-primary">
                          {offer.currency === 'USD' ? 'U$' : offer.currency} {offer.price}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {offer.stripe_price_id && offer.stripe_link_active && (
                        <Button size="sm" className="gap-1.5 flex-1" onClick={() => window.open(offer.stripe_price_id!, '_blank', 'noopener')}>
                          <ShoppingCart className="w-3.5 h-3.5" /> {t('buyViaStripe') || 'Stripe'}
                        </Button>
                      )}
                      {offer.hotmart_url && offer.hotmart_link_active && (
                        <Button size="sm" variant="outline" className="gap-1.5 flex-1" onClick={() => window.open(offer.hotmart_url!, '_blank', 'noopener')}>
                          <ShoppingCart className="w-3.5 h-3.5" /> {t('buyViaHotmart') || 'Hotmart'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasAccess ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noOffers')}</p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
