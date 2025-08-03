
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

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
    <Badge 
      variant="secondary" 
      className={`bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 cursor-help ${className}`}
      title={getVerificationText()}
    >
      <CheckCircle className="w-3 h-3 mr-1" />
      Verified
    </Badge>
  );
};
