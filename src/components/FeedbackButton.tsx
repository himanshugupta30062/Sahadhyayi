import { MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import FeedbackForm from '@/components/FeedbackForm';

const FeedbackButton = () => (
  <Dialog>
    <DialogTrigger asChild>
      <Button size="icon" className="fixed bottom-4 right-4 z-50 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700">
        <MessageSquare className="w-5 h-5" />
        <span className="sr-only">Send Feedback</span>
      </Button>
    </DialogTrigger>
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Send Feedback</DialogTitle>
      </DialogHeader>
      <FeedbackForm />
    </DialogContent>
  </Dialog>
);

export default FeedbackButton;
