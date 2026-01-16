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
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Package,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table, CloseReason } from "@/types/table";
import {
  CLOSE_REASON_LABELS,
  CLOSE_REASON_ICONS,
  CLOSE_REASON_DESCRIPTIONS,
  CLOSE_REASON_COLORS,
  EMERGENCY_CLOSE_REASONS,
} from "@/lib/constants/tables";

interface EmergencyCloseResult {
  abandonedItemsCount: number;
  totalLostRevenue: number;
}

interface EmergencyCloseDialogProps {
  table: Table | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: CloseReason, comment?: string) => Promise<EmergencyCloseResult>;
}

export function EmergencyCloseDialog({
  table,
  isOpen,
  onClose,
  onConfirm,
}: EmergencyCloseDialogProps) {
  const [selectedReason, setSelectedReason] = React.useState<CloseReason | null>(null);
  const [comment, setComment] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [result, setResult] = React.useState<EmergencyCloseResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedReason(null);
      setComment("");
      setIsSuccess(false);
      setResult(null);
      setError(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selectedReason) return;

    setIsLoading(true);
    setError(null);

    try {
      const closeResult = await onConfirm(selectedReason, comment || undefined);
      setResult(closeResult);
      setIsSuccess(true);

      // Auto-close after success (longer delay for emergency)
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка при екстреному закритті");
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

  // Success state with result details
  if (isSuccess && result) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-orange-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-orange-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Стіл екстрено закрито</DialogTitle>
            <DialogDescription className="mb-4">
              Стіл №{table.number} екстрено закрито
            </DialogDescription>

            {/* Result details */}
            <div className="w-full space-y-2 text-sm">
              {result.abandonedItemsCount > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Package className="h-4 w-4" />
                    <span>Скасовано позицій</span>
                  </div>
                  <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                    {result.abandonedItemsCount}
                  </Badge>
                </div>
              )}
              {result.totalLostRevenue > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-red-50 p-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <DollarSign className="h-4 w-4" />
                    <span>Втрачений дохід</span>
                  </div>
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                    {result.totalLostRevenue.toFixed(2)} ₴
                  </Badge>
                </div>
              )}
              {result.abandonedItemsCount === 0 && result.totalLostRevenue === 0 && (
                <div className="rounded-lg bg-emerald-50 p-3 text-emerald-700">
                  Активних замовлень не було
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <div className="rounded-full bg-red-100 p-2">
              <AlertTriangle className="h-5 w-5" />
            </div>
            Екстрене закриття столу
          </DialogTitle>
          <DialogDescription>
            Виберіть причину екстреного закриття столу №{table.number}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {/* Warning */}
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium mb-1">Увага!</p>
                <p>Екстрене закриття скасує всі активні замовлення без оплати. Ця дія буде записана в журнал.</p>
              </div>
            </div>
          </div>

          {/* Reason selection */}
          <div className="space-y-2">
            <Label>Причина екстреного закриття</Label>
            <div className="grid gap-2">
              {EMERGENCY_CLOSE_REASONS.map((reason) => {
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
                      reason === "emergency" && isSelected && "ring-orange-500",
                      reason === "no_show" && isSelected && "ring-blue-500",
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

          {/* Required comment for emergency */}
          <div className="space-y-2">
            <Label htmlFor="emergency-comment">
              Коментар <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="emergency-comment"
              placeholder="Опишіть ситуацію детальніше..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              Коментар обов&apos;язковий для екстреного закриття
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </DialogBody>

        <DialogFooter className="border-t pt-4">
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1"
            >
              Скасувати
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedReason || !comment.trim() || isLoading}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Екстрено закрити
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
