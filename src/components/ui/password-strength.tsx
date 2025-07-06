
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface PasswordStrengthProps {
  password: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password }) => {
  const calculateStrength = (password: string) => {
    let score = 0;
    
    if (!password) return { score: 0, label: '', color: '' };
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) {
      return { score: score * 20, label: 'Weak', color: 'bg-red-500' };
    } else if (score <= 4) {
      return { score: score * 20, label: 'Medium', color: 'bg-orange-500' };
    } else {
      return { score: 100, label: 'Strong', color: 'bg-green-500' };
    }
  };

  const strength = calculateStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Password Strength:</span>
        <span className={`text-sm font-semibold ${
          strength.label === 'Weak' ? 'text-red-600' :
          strength.label === 'Medium' ? 'text-orange-600' : 'text-green-600'
        }`}>
          {strength.label}
        </span>
      </div>
      <Progress value={strength.score} className="h-2">
        <div 
          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${strength.score}%` }}
        />
      </Progress>
      <div className="text-xs text-gray-600 space-y-1">
        <p>Password should contain:</p>
        <ul className="ml-2 space-y-0.5">
          <li className={password.length >= 8 ? 'text-green-600' : 'text-gray-500'}>
            ✓ At least 8 characters
          </li>
          <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
            ✓ Uppercase letter
          </li>
          <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
            ✓ Lowercase letter
          </li>
          <li className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
            ✓ Number
          </li>
          <li className={/[^A-Za-z0-9]/.test(password) ? 'text-green-600' : 'text-gray-500'}>
            ✓ Special character
          </li>
        </ul>
      </div>
    </div>
  );
};
