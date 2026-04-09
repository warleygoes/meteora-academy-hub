import React, { useState, useRef } from 'react';
import { Send, Image, Link as LinkIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  onSubmit: (title: string, content: string, imageUrl?: string, linkUrl?: string) => Promise<void>;
}

const CreatePostForm: React.FC<Props> = ({ onSubmit }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayName = user?.user_metadata?.display_name || 'Alumno';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `community/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('community-images').upload(path, file);
    if (error) {
      toast({ title: 'Error al subir imagen', variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('community-images').getPublicUrl(path);
    setImageUrl(publicUrl);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    await onSubmit(title.trim(), content.trim(), imageUrl || undefined, linkUrl || undefined);
    setTitle('');
    setContent('');
    setLinkUrl('');
    setImageUrl('');
    setShowLinkInput(false);
    setSubmitting(false);
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 space-y-3">
          <Input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Título del post..."
            className="bg-secondary border-border font-semibold"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="¿Qué quieres compartir con la comunidad?"
            className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none text-sm min-h-[80px]"
          />

          {/* Image preview */}
          {imageUrl && (
            <div className="relative inline-block">
              <img src={imageUrl} alt="" className="rounded-lg max-h-40 object-cover" />
              <button onClick={() => setImageUrl('')} className="absolute top-1 right-1 bg-background/80 rounded-full p-1 hover:bg-background">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Link input */}
          {showLinkInput && (
            <div className="flex gap-2">
              <Input
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="https://..."
                className="bg-secondary border-border text-sm"
              />
              <Button variant="ghost" size="sm" onClick={() => { setShowLinkInput(false); setLinkUrl(''); }}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-secondary"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowLinkInput(!showLinkInput)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-secondary"
              >
                <LinkIcon className="w-5 h-5" />
              </button>
            </div>
            <Button size="sm" onClick={handleSubmit} disabled={!title.trim() || !content.trim() || submitting} className="gap-2">
              <Send className="w-4 h-4" />
              Publicar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostForm;
