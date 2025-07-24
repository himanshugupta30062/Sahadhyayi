import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useUserBadges } from '@/hooks/useReadingChallenges';

const UserBadges: React.FC = () => {
  const { data: badges = [] } = useUserBadges();

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-2">
      {badges.map((b) => (
        <Badge key={b.id} variant="secondary">
          {b.badges?.name}
        </Badge>
      ))}
    </div>
  );
};

export default UserBadges;
