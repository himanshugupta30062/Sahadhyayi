import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useUserBadges } from '@/hooks/useReadingChallenges';

const UserBadges: React.FC = () => {
  const { data: badges = [] } = useUserBadges();

  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center mt-2" aria-label="Reading achievements">
      {badges.map((badge) => (
        <Badge key={badge.id} variant="secondary" title={badge.badges?.name}>
          {badge.badges?.icon_url ? `${badge.badges.icon_url} ` : null}
          {badge.badges?.name ?? 'Reading achievement'}
        </Badge>
      ))}
    </div>
  );
};

export default UserBadges;
