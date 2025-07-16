
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReadingGoalDialogProps {
  onGoalUpdate?: (goal: number) => void;
}

const ReadingGoalDialog: React.FC<ReadingGoalDialogProps> = ({ onGoalUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [goal, setGoal] = useState(12);
  const { toast } = useToast();

  // Load existing goal from localStorage on component mount
  useEffect(() => {
    const existingGoal = localStorage.getItem('readingGoal2024');
    if (existingGoal) {
      const parsedGoal = parseInt(existingGoal) || 12;
      setGoal(parsedGoal);
    }
  }, []);

  const handleSaveGoal = () => {
    // Save to localStorage
    localStorage.setItem('readingGoal2024', goal.toString());
    
    // Trigger callback to update parent component
    if (onGoalUpdate) {
      onGoalUpdate(goal);
    }
    
    // Dispatch custom event to update all components listening to goal changes
    window.dispatchEvent(new CustomEvent('readingGoalUpdated', { 
      detail: { goal } 
    }));
    
    toast({
      title: "Reading Goal Set!",
      description: `Your goal of ${goal} books for 2024 has been saved.`,
    });
    
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="w-full">
          Set Reading Goal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600" />
            Set Your 2024 Reading Goal
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="goal">Number of books to read in 2024</Label>
            <Input
              id="goal"
              type="number"
              min="1"
              max="365"
              value={goal}
              onChange={(e) => setGoal(parseInt(e.target.value) || 1)}
              placeholder="Enter your goal"
            />
          </div>
          <div className="text-sm text-gray-600">
            Reading {goal} books means about {Math.ceil(goal / 12)} book{Math.ceil(goal / 12) > 1 ? 's' : ''} per month.
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveGoal} className="bg-green-600 hover:bg-green-700">
            Set Goal
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReadingGoalDialog;
