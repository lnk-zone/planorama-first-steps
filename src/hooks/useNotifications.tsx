
import { toast } from '@/hooks/use-toast';

export interface NotificationOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export const useNotifications = () => {
  const showSuccess = (message: string, options?: Omit<NotificationOptions, 'variant'>) => {
    toast({
      title: options?.title || 'Success',
      description: message,
      variant: 'default',
      duration: options?.duration || 4000,
    });
  };

  const showError = (message: string, options?: Omit<NotificationOptions, 'variant'>) => {
    toast({
      title: options?.title || 'Error',
      description: message,
      variant: 'destructive',
      duration: options?.duration || 6000,
    });
  };

  const showInfo = (message: string, options?: Omit<NotificationOptions, 'variant'>) => {
    toast({
      title: options?.title || 'Info',
      description: message,
      variant: 'default',
      duration: options?.duration || 4000,
    });
  };

  const showWarning = (message: string, options?: Omit<NotificationOptions, 'variant'>) => {
    toast({
      title: options?.title || '⚠️ Warning',
      description: message,
      variant: 'default',
      duration: options?.duration || 5000,
    });
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
  };
};
