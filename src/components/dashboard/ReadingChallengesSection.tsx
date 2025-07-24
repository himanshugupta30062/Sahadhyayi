import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';
import { useChallenges, useUserChallenges, useJoinChallenge } from '@/hooks/useReadingChallenges';

const ReadingChallengesSection: React.FC = () => {
  const { data: challenges = [] } = useChallenges();
  const { data: userChallenges = [] } = useUserChallenges();
  const join = useJoinChallenge();

  const joinedIds = new Set(userChallenges.map((uc) => uc.challenge_id));

  const getProgress = (id: string) =>
    userChallenges.find((uc) => uc.challenge_id === id)?.progress || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base sm:text-lg">
          <Target className="w-5 h-5 mr-2 text-amber-600" />
          Reading Challenges
        </CardTitle>
      </CardHeader>
      <CardContent>
        {challenges.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No challenges available.
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((ch) => {
              const progress = getProgress(ch.id);
              const percent = Math.min(100, Math.round((progress / ch.goal) * 100));
              const joined = joinedIds.has(ch.id);
              return (
                <div key={ch.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{ch.name}</h4>
                      <p className="text-sm text-gray-500">{ch.description}</p>
                    </div>
                    {joined ? (
                      <span className="text-green-600 text-sm font-semibold">Joined</span>
                    ) : (
                      <Button size="sm" onClick={() => join.mutate(ch.id)} disabled={join.isPending}>
                        Join
                      </Button>
                    )}
                  </div>
                  {joined && (
                    <div>
                      <Progress value={percent} className="h-2 bg-gray-200" />
                      <div className="text-xs text-gray-500 mt-1">
                        {progress} / {ch.goal} books
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReadingChallengesSection;
