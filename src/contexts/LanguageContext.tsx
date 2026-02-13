import React, { createContext, useContext, useState, useCallback } from 'react';
import { Language, translations } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getSavedLanguage = (): Language => {
  try {
    const saved = localStorage.getItem('meteora-language');
    if (saved === 'es' || saved === 'pt' || saved === 'en') return saved;
  } catch {}
  return 'es';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(getSavedLanguage);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem('meteora-language', lang); } catch {}
  }, []);

  const t = useCallback((key: string) => {
    return translations[language][key] || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
