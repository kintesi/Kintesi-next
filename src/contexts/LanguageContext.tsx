import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../data/translations';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
  isEnglish: boolean;
  isBangla: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'kintesi_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'bn' || saved === 'en') {
        return saved;
      }
    } catch {}
    // English is the main default language
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {}

    // Persist to user profile in database if logged in
    const currentUser = auth.currentUser;
    if (currentUser?.uid) {
      updateDoc(doc(db, 'profiles', currentUser.uid), {
        preferred_language: lang,
      }).catch(() => {});
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'bn' : 'en');
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    const entry = translations[key];
    if (entry && entry[language]) {
      return entry[language];
    }
    if (fallback) {
      return fallback;
    }
    // If key not found, fallback to English if exists, or return key
    if (entry && entry.en) {
      return entry.en;
    }
    return key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        isEnglish: language === 'en',
        isBangla: language === 'bn',
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
