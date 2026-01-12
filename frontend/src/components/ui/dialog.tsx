"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px]",
      "data-[state=open]:animate-in data-[state=closed]:animate-out",
      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

interface DialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  hideCloseButton?: boolean;
}

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, hideCloseButton, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        // Base positioning - centered with safe margins on mobile
        "fixed z-50 grid w-[calc(100%-2rem)] sm:w-full",
        "left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]",
        // Default max-width with responsive sizing
        "max-w-lg",
        // Max height to prevent overflow on small screens
        "max-h-[calc(100vh-2rem)] sm:max-h-[90vh]",
        // Visual styling
        "rounded-2xl bg-white border border-slate-200/80 shadow-2xl",
        // Overflow handling
        "overflow-hidden",
        // Animations
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
        "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
        "duration-200",
        className
      )}
      {...props}
    >
      {children}
      {!hideCloseButton && (
        <DialogPrimitive.Close className="absolute right-3 top-3 sm:right-4 sm:top-4 rounded-xl p-2 opacity-70 transition-all duration-200 hover:opacity-100 hover:bg-slate-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:pointer-events-none z-10">
          <X className="h-5 w-5 text-slate-500" />
          <span className="sr-only">Закрити</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      "px-4 pt-4 sm:px-6 sm:pt-6",
      "pr-12 sm:pr-14", // Space for close button
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      "px-4 pb-4 pt-4 sm:px-6 sm:pb-6",
      "border-t border-slate-100 bg-slate-50/50",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg sm:text-xl font-semibold leading-tight text-slate-900",
      className
    )}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm sm:text-base text-slate-600", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

/**
 * DialogBody - Container for dialog content with consistent padding and scroll handling
 */
const DialogBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "px-4 py-4 sm:px-6 sm:py-5",
      "overflow-y-auto",
      "flex-1", // Takes remaining space in flex container
      className
    )}
    {...props}
  />
);
DialogBody.displayName = "DialogBody";

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
