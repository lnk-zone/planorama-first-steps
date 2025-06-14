
import { useState, useCallback } from 'react';
import { FieldErrors, FieldValues } from 'react-hook-form';

interface ValidationRule {
  required?: boolean | string;
  minLength?: { value: number; message: string };
  maxLength?: { value: number; message: string };
  pattern?: { value: RegExp; message: string };
  validate?: (value: any) => boolean | string;
}

interface UseFormValidationProps {
  rules: Record<string, ValidationRule>;
}

export const useFormValidation = ({ rules }: UseFormValidationProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = rules[name];
    if (!rule) return null;

    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return typeof rule.required === 'string' ? rule.required : `${name} is required`;
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength.value) {
        return rule.minLength.message;
      }
      if (rule.maxLength && value.length > rule.maxLength.value) {
        return rule.maxLength.message;
      }
      if (rule.pattern && !rule.pattern.value.test(value)) {
        return rule.pattern.message;
      }
    }

    // Custom validation
    if (rule.validate) {
      const result = rule.validate(value);
      if (result !== true) {
        return typeof result === 'string' ? result : `${name} is invalid`;
      }
    }

    return null;
  }, [rules]);

  const validateForm = useCallback((data: Record<string, any>) => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(rules).forEach(fieldName => {
      const error = validateField(fieldName, data[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return { isValid, errors: newErrors };
  }, [rules, validateField]);

  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearError,
    clearAllErrors,
  };
};
