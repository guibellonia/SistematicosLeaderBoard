import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Inicializar tema do localStorage ou usar 'light' como padrão
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('sistematics-theme') as Theme;
      return savedTheme || 'light';
    }
    return 'light';
  });

  // Aplicar tema ao documento
  useEffect(() => {
    const root = document.documentElement;
    
    // Remover classe anterior
    root.classList.remove('light', 'dark');
    
    // Adicionar nova classe
    root.classList.add(theme);
    
    // Salvar no localStorage
    localStorage.setItem('sistematics-theme', theme);
    
    // Log para debug
    console.log(`🎨 Tema alterado para: ${theme}`);
  }, [theme]);

  // Detectar preferência do sistema na primeira carga
  useEffect(() => {
    const savedTheme = localStorage.getItem('sistematics-theme');
    
    // Se não há tema salvo, usar preferência do sistema
    if (!savedTheme) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemTheme: Theme = prefersDark ? 'dark' : 'light';
      setThemeState(systemTheme);
      console.log(`🎨 Usando tema do sistema: ${systemTheme}`);
    }
  }, []);

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value = {
    theme,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};