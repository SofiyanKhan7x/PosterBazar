import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();

  return (
    <button
      onClick={toggleDarkMode}
      className="p-3 rounded-lg bg-primary-100 dark:bg-accent-800 hover:bg-primary-200 dark:hover:bg-accent-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <Sun className="h-6 w-6 text-secondary-500 transition-transform hover:rotate-45 duration-300" />
      ) : (
        <Moon className="h-6 w-6 text-primary-800 transition-transform hover:-rotate-12 duration-300" />
      )}
    </button>
  );
};

export default ThemeToggle;