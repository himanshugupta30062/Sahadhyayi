
import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

console.log('DeleteProfileDialog loading, React available:', !!React);

type DeleteProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

const DeleteProfileDialog: React.FC<DeleteProfileDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}) => {
  console.log('DeleteProfileDialog rendering, React available:', !!React);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Delete Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete your account? This action is irreversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onConfirm} variant="destructive">Yes, Delete</Button>
          <Button onClick={onCancel} variant="outline">Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteProfileDialog;
