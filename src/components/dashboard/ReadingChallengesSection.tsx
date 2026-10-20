import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Target } from 'lucide-react';
import { useChallenges, useUserChallenges, useJoinChallenge } from '@/hooks/useReadingChallenges';

const ReadingChallengesSection: React.FC = () => {
  const {
    data: challenges = [],
    isLoading: challengesLoading,
    isError: challengesError,
  } = useChallenges();
  const { data: userChallenges = [] } = useUserChallenges();
  const join = useJoinChallenge();

  const joinedIds = new Set(userChallenges.map((uc) => uc.challenge_id));
  const challengesById = new Map(userChallenges.map((uc) => [uc.challenge_id, uc]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base sm:text-lg">
          <Target className="w-5 h-5 mr-2 text-amber-600" />
          Reading Challenges
        </CardTitle>
      </CardHeader>
      <CardContent>
        {challengesLoading ? (
          <div className="text-center py-6 text-gray-500 text-sm" role="status">
            Loading reading challenges…
          </div>
        ) : challengesError ? (
          <div className="text-center py-6 text-sm text-destructive" role="alert">
            Reading challenges could not be loaded. Please try again.
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            No challenges available right now.
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge) => {
              const participation = challengesById.get(challenge.id);
              const progress = participation?.progress ?? 0;
              const percent = challenge.goal > 0
                ? Math.min(100, Math.round((progress / challenge.goal) * 100))
                : 0;
              const joined = joinedIds.has(challenge.id);

              return (
                <div key={challenge.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">{challenge.name}</h4>
                      <p className="text-sm text-gray-500">{challenge.description}</p>
                    </div>
                    {joined ? (
                      <span className="text-green-600 text-sm font-semibold">
                        {participation?.completed ? 'Completed' : 'Joined'}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => join.mutate(challenge.id)}
                        disabled={join.isPending}
                      >
                        Join
                      </Button>
                    )}
                  </div>
                  {joined && (
                    <div>
                      <Progress value={percent} className="h-2 bg-gray-200" />
                      <div className="text-xs text-gray-500 mt-1">
                        {progress} / {challenge.goal} books completed
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {join.isError && (
              <p className="text-sm text-destructive" role="alert">
                Could not join this challenge. Please try again.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReadingChallengesSection;
