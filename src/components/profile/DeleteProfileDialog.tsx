import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DeleteProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
};

const DeleteProfileDialog: React.FC<DeleteProfileDialogProps> = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  isPending = false,
}) => {
  const [confirmation, setConfirmation] = React.useState("");

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setConfirmation("");
    onOpenChange(nextOpen);
  };

  const handleCancel = () => {
    setConfirmation("");
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Permanently Delete Account</DialogTitle>
          <DialogDescription>
            This permanently deletes your Sahadhyayi account, authentication record, profile, and associated account data.
            This action cannot be undone. You will be signed out immediately.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <label htmlFor="delete-account-confirmation" className="text-sm font-medium">
            Type <span className="font-bold">DELETE</span> to confirm.
          </label>
          <Input
            id="delete-account-confirmation"
            autoComplete="off"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder="Type DELETE"
            disabled={isPending}
          />
        </div>
        <DialogFooter>
          <Button onClick={handleCancel} variant="outline" disabled={isPending}>Cancel</Button>
          <Button
            onClick={onConfirm}
            variant="destructive"
            disabled={confirmation !== "DELETE" || isPending}
          >
            {isPending ? "Deleting account…" : "Permanently delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteProfileDialog;
