import React, { createContext, useContext, useState, useEffect } from 'react';

export type AdminTheme = 'light' | 'dark';

interface AdminThemeContextType {
  theme: AdminTheme;
  isLight: boolean;
  toggleTheme: () => void;
  setTheme: (theme: AdminTheme) => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

export const AdminThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AdminTheme>(() => {
    try {
      const saved = localStorage.getItem('kintesi_admin_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {}
    return 'light'; // Default to white mode matching the main website theme
  });

  const setTheme = (newTheme: AdminTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('kintesi_admin_theme', newTheme);
    } catch {}
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <AdminThemeContext.Provider value={{ theme, isLight: theme === 'light', toggleTheme, setTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
};

export const useAdminTheme = () => {
  const context = useContext(AdminThemeContext);
  if (!context) {
    return {
      theme: 'light' as AdminTheme,
      isLight: true,
      toggleTheme: () => {},
      setTheme: () => {},
    };
  }
  return context;
};
