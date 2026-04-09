import React, { useState, useEffect, useCallback } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

interface LessonRatingProps {
  lessonId: string;
  courseId: string;
}

const LessonRating: React.FC<LessonRatingProps> = ({ lessonId, courseId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [totalRatings, setTotalRatings] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const fetchRatings = useCallback(async () => {
    const { data: allRatings } = await supabase
      .from('lesson_ratings')
      .select('rating, user_id')
      .eq('lesson_id', lessonId);

    if (allRatings && allRatings.length > 0) {
      const sum = allRatings.reduce((acc, r) => acc + r.rating, 0);
      setAvgRating(sum / allRatings.length);
      setTotalRatings(allRatings.length);
      if (user) {
        const mine = allRatings.find(r => r.user_id === user.id);
        if (mine) setUserRating(mine.rating);
      }
    }
  }, [lessonId, user]);

  useEffect(() => { fetchRatings(); }, [fetchRatings]);

  const submitRating = async (rating: number) => {
    if (!user || submitting) return;
    setSubmitting(true);
    setUserRating(rating);

    const { error } = await supabase
      .from('lesson_ratings')
      .upsert(
        { user_id: user.id, lesson_id: lessonId, course_id: courseId, rating, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,lesson_id' }
      );

    if (!error) {
      toast({ title: t('ratingSubmitted') });
      fetchRatings();
    }
    setSubmitting(false);
  };

  const displayRating = hoverRating || userRating;

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => submitRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            disabled={submitting}
            className="transition-transform hover:scale-125 focus:outline-none disabled:opacity-50"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                star <= displayRating
                  ? 'text-yellow-400 fill-yellow-400'
                  : 'text-muted-foreground/30'
              }`}
            />
          </button>
        ))}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">
          {t('rateThisLesson')}
        </span>
        {totalRatings > 0 && (
          <span className="text-xs text-muted-foreground">
            {avgRating.toFixed(1)} ⭐ ({totalRatings} {totalRatings === 1 ? t('ratingVote') : t('ratingVotes')})
          </span>
        )}
      </div>
    </div>
  );
};

export default LessonRating;
