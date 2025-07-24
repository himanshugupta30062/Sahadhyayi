import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import FeedbackForm from './FeedbackForm';

const FeedbackButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="icon"
          aria-label="Send Feedback"
          className="fixed bottom-24 right-4 z-50 rounded-full bg-orange-600 text-white hover:bg-orange-700 shadow-lg"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <FeedbackForm onSubmitted={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackButton;
