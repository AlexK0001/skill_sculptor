'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ua' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ua: {
    'login': 'Увійти',
    'register': 'Реєстрація',
    'skills': 'Мої навички',
    'logout': 'Вийти',
    'focus': 'Поточний фокус',
    'profile': 'Мій профіль'
  },
  en: {
    'login': 'Login',
    'register': 'Register',
    'skills': 'My Skills',
    'logout': 'Logout',
    'focus': 'Current focus',
    'profile': 'My Profile'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'ua',
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ua');

  useEffect(() => {
    const stored = localStorage.getItem('language') as Language;
    if (stored === 'ua' || stored === 'en') {
      setLanguageState(stored);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
