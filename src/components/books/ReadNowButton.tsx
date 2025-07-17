import React from 'react';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2 } from 'lucide-react';
import { useReadNow } from '@/hooks/useReadNow';

interface ReadNowButtonProps {
  bookId: string;
  bookTitle: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  children?: React.ReactNode;
}

const ReadNowButton: React.FC<ReadNowButtonProps> = ({
  bookId,
  bookTitle,
  variant = 'default',
  size = 'default',
  className = '',
  children,
}) => {
  const { handleReadNow, isLoading } = useReadNow();

  const onClick = () => {
    handleReadNow(bookId, bookTitle);
  };

  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <BookOpen className="w-4 h-4 mr-2" />
      )}
      {children || (isLoading ? 'Adding...' : 'Read Now')}
    </Button>
  );
};

export default ReadNowButton;