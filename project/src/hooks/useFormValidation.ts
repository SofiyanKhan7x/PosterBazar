import { useState, useCallback } from 'react';

interface ValidationRule {
  type: 'email' | 'password' | 'textOnly' | 'mobile' | 'confirmPassword' | 'text';
  param?: string;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface FieldErrors {
  [key: string]: string;
}

export const useFormValidation = () => {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const validateField = useCallback((value: string, type: string, param?: string): string => {
    switch (type) {
      case 'email':
        if (!value) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return '';

      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters long';
        if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
        if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
        if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
        if (!/(?=.*[@$!%*?&])/.test(value)) return 'Password must contain at least one special character';
        return '';

      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        if (value !== param) return 'Passwords do not match';
        return '';

      case 'textOnly':
        if (!value) return 'This field is required';
        if (value.length < 2) return 'Must be at least 2 characters long';
        if (!/^[a-zA-Z\s]+$/.test(value)) return 'Only letters and spaces are allowed';
        return '';

      case 'mobile':
        if (!value) return 'Phone number is required';
        if (!/^\d{10}$/.test(value)) return 'Please enter a valid 10-digit phone number';
        return '';

      case 'text':
        if (!value) return 'This field is required';
        return '';

      default:
        return '';
    }
  }, []);

  const handleFieldChange = useCallback((
    fieldName: string, 
    value: string, 
    validationType: string, 
    param?: string
  ): string => {
    // Clear existing error for this field
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));

    return value;
  }, []);

  const handleFieldBlur = useCallback((
    fieldName: string, 
    value: string, 
    validationType: string, 
    param?: string
  ): void => {
    const error = validateField(value, validationType, param);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, [validateField]);

  const validateAllFields = useCallback((
    formData: Record<string, any>, 
    validationRules: ValidationRules
  ): boolean => {
    const errors: FieldErrors = {};
    let isValid = true;

    Object.entries(validationRules).forEach(([fieldName, rule]) => {
      const value = formData[fieldName] || '';
      const error = validateField(value, rule.type, rule.param);
      if (error) {
        errors[fieldName] = error;
        isValid = false;
      }
    });

    setFieldErrors(errors);
    return isValid;
  }, [validateField]);

  const getFieldError = useCallback((fieldName: string): string => {
    return fieldErrors[fieldName] || '';
  }, [fieldErrors]);

  const hasFieldError = useCallback((fieldName: string): boolean => {
    return !!fieldErrors[fieldName];
  }, [fieldErrors]);

  const clearErrors = useCallback((): void => {
    setFieldErrors({});
  }, []);

  const clearFieldError = useCallback((fieldName: string): void => {
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: ''
    }));
  }, []);

  return {
    handleFieldChange,
    handleFieldBlur,
    validateAllFields,
    getFieldError,
    hasFieldError,
    clearErrors,
    clearFieldError,
    fieldErrors
  };
};