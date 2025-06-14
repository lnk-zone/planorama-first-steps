
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Check, X, Mail } from 'lucide-react';
import { useEmailValidation } from '@/hooks/useEmailValidation';
import { cn } from '@/lib/utils';

interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  onValidationChange?: (isValid: boolean) => void;
}

const EmailInput: React.FC<EmailInputProps> = ({
  value,
  onChange,
  label = 'Email',
  placeholder = 'Enter your email',
  required = false,
  className,
  onValidationChange
}) => {
  const { isValid, isChecking, isTaken, error } = useEmailValidation(value);

  React.useEffect(() => {
    onValidationChange?.(isValid && !isChecking && value.length > 0);
  }, [isValid, isChecking, value, onValidationChange]);

  const getValidationIcon = () => {
    if (!value) return <Mail className="h-4 w-4 text-gray-400" />;
    if (isChecking) return <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />;
    if (error) return <X className="h-4 w-4 text-red-500" />;
    if (isValid) return <Check className="h-4 w-4 text-green-500" />;
    return <Mail className="h-4 w-4 text-gray-400" />;
  };

  const getInputBorderColor = () => {
    if (!value) return '';
    if (isChecking) return 'border-gray-300';
    if (error) return 'border-red-500';
    if (isValid) return 'border-green-500';
    return '';
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="email">{label} {required && <span className="text-red-500">*</span>}</Label>
      <div className="relative">
        <Input
          id="email"
          type="email"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'pl-10 pr-10',
            getInputBorderColor(),
            className
          )}
        />
        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <div className="absolute right-3 top-3">
          {getValidationIcon()}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {isValid && value && !isChecking && (
        <p className="text-sm text-green-600">✓ Email looks good</p>
      )}
    </div>
  );
};

export default EmailInput;
