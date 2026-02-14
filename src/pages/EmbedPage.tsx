import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EmbedPage: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const navigate = useNavigate();
  const [link, setLink] = useState<{ title: string; url: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!linkId) return;
    supabase.from('menu_links').select('title, url').eq('id', linkId).single()
      .then(({ data }) => { setLink(data); setLoading(false); });
  }, [linkId]);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Carregando...</p></div>;
  if (!link) return <div className="p-8"><p>Link não encontrado</p></div>;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="font-medium">{link.title}</h1>
      </div>
      <iframe
        src={link.url}
        className="flex-1 w-full border-0"
        title={link.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
};

export default EmbedPage;
