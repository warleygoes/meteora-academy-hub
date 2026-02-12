import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, ExternalLink, Video, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es, ptBR, enUS } from 'date-fns/locale';

interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_link: string;
  meeting_date: string;
  package_id: string;
  plan_name?: string;
}

const Meetings: React.FC = () => {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  const dateLocale = language === 'es' ? es : language === 'pt' ? ptBR : enUS;

  useEffect(() => {
    if (!user) return;
    const fetchMeetings = async () => {
      const { data: userPlans } = await supabase
        .from('user_plans')
        .select('package_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!userPlans || userPlans.length === 0) {
        setLoading(false);
        return;
      }

      const packageIds = userPlans.map(up => up.package_id);

      const { data: meetingsData } = await supabase
        .from('plan_meetings')
        .select('*')
        .in('package_id', packageIds)
        .gte('meeting_date', new Date().toISOString())
        .order('meeting_date', { ascending: true });

      const { data: packages } = await supabase
        .from('packages')
        .select('id, name')
        .in('id', packageIds);

      const packageMap = new Map(packages?.map(p => [p.id, p.name]) || []);

      setMeetings(
        (meetingsData || []).map(m => ({
          ...m,
          plan_name: packageMap.get(m.package_id) || '',
        }))
      );
      setLoading(false);
    };
    fetchMeetings();
  }, [user]);

  const upcomingMeetings = meetings.filter(m => new Date(m.meeting_date) >= new Date());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Video className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold font-display">{t('meetings')}</h1>
      </div>

      {meetings.length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('noMeetings')}</h3>
            <p className="text-muted-foreground text-sm">{t('noMeetingsDesc')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {upcomingMeetings.map(meeting => {
            const meetingDate = new Date(meeting.meeting_date);
            const isToday = new Date().toDateString() === meetingDate.toDateString();

            return (
              <Card key={meeting.id} className="bg-card border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-primary/10 flex flex-col items-center justify-center">
                    <span className="text-xs text-primary font-medium uppercase">
                      {format(meetingDate, 'MMM', { locale: dateLocale })}
                    </span>
                    <span className="text-2xl font-bold text-primary">
                      {format(meetingDate, 'dd')}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate">{meeting.title}</h3>
                      {isToday && <Badge className="bg-primary text-primary-foreground text-xs">{t('today')}</Badge>}
                    </div>
                    {meeting.description && (
                      <p className="text-sm text-muted-foreground mb-1">{meeting.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(meetingDate, 'HH:mm', { locale: dateLocale })}
                      </span>
                      <Badge variant="outline" className="text-xs">{meeting.plan_name}</Badge>
                    </div>
                  </div>

                  <Button asChild size="sm">
                    <a href={meeting.meeting_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      {t('joinMeeting')}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Meetings;
