
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const feelings = [
  { emoji: '😊', label: 'happy' },
  { emoji: '😢', label: 'sad' },
  { emoji: '😍', label: 'in love' },
  { emoji: '😴', label: 'sleepy' },
  { emoji: '🤔', label: 'thoughtful' },
  { emoji: '😤', label: 'frustrated' },
  { emoji: '🥳', label: 'excited' },
  { emoji: '😌', label: 'peaceful' },
  { emoji: '🤯', label: 'mind blown' },
  { emoji: '🙄', label: 'annoyed' },
  { emoji: '😇', label: 'blessed' },
  { emoji: '🤗', label: 'grateful' },
  { emoji: '📚', label: 'studious' },
  { emoji: '💭', label: 'contemplative' },
  { emoji: '✨', label: 'inspired' },
  { emoji: '🔥', label: 'motivated' }
];

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (feeling: { emoji: string; label: string }) => void;
}

export const EmojiPicker = ({ isOpen, onClose, onSelect }: EmojiPickerProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How are you feeling?</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-4 gap-3 py-4">
          {feelings.map((feeling) => (
            <button
              key={feeling.label}
              onClick={() => onSelect(feeling)}
              className="flex flex-col items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span className="text-2xl mb-1">{feeling.emoji}</span>
              <span className="text-xs text-gray-600 text-center">{feeling.label}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
