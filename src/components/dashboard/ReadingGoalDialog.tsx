import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReadingGoal } from '@/hooks/useReadingGoal';

interface ReadingGoalDialogProps {
  onGoalUpdate?: (goal: number) => void;
}

const ReadingGoalDialog: React.FC<ReadingGoalDialogProps> = ({ onGoalUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { goal: currentGoal, currentYear, setGoal: saveGoalToCloudAndLocal } = useReadingGoal();
  const [goal, setGoal] = useState(currentGoal);
  const { toast } = useToast();

  useEffect(() => {
    setGoal(currentGoal);
  }, [currentGoal]);

  const handleSaveGoal = async () => {
    if (goal <= 0) return;

    await saveGoalToCloudAndLocal(goal);
    
    if (onGoalUpdate) {
      onGoalUpdate(goal);
    }
    
    toast({
      title: "Reading Goal Saved",
      description: `Your goal of ${goal} books for ${currentYear} has been synced to your account.`,
    });
    
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full border-border hover:border-[hsl(var(--brand-primary))] hover:text-[hsl(var(--brand-primary))]">
          Set Reading Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-[hsl(var(--brand-primary))]" />
            Set Your {currentYear} Reading Goal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="goal">Number of books to read in {currentYear}</Label>
            <Input
              id="goal"
              type="number"
              min="1"
              max="365"
              value={goal}
              onChange={(e) => setGoal(parseInt(e.target.value, 10) || 1)}
              placeholder="Enter your goal"
              className="border-border"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Reading {goal} books means about {Math.round((goal / 12) * 10) / 10} book{Math.ceil(goal / 12) > 1 ? 's' : ''} per month.
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveGoal} 
            className="bg-[hsl(var(--brand-primary))] hover:bg-[hsl(var(--brand-primary)/0.9)] text-white"
          >
            Save Goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReadingGoalDialog;
