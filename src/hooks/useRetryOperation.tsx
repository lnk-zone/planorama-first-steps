
import { useState, useCallback } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: boolean;
}

interface RetryState {
  attempts: number;
  isRetrying: boolean;
  lastError?: Error;
}

export const useRetryOperation = (options: RetryOptions = {}) => {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true
  } = options;

  const [retryState, setRetryState] = useState<RetryState>({
    attempts: 0,
    isRetrying: false
  });

  const executeWithRetry = useCallback(async <T,>(
    operation: () => Promise<T>
  ): Promise<T> => {
    setRetryState(prev => ({ ...prev, isRetrying: true, attempts: 0 }));

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        setRetryState(prev => ({ ...prev, attempts: attempt }));
        const result = await operation();
        setRetryState(prev => ({ ...prev, isRetrying: false }));
        return result;
      } catch (error) {
        const isLastAttempt = attempt === maxAttempts;
        
        if (isLastAttempt) {
          setRetryState(prev => ({ 
            ...prev, 
            isRetrying: false, 
            lastError: error as Error 
          }));
          throw error;
        }

        // Calculate delay with optional backoff
        const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
        await new Promise(resolve => setTimeout(resolve, currentDelay));
      }
    }

    throw new Error('Max retry attempts exceeded');
  }, [maxAttempts, delay, backoff]);

  const reset = useCallback(() => {
    setRetryState({
      attempts: 0,
      isRetrying: false,
      lastError: undefined
    });
  }, []);

  return {
    executeWithRetry,
    retryState,
    reset
  };
};
