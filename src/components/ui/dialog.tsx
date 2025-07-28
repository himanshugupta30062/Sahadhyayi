import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Temporary simplified Dialog implementation to fix React import issues
const Dialog = ({ children, open, onOpenChange }: any) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div onClick={() => onOpenChange?.(false)} className="absolute inset-0" />
      <div className="relative">{children}</div>
    </div>
  );
};

const DialogTrigger = ({ children, ...props }: any) => children;

const DialogPortal = ({ children }: any) => children;

const DialogClose = ({ children, ...props }: any) => (
  <button {...props}>{children}</button>
);

const DialogOverlay = ({ className, ...props }: any) => (
  <div className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />
);

const DialogContent = ({ className, children, ...props }: any) => (
  <div
    className={cn(
      "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg",
      className
    )}
    {...props}
  >
    {children}
    <button className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  </div>
);

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = ({ className, ...props }: any) => (
  <h2
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = ({ className, ...props }: any) => (
  <p
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
)
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
