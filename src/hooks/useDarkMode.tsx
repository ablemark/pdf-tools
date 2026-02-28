import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'system';

export function useDarkMode() {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) return savedTheme;
      return 'system';
    }
    return 'system';
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    const applyTheme = (currentTheme: Theme) => {
      const shouldBeDark = currentTheme === 'dark' || (currentTheme === 'system' && isSystemDark);
      setIsDark(shouldBeDark);
      
      if (shouldBeDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme(theme);

    // Listen for system theme changes if in system mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    // Listen for custom theme change event
    const handleCustomThemeChange = (e: CustomEvent<Theme>) => {
      setTheme(e.detail);
    };

    mediaQuery.addEventListener('change', handleChange);
    window.addEventListener('theme-change', handleCustomThemeChange as EventListener);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('theme-change', handleCustomThemeChange as EventListener);
    };
  }, [theme]);

  const toggleDark = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: newTheme }));
  };

  const setSystemTheme = () => {
    setTheme('system');
    localStorage.setItem('theme', 'system');
    window.dispatchEvent(new CustomEvent('theme-change', { detail: 'system' }));
  };

  return { isDark, theme, toggleDark, setTheme, setSystemTheme };
}
