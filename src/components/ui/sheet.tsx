import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Temporary simplified Sheet implementation to fix React import issues
const Sheet = ({ children, open, onOpenChange }: any) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex">
      <div onClick={() => onOpenChange?.(false)} className="absolute inset-0" />
      <div className="relative">{children}</div>
    </div>
  );
};

const SheetTrigger = ({ children, ...props }: any) => children;

const SheetClose = ({ children, ...props }: any) => (
  <button {...props}>{children}</button>
);

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b",
        bottom: "inset-x-0 bottom-0 border-t",
        left: "inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
        right: "inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof sheetVariants> { 
  side?: "top" | "bottom" | "left" | "right"
}

const SheetContent = React.forwardRef<
  HTMLDivElement,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(sheetVariants({ side }), className)}
    {...props}
  >
    {children}
    <button className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100">
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  </div>
))
SheetContent.displayName = "SheetContent"

const SheetPortal = ({ children }: any) => children;

const SheetOverlay = ({ className, ...props }: any) => (
  <div className={cn("fixed inset-0 z-50 bg-black/80", className)} {...props} />
);

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
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
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}