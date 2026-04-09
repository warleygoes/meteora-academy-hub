import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, BookOpen, Globe, UserCheck, UserX, Clock, Star } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

interface AdminAnalyticsProps {
  stats: { total: number; approved: number; pending: number; rejected: number };
}

interface CountryData { country: string; users: number; }
interface RecentUser { display_name: string | null; status: string; country: string | null; created_at: string; }
interface LessonRating { lesson_title: string; course_title: string; avg_rating: number; total_votes: number; }

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ stats }) => {
  const { t } = useLanguage();
  const [topCountries, setTopCountries] = useState<CountryData[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [networkTypes, setNetworkTypes] = useState<{ type: string; count: number }[]>([]);
  const [lessonRatings, setLessonRatings] = useState<LessonRating[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const { data: profiles } = await supabase.from('profiles').select('country, status, display_name, created_at, network_type').order('created_at', { ascending: false });
      if (!profiles) return;

      // Top countries
      const countryMap: Record<string, number> = {};
      profiles.forEach(p => { if (p.country) countryMap[p.country] = (countryMap[p.country] || 0) + 1; });
      setTopCountries(Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([country, users]) => ({ country, users })));

      // Recent users
      setRecentUsers(profiles.slice(0, 7).map(p => ({ display_name: p.display_name, status: p.status, country: p.country, created_at: p.created_at })));

      // Network types
      const ntMap: Record<string, number> = {};
      profiles.forEach(p => { if (p.network_type) ntMap[p.network_type] = (ntMap[p.network_type] || 0) + 1; });
      setNetworkTypes(Object.entries(ntMap).sort((a, b) => b[1] - a[1]).map(([type, count]) => ({ type, count })));
    };

    const fetchRatings = async () => {
      // Get all ratings with lesson and course info
      const { data: ratings } = await supabase
        .from('lesson_ratings')
        .select('rating, lesson_id, course_id');
      if (!ratings || ratings.length === 0) return;

      // Get unique lesson/course ids
      const lessonIds = [...new Set(ratings.map(r => r.lesson_id))];
      const courseIds = [...new Set(ratings.map(r => r.course_id))];

      const [{ data: lessons }, { data: courses }] = await Promise.all([
        supabase.from('course_lessons').select('id, title').in('id', lessonIds),
        supabase.from('courses').select('id, title').in('id', courseIds),
      ]);

      const lessonMap = Object.fromEntries((lessons || []).map(l => [l.id, l.title]));
      const courseMap = Object.fromEntries((courses || []).map(c => [c.id, c.title]));

      // Aggregate per lesson
      const aggMap: Record<string, { sum: number; count: number; course_id: string }> = {};
      ratings.forEach(r => {
        if (!aggMap[r.lesson_id]) aggMap[r.lesson_id] = { sum: 0, count: 0, course_id: r.course_id };
        aggMap[r.lesson_id].sum += r.rating;
        aggMap[r.lesson_id].count += 1;
      });

      const result: LessonRating[] = Object.entries(aggMap)
        .map(([lid, { sum, count, course_id }]) => ({
          lesson_title: lessonMap[lid] || lid,
          course_title: courseMap[course_id] || course_id,
          avg_rating: sum / count,
          total_votes: count,
        }))
        .sort((a, b) => b.avg_rating - a.avg_rating || b.total_votes - a.total_votes)
        .slice(0, 10);

      setLessonRatings(result);
    };

    fetchAnalytics();
    fetchRatings();
  }, [stats]);

  const metrics = [
    { label: t('totalStudents'), value: stats.total, icon: Users, color: 'text-primary' },
    { label: t('approvedUsers'), value: stats.approved, icon: UserCheck, color: 'text-green-500' },
    { label: t('pendingUsers'), value: stats.pending, icon: Clock, color: 'text-yellow-500' },
    { label: t('rejectedUsers'), value: stats.rejected, icon: UserX, color: 'text-red-500' },
    { label: t('countries'), value: topCountries.length, icon: Globe, color: 'text-blue-500' },
  ];

  const formatDate = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Hace unos minutos';
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${Math.floor(hours / 24)}d`;
  };

  const statusLabel = (s: string) => s === 'approved' ? t('approved') : s === 'rejected' ? t('rejected') : t('pending');

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-primary fill-primary' : 'text-muted-foreground/30'}`} />
      ))}
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-display font-bold text-foreground mb-2">{t('analytics')}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t('analyticsDesc')}</p>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-2">
              <m.icon className={`w-5 h-5 ${m.color}`} />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{m.value}</p>
            <p className="text-sm text-muted-foreground">{m.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Countries */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">{t('topCountries')}</h3>
          </div>
          <div className="space-y-3">
            {topCountries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noUsersFound')}</p>
            ) : topCountries.map((c, i) => (
              <div key={c.country} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm font-medium text-foreground">{c.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-primary/20 w-24">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(c.users / topCountries[0].users) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{c.users}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">{t('recentActivity')}</h3>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noUsersFound')}</p>
            ) : recentUsers.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${a.status === 'approved' ? 'bg-green-500' : a.status === 'rejected' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.display_name || 'Sin nombre'}</p>
                  <p className="text-xs text-muted-foreground">{a.country || '—'} · {statusLabel(a.status)}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(a.created_at)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Lesson Ratings */}
        {lessonRatings.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-primary" />
              <h3 className="font-display font-semibold text-foreground">{t('rateThisLesson') || 'Avaliações de Aulas'}</h3>
            </div>
            <div className="space-y-3">
              {lessonRatings.map((lr, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{lr.lesson_title}</p>
                    <p className="text-xs text-muted-foreground truncate">{lr.course_title}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {renderStars(lr.avg_rating)}
                    <span className="text-xs text-muted-foreground">({lr.total_votes})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Network Types */}
        {networkTypes.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">{t('networkType')}</h3>
            <div className="space-y-3">
              {networkTypes.map((nt) => (
                <div key={nt.type} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground capitalize">{nt.type}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-primary/20 w-24">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${(nt.count / networkTypes[0].count) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{nt.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
