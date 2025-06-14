
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseRetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onError?: (error: Error, retryCount: number) => void;
}

export const useRetry = <T extends any[], R>(
  asyncFunction: (...args: T) => Promise<R>,
  options: UseRetryOptions = {}
) => {
  const { maxRetries = 3, retryDelay = 1000, onError } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    setIsLoading(true);
    setError(null);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFunction(...args);
        setRetryCount(0);
        setIsLoading(false);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setRetryCount(attempt + 1);

        if (onError) {
          onError(error, attempt + 1);
        }

        if (attempt === maxRetries) {
          setIsLoading(false);
          toast({
            title: "Operation failed",
            description: `Failed after ${maxRetries + 1} attempts. Please try again later.`,
            variant: "destructive",
          });
          return null;
        }

        // Wait before retrying
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    setIsLoading(false);
    return null;
  }, [asyncFunction, maxRetries, retryDelay, onError]);

  const retry = useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  return {
    execute,
    retry,
    isLoading,
    error,
    retryCount,
  };
};
