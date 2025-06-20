import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface ReadingGoalTrackerProps {
  initialGoal?: number;
}

const ReadingGoalTracker: React.FC<ReadingGoalTrackerProps> = ({ initialGoal = 10 }) => {
  const [goal, setGoal] = useState(initialGoal);
  const [completed, setCompleted] = useState(0);

  const progress = Math.min(100, Math.round((completed / goal) * 100));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Reading Goal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Books read: {completed} / {goal}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setCompleted((v) => Math.max(0, v - 1))} disabled={completed <= 0}>-1</Button>
            <Button size="sm" variant="outline" onClick={() => setCompleted((v) => v + 1)}>+1</Button>
          </div>
        </div>
        <Progress value={progress} />
        <div className="flex items-center gap-2 text-sm">
          <span>Goal:</span>
          <input
            type="number"
            value={goal}
            min={1}
            onChange={(e) => setGoal(parseInt(e.target.value, 10) || 1)}
            className="w-16 border rounded px-1 text-center"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ReadingGoalTracker;
