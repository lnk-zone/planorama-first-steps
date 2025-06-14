
import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Check, X, AlertCircle } from 'lucide-react';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  isValid?: boolean;
  isValidating?: boolean;
  helperText?: string;
  required?: boolean;
  showValidation?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    label, 
    error, 
    isValid, 
    isValidating, 
    helperText, 
    required = false,
    showValidation = true,
    className,
    ...props 
  }, ref) => {
    const getValidationIcon = () => {
      if (!showValidation || !props.value) return null;
      if (isValidating) return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />;
      if (error) return <X className="h-4 w-4 text-red-500" />;
      if (isValid) return <Check className="h-4 w-4 text-green-500" />;
      return null;
    };

    const getInputBorderColor = () => {
      if (!showValidation || !props.value) return '';
      if (error) return 'border-red-500 focus:border-red-500';
      if (isValid) return 'border-green-500 focus:border-green-500';
      return '';
    };

    return (
      <div className="space-y-2">
        {label && (
          <Label htmlFor={props.id}>
            {label} {required && <span className="text-red-500">*</span>}
          </Label>
        )}
        <div className="relative">
          <Input
            ref={ref}
            className={cn(
              'pr-10',
              getInputBorderColor(),
              className
            )}
            {...props}
          />
          {showValidation && (
            <div className="absolute right-3 top-3">
              {getValidationIcon()}
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center space-x-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
        {isValid && !error && showValidation && props.value && (
          <p className="text-sm text-green-600">✓ Looks good</p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
