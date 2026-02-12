import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, BookOpen, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import type { ContentProduct } from '@/lib/courseTypes';

interface CourseCardProps {
  product: ContentProduct;
  variant?: 'horizontal' | 'vertical';
}

export const CourseCard: React.FC<CourseCardProps> = ({ product, variant = 'horizontal' }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const thumbnail = variant === 'vertical'
    ? (product.thumbnail_vertical_url || product.thumbnail_url)
    : (product.thumbnail_url || product.thumbnail_vertical_url);

  const aspectClass = variant === 'vertical' ? 'aspect-[2/3]' : 'aspect-video';

  return (
    <motion.div
      className="relative rounded-lg overflow-hidden cursor-pointer group card-shadow bg-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.2 }}
      onClick={() => product.course_id ? navigate(`/app/courses/${product.course_id}`) : null}
    >
      <div className={`relative ${aspectClass} overflow-hidden`}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />

        {isHovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center glow-primary">
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-3">
        {product.category_name && (
          <Badge variant="secondary" className="text-xs mb-1">{product.category_name}</Badge>
        )}
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
        )}

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
        </div>

        {product.progress !== undefined && product.progress > 0 && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{product.progress}% {t('completed')}</span>
            </div>
            <Progress value={product.progress} className="h-1" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
