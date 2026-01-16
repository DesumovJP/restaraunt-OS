"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Loader2,
  Undo2,
  AlertTriangle,
  Package,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StationTask } from "./station-queue/types";

interface RecallResult {
  itemName: string;
  itemTotal: number;
  reversedMovements: number;
}

interface RecallTicketDialogProps {
  task: StationTask | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    ticketDocumentId: string,
    reason: string
  ) => Promise<RecallResult>;
}

type RecallReasonType =
  | "customer_change"
  | "quality_issue"
  | "wrong_order"
  | "kitchen_error"
  | "out_of_stock"
  | "other";

const RECALL_REASONS: Array<{
  key: RecallReasonType;
  label: string;
  description: string;
}> = [
  {
    key: "customer_change",
    label: "Зміна замовлення",
    description: "Гість передумав або змінив вибір",
  },
  {
    key: "quality_issue",
    label: "Проблема з якістю",
    description: "Невідповідність стандартам якості",
  },
  {
    key: "wrong_order",
    label: "Помилкове замовлення",
    description: "Офіціант помилився при введенні",
  },
  {
    key: "kitchen_error",
    label: "Помилка кухні",
    description: "Неправильне приготування страви",
  },
  {
    key: "out_of_stock",
    label: "Немає в наявності",
    description: "Закінчилися інгредієнти",
  },
  {
    key: "other",
    label: "Інша причина",
    description: "Вкажіть причину в коментарі",
  },
];

export function RecallTicketDialog({
  task,
  isOpen,
  onClose,
  onConfirm,
}: RecallTicketDialogProps) {
  const [selectedReason, setSelectedReason] =
    React.useState<RecallReasonType | null>(null);
  const [comment, setComment] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [result, setResult] = React.useState<RecallResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // Reset state when dialog opens
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
    if (!selectedReason || !task) return;

    setIsLoading(true);
    setError(null);

    try {
      const reasonText =
        selectedReason === "other"
          ? comment
          : RECALL_REASONS.find((r) => r.key === selectedReason)?.label ||
            selectedReason;

      const recallResult = await onConfirm(task.documentId, reasonText);
      setResult(recallResult);
      setIsSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Помилка при відкликанні"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!task) return null;

  // Success state
  if (isSuccess && result) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-amber-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-amber-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Тікет відкликано</DialogTitle>
            <DialogDescription className="mb-4">
              {result.itemName}
            </DialogDescription>

            <div className="w-full space-y-2 text-sm">
              {result.reversedMovements > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Package className="h-4 w-4" />
                    <span>Повернено на склад</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800 border-blue-300"
                  >
                    {result.reversedMovements} позицій
                  </Badge>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-amber-700">
                  <DollarSign className="h-4 w-4" />
                  <span>Вартість</span>
                </div>
                <span className="font-bold text-amber-800">
                  -{result.itemTotal.toFixed(2)} ₴
                </span>
              </div>
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
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <div className="rounded-full bg-amber-100 p-2">
              <Undo2 className="h-5 w-5" />
            </div>
            Відкликати тікет
          </DialogTitle>
          <DialogDescription>
            {task.quantity}x {task.menuItemName} • Стіл {task.tableNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning */}
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium mb-1">Увага</p>
                <p>
                  Відкликання тікета скасує замовлення цієї позиції. Якщо
                  інгредієнти вже були списані, вони будуть повернені на склад.
                </p>
              </div>
            </div>
          </div>

          {/* Reason selection */}
          <div className="space-y-2">
            <Label>Причина відкликання</Label>
            <div className="grid gap-2">
              {RECALL_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.key;
                return (
                  <button
                    key={reason.key}
                    onClick={() => setSelectedReason(reason.key)}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border-2 p-3 text-left transition-all",
                      "hover:bg-accent",
                      isSelected &&
                        "border-amber-500 bg-amber-50 ring-2 ring-amber-500 ring-offset-2"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{reason.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {reason.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment - required for "other" reason */}
          {selectedReason === "other" && (
            <div className="space-y-2">
              <Label htmlFor="recall-comment">
                Коментар <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="recall-comment"
                placeholder="Опишіть причину відкликання..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="resize-none"
                required
              />
            </div>
          )}

          {/* Optional comment for other reasons */}
          {selectedReason && selectedReason !== "other" && (
            <div className="space-y-2">
              <Label htmlFor="recall-note">Додатковий коментар (опціонально)</Label>
              <Textarea
                id="recall-note"
                placeholder="Додаткові деталі..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                className="resize-none"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

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
              disabled={
                !selectedReason ||
                (selectedReason === "other" && !comment.trim()) ||
                isLoading
              }
              className="flex-1 bg-amber-600 hover:bg-amber-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Відкликати
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
