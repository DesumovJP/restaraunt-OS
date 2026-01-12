"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Clock, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table } from "@/types/table";

interface ExtendSessionDialogProps {
  table: Table | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (minutes: number) => Promise<void>;
}

export function ExtendSessionDialog({
  table,
  isOpen,
  onClose,
  onConfirm,
}: ExtendSessionDialogProps) {
  const [selectedMinutes, setSelectedMinutes] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Calculate current session duration
  const currentDuration = React.useMemo(() => {
    if (!table?.occupiedAt) return null;

    const startDate = table.occupiedAt instanceof Date
      ? table.occupiedAt
      : new Date(table.occupiedAt);

    const now = new Date();
    const diff = now.getTime() - startDate.getTime();

    if (isNaN(diff) || diff < 0) return null;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, totalMinutes: Math.floor(diff / (1000 * 60)) };
  }, [table?.occupiedAt]);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedMinutes(null);
      setIsSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (selectedMinutes === null) return;

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(selectedMinutes);
      setIsSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка при подовженні сесії");
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
            <DialogTitle className="text-xl mb-2">Сесію подовжено</DialogTitle>
            <DialogDescription>
              Таймер столу №{table.number} було скинуто
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const extendOptions = [
    { minutes: 15, label: "15 хвилин" },
    { minutes: 30, label: "30 хвилин" },
    { minutes: 60, label: "1 година" },
    { minutes: 0, label: "Скинути повністю" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <div className="rounded-full bg-blue-100 p-2">
              <Clock className="h-5 w-5" />
            </div>
            Подовжити сесію
          </DialogTitle>
          <DialogDescription>
            Скиньте або зменшіть час сесії столу №{table.number}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current session time */}
          {currentDuration && (
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Поточна тривалість сесії
              </p>
              <p className="text-3xl font-bold">
                {currentDuration.hours > 0
                  ? `${currentDuration.hours}г ${currentDuration.minutes}хв`
                  : `${currentDuration.minutes}хв`
                }
              </p>
            </div>
          )}

          {/* Extend options */}
          <div className="space-y-2">
            <Label>Виберіть дію</Label>
            <div className="grid gap-2">
              {extendOptions.map((option) => {
                const isSelected = selectedMinutes === option.minutes;

                return (
                  <button
                    key={option.minutes}
                    onClick={() => setSelectedMinutes(option.minutes)}
                    className={cn(
                      "flex items-center justify-between rounded-lg border-2 p-4 text-left transition-all",
                      "hover:bg-accent hover:border-accent-foreground/20",
                      isSelected && "border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">
                          {option.label}
                        </p>
                        {option.minutes === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Почати відлік з нуля
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Зменшити час на {option.minutes} хв
                          </p>
                        )}
                      </div>
                    </div>
                    {currentDuration && option.minutes > 0 && (
                      <div className="text-right">
                        <p className="text-sm font-medium text-muted-foreground">
                          Буде: {Math.max(0, currentDuration.totalMinutes - option.minutes)}хв
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info */}
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <p className="font-medium mb-1">Примітка:</p>
            <p className="text-xs">
              Подовження сесії не впливає на замовлення або рахунок.
              Це лише скидає таймер для зручності відстеження часу.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            onClick={handleConfirm}
            disabled={selectedMinutes === null || isLoading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base font-medium rounded-xl"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Підтвердити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
