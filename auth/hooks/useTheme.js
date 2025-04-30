import { useState, useEffect } from 'react';

export const useTheme = () => {
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    // On mount, read the theme from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);
  
  useEffect(() => {
    // Update the document class when theme changes
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save the theme preference
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Toggle between dark and light themes
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  
  return { theme, toggleTheme };
};

export default useTheme; 