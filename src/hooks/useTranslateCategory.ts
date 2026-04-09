import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

const translationCache: Record<string, string> = {};

export function useTranslateCategory() {
  const { language } = useLanguage();
  const [translating, setTranslating] = useState(false);

  const translateText = useCallback(async (text: string, targetLang?: string): Promise<string> => {
    const lang = targetLang || language;
    // Spanish is the source language, no need to translate
    if (lang === 'es') return text;
    
    const cacheKey = `${text}::${lang}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    const langNames: Record<string, string> = { pt: 'Portuguese', en: 'English', es: 'Spanish' };
    
    try {
      setTranslating(true);
      const { data, error } = await supabase.functions.invoke('translate-category', {
        body: { text, targetLanguage: langNames[lang] || 'English' },
      });
      
      if (error || !data?.translated) return text;
      translationCache[cacheKey] = data.translated;
      return data.translated;
    } catch {
      return text;
    } finally {
      setTranslating(false);
    }
  }, [language]);

  return { translateText, translating };
}
