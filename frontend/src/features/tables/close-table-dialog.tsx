"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table, CloseReason } from "@/types/table";
import {
  CLOSE_REASON_LABELS,
  CLOSE_REASON_ICONS,
  CLOSE_REASON_DESCRIPTIONS,
  CLOSE_REASON_COLORS,
} from "@/lib/constants/tables";

interface CloseTableDialogProps {
  table: Table | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: CloseReason, comment?: string) => Promise<void>;
}

export function CloseTableDialog({
  table,
  isOpen,
  onClose,
  onConfirm,
}: CloseTableDialogProps) {
  const [selectedReason, setSelectedReason] = React.useState<CloseReason | null>(null);
  const [comment, setComment] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedReason(null);
      setComment("");
      setIsSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selectedReason) return;

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(selectedReason, comment || undefined);
      setIsSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка при закритті столу");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!table) return null;

  // Success state
  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-emerald-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Стіл закрито</DialogTitle>
            <DialogDescription>
              Стіл №{table.number} успішно закрито
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const closeReasons: CloseReason[] = [
    "mistaken_open",
    "no_show",
    "walkout",
    "technical_error",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <div className="rounded-full bg-amber-100 p-2">
              <svg
                className="h-5 w-5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            Закрити стіл
          </DialogTitle>
          <DialogDescription>
            Виберіть причину закриття столу №{table.number}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Reason selection */}
          <div className="space-y-2">
            <Label>Причина закриття</Label>
            <div className="grid gap-2">
              {closeReasons.map((reason) => {
                const Icon = CLOSE_REASON_ICONS[reason];
                const isSelected = selectedReason === reason;

                return (
                  <button
                    key={reason}
                    onClick={() => setSelectedReason(reason)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border-2 p-4 text-left transition-all",
                      CLOSE_REASON_COLORS[reason],
                      isSelected && "ring-2 ring-offset-2",
                      reason === "walkout" && isSelected && "ring-red-500",
                      reason === "no_show" && isSelected && "ring-blue-500",
                      reason === "mistaken_open" && isSelected && "ring-amber-500",
                      reason === "technical_error" && isSelected && "ring-gray-500"
                    )}
                  >
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm mb-1">
                        {CLOSE_REASON_LABELS[reason]}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {CLOSE_REASON_DESCRIPTIONS[reason]}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional comment */}
          <div className="space-y-2">
            <Label htmlFor="comment">Коментар (опціонально)</Label>
            <Textarea
              id="comment"
              placeholder="Додайте коментар, якщо потрібно..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-t pt-4">
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason || isLoading}
            className={cn(
              "w-full h-11 text-base font-medium rounded-xl",
              selectedReason === "walkout" ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
            )}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Закрити стіл
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
