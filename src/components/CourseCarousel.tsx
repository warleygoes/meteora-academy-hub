import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CourseCard } from './CourseCard';
import type { ContentProduct } from '@/lib/courseTypes';

interface CourseCarouselProps {
  title: string;
  products: ContentProduct[];
  variant?: 'horizontal' | 'vertical';
}

export const CourseCarousel: React.FC<CourseCarouselProps> = ({ title, products, variant = 'horizontal' }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const cardWidth = variant === 'vertical' ? 200 : 280;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -cardWidth * 2 : cardWidth * 2,
        behavior: 'smooth',
      });
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="mb-10 group/carousel">
      <h2 className="text-xl font-display font-semibold mb-4 px-1">{title}</h2>
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-1"
        >
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0" style={{ width: cardWidth }}>
              <CourseCard product={product} variant={variant} />
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6 text-foreground" />
        </button>
      </div>
    </div>
  );
};
