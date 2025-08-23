import { useState, useEffect, useCallback } from 'react';

interface AutoSaveOptions {
  key: string;
  delay?: number;
  enabled?: boolean;
}

export const useFormAutoSave = <T extends Record<string, any>>(
  initialData: T,
  options: AutoSaveOptions
) => {
  const { key, delay = 2000, enabled = true } = options;
  const [formData, setFormData] = useState<T>(initialData);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    if (!enabled) return;
    
    try {
      const savedData = localStorage.getItem(`autosave_${key}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setFormData({ ...initialData, ...parsed });
        setLastSaved(new Date(parsed._timestamp || Date.now()));
      }
    } catch (error) {
      console.warn('Failed to load auto-saved data:', error);
    }
  }, [key, enabled]);

  // Auto-save with debouncing
  useEffect(() => {
    if (!enabled) return;
    
    const timeoutId = setTimeout(() => {
      setIsSaving(true);
      try {
        const dataToSave = {
          ...formData,
          _timestamp: Date.now()
        };
        localStorage.setItem(`autosave_${key}`, JSON.stringify(dataToSave));
        setLastSaved(new Date());
      } catch (error) {
        console.warn('Failed to auto-save data:', error);
      } finally {
        setIsSaving(false);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [formData, key, delay, enabled]);

  const updateFormData = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(`autosave_${key}`);
      setLastSaved(null);
    } catch (error) {
      console.warn('Failed to clear saved data:', error);
    }
  }, [key]);

  const restoreFromSave = useCallback(() => {
    try {
      const savedData = localStorage.getItem(`autosave_${key}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setFormData({ ...initialData, ...parsed });
        return true;
      }
    } catch (error) {
      console.warn('Failed to restore from save:', error);
    }
    return false;
  }, [key, initialData]);

  return {
    formData,
    updateFormData,
    lastSaved,
    isSaving,
    clearSavedData,
    restoreFromSave,
    hasUnsavedChanges: lastSaved ? Date.now() - lastSaved.getTime() > delay : false
  };
};