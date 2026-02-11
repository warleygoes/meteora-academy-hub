import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Star, Clock, Users } from 'lucide-react';
import { Course } from '@/lib/mockData';
import { useLanguage } from '@/contexts/LanguageContext';
import { Progress } from '@/components/ui/progress';

interface CourseCardProps {
  course: Course;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="relative rounded-lg overflow-hidden cursor-pointer group card-shadow bg-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05, zIndex: 10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={course.thumbnail}
          alt={course.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80" />
        
        {course.isNew && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-semibold rounded bg-primary text-primary-foreground">
            NOVO
          </span>
        )}
        {course.isTrending && (
          <span className="absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold rounded bg-destructive text-destructive-foreground">
            🔥 {t('trending')}
          </span>
        )}

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
        <h3 className="font-semibold text-sm text-foreground line-clamp-2 mb-1">{course.title}</h3>
        <p className="text-xs text-muted-foreground mb-2">{course.instructor}</p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3 text-primary fill-primary" />
            {course.rating}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.hours}h
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            {course.students}
          </span>
        </div>

        {course.progress !== undefined && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{course.progress}% {t('completed')}</span>
            </div>
            <Progress value={course.progress} className="h-1" />
          </div>
        )}
      </div>
    </motion.div>
  );
};
