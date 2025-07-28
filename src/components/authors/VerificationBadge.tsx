import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Verified } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VerificationBadgeProps {
  verified: boolean;
  verificationType?: string;
  className?: string;
}

export const VerificationBadge = ({ verified, verificationType, className }: VerificationBadgeProps) => {
  if (!verified) return null;

  const getVerificationText = () => {
    switch (verificationType) {
      case 'publisher': return 'Verified by Publisher';
      case 'document': return 'Document Verified';
      case 'manual': return 'Manually Verified';
      default: return 'Verified Author';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="secondary" className={`bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 ${className}`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getVerificationText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};