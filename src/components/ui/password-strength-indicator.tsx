
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, X, AlertCircle } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  onStrengthChange?: (strength: number) => void;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  onStrengthChange
}) => {
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, feedback: [] };
    
    let score = 0;
    const feedback = [];
    
    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('At least 8 characters');
    }
    
    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One lowercase letter');
    }
    
    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One uppercase letter');
    }
    
    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('One number');
    }
    
    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('One special character');
    }
    
    return { score, feedback };
  };

  const { score, feedback } = getPasswordStrength(password);
  
  React.useEffect(() => {
    onStrengthChange?.(score);
  }, [score, onStrengthChange]);

  const getStrengthLabel = (score: number) => {
    if (score < 2) return 'Weak';
    if (score < 4) return 'Fair';
    if (score < 5) return 'Good';
    return 'Strong';
  };

  const getStrengthColor = (score: number) => {
    if (score < 2) return 'bg-red-500';
    if (score < 4) return 'bg-yellow-500';
    if (score < 5) return 'bg-blue-500';
    return 'bg-green-500';
  };

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Password strength:</span>
        <span className={`text-sm font-medium ${
          score < 2 ? 'text-red-600' : 
          score < 4 ? 'text-yellow-600' : 
          score < 5 ? 'text-blue-600' : 'text-green-600'
        }`}>
          {getStrengthLabel(score)}
        </span>
      </div>
      
      <Progress 
        value={(score / 5) * 100} 
        className="h-2"
      />
      
      {feedback.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Password should include:</p>
          <ul className="space-y-1">
            {feedback.map((item, index) => (
              <li key={index} className="flex items-center text-xs text-gray-600">
                <X className="h-3 w-3 text-red-500 mr-2 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {score === 5 && (
        <div className="flex items-center text-xs text-green-600">
          <Check className="h-3 w-3 mr-2" />
          Great! Your password is strong
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
