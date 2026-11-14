import React, { createContext, useContext, useState, useEffect } from 'react';
import { en } from '../translations/en.js';
import { ne } from '../translations/ne.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // English is default per prompt specifications
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('queueless_lang');
      return saved === 'ne' ? 'ne' : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang) => {
    const nextLang = lang === 'ne' ? 'ne' : 'en';
    setLanguageState(nextLang);
    try {
      localStorage.setItem('queueless_lang', nextLang);
      document.documentElement.lang = nextLang;
    } catch (e) {
      console.warn('Could not store language preference', e);
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = language === 'ne' ? ne : en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
