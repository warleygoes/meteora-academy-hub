import React from 'react';
import { motion } from 'framer-motion';
import heroBanner from '@/assets/hero-banner.jpg';
import meteoraLogo from '@/assets/logo-white-pink.png';
import { useLanguage } from '@/contexts/LanguageContext';

export const HeroBanner: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden">
      <img
        src={heroBanner}
        alt="Meteora Academy"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />

      <div className="relative z-10 flex flex-col justify-end h-full pb-20 px-8 md:px-16 max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <img src={meteoraLogo} alt="Meteora Academy" className="h-12 md:h-16 w-auto mb-4" />
          <p className="text-lg md:text-xl text-muted-foreground mb-2 font-display font-medium">
            {t('heroTitle')}
          </p>
          <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-lg leading-relaxed">
            {t('heroSubtitle')}
          </p>

          <div className="flex gap-3">
          </div>
        </motion.div>
      </div>
    </div>
  );
};
