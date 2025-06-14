
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

    try {
      // Check if email is already registered
      const { data, error } = await supabase.auth.admin.listUsers();
      
      if (error) throw error;

      const isTaken = data.users.some(user => user.email === emailToValidate);

      setResult({
        isValid: !isTaken,
        isChecking: false,
        isTaken,
        error: isTaken ? 'This email is already registered' : null,
      });
    } catch (error) {
      // Fallback: just validate format if we can't check availability
      setResult({
        isValid: true,
        isChecking: false,
        isTaken: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      validateEmail(email);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [email, debounceMs, validateEmail]);

  return result;
};
