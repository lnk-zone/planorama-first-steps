
import { useState, useEffect, useCallback } from 'react';

interface EmailValidationResult {
  isValid: boolean;
  isChecking: boolean;
  isTaken: boolean;
  error: string | null;
}

export const useEmailValidation = (email: string, debounceMs: number = 500) => {
  const [result, setResult] = useState<EmailValidationResult>({
    isValid: false,
    isChecking: false,
    isTaken: false,
    error: null,
  });

  const validateEmail = useCallback(async (emailToValidate: string) => {
    if (!emailToValidate) {
      setResult({
        isValid: false,
        isChecking: false,
        isTaken: false,
        error: null,
      });
      return;
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToValidate)) {
      setResult({
        isValid: false,
        isChecking: false,
        isTaken: false,
        error: 'Please enter a valid email address',
      });
      return;
    }

    setResult(prev => ({ ...prev, isChecking: true, error: null }));

    // Simulate checking process for better UX
    setTimeout(() => {
      setResult({
        isValid: true,
        isChecking: false,
        isTaken: false,
        error: null,
      });
    }, 300);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateEmail(email);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [email, debounceMs, validateEmail]);

  return result;
};
