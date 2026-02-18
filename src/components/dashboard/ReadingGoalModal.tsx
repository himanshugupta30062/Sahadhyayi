import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target } from 'lucide-react';

interface ReadingGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoal: number;
  totalBooksRead: number;
  onGoalUpdate: (newGoal: number) => void;
}

const ReadingGoalModal: React.FC<ReadingGoalModalProps> = ({
  isOpen,
  onClose,
  currentGoal,
  totalBooksRead,
  onGoalUpdate,
}) => {
  const [newGoal, setNewGoal] = useState(currentGoal + 5);

  const handleUpdateGoal = () => {
    if (newGoal > 0) {
      onGoalUpdate(newGoal);
      localStorage.setItem(`readingGoal${new Date().getFullYear()}`, newGoal.toString());
      // Dispatch custom event to update the dashboard
      window.dispatchEvent(new CustomEvent('readingGoalUpdated', { detail: { goal: newGoal } }));
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-600" />
            🎯 You've reached your reading goal!
          </DialogTitle>
          <DialogDescription>
            You've reached your reading goal of {currentGoal} books! You currently have {totalBooksRead} books in total.
            Would you like to increase your goal?
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="new-goal" className="text-right">
              New Goal
            </Label>
            <Input
              id="new-goal"
              type="number"
              value={newGoal}
              onChange={(e) => setNewGoal(parseInt(e.target.value) || 0)}
              className="col-span-3"
              min="1"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleUpdateGoal} className="bg-amber-600 hover:bg-amber-700">
            Update Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReadingGoalModal;