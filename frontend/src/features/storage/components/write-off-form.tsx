"use client";

import * as React from "react";
import { useMutation } from "urql";
import { CREATE_INVENTORY_MOVEMENT, UPDATE_STOCK_BATCH } from "@/graphql/mutations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertTriangle,
  Clock,
  Package,
  Trash2,
  FileEdit,
  ChefHat,
  UserX,
  XCircle,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StorageBatch {
  documentId: string;
  batchNumber: string;
  netAvailable: number;
  wastedAmount?: number;
  unitCost: number;
  expiryDate?: string;
  ingredient?: {
    documentId: string;
    name: string;
    unit: string;
  };
}

interface WriteOffFormProps {
  batch: StorageBatch | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const WRITE_OFF_REASONS = [
  { code: "expired", label: "Прострочено", icon: Clock },
  { code: "spoiled", label: "Зіпсовано", icon: AlertTriangle },
  { code: "damaged", label: "Пошкоджено", icon: Package },
  { code: "theft", label: "Крадіжка", icon: UserX },
  { code: "quality_fail", label: "Контроль якості", icon: XCircle },
  { code: "cooking_loss", label: "Втрати при готуванні", icon: ChefHat },
  { code: "inventory_adjust", label: "Коригування", icon: FileEdit },
  { code: "other", label: "Інше", icon: MoreHorizontal },
] as const;

type WriteOffReasonCode = (typeof WRITE_OFF_REASONS)[number]["code"];

export function WriteOffForm({
  batch,
  open,
  onOpenChange,
  onSuccess,
}: WriteOffFormProps) {
  // Form state
  const [quantity, setQuantity] = React.useState("");
  const [reasonCode, setReasonCode] = React.useState<WriteOffReasonCode | "">("");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Mutations
  const [, createInventoryMovement] = useMutation(CREATE_INVENTORY_MOVEMENT);
  const [, updateStockBatch] = useMutation(UPDATE_STOCK_BATCH);

  // Calculate cost impact
  const costImpact = React.useMemo(() => {
    const qty = parseFloat(quantity) || 0;
    const cost = batch?.unitCost || 0;
    return qty * cost;
  }, [quantity, batch?.unitCost]);

  // Reset form on close or batch change
  React.useEffect(() => {
    if (!open) {
      setQuantity("");
      setReasonCode("");
      setNotes("");
      setError(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!batch) {
      setError("Партія не обрана");
      return;
    }

    const qty = parseFloat(quantity);
    if (!qty || qty <= 0) {
      setError("Вкажіть кількість для списання");
      return;
    }

    if (qty > batch.netAvailable) {
      setError(`Максимальна кількість: ${batch.netAvailable}`);
      return;
    }

    if (!reasonCode) {
      setError("Оберіть причину списання");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedReason = WRITE_OFF_REASONS.find((r) => r.code === reasonCode);

      // Create inventory movement for write-off
      const movementResult = await createInventoryMovement({
        data: {
          ingredient: batch.ingredient?.documentId,
          stockBatch: batch.documentId,
          movementType: "write_off",
          quantity: qty,
          unit: batch.ingredient?.unit || "kg",
          unitCost: batch.unitCost,
          totalCost: costImpact,
          reason: selectedReason?.label || "Списання",
          reasonCode: reasonCode,
          notes: notes || undefined,
        },
      });

      if (movementResult.error) {
        throw new Error(movementResult.error.message);
      }

      // Update stock batch
      const newNetAvailable = batch.netAvailable - qty;
      const newWastedAmount = (batch.wastedAmount || 0) + qty;
      const newStatus = newNetAvailable <= 0 ? "written_off" : "available";

      await updateStockBatch({
        documentId: batch.documentId,
        data: {
          netAvailable: newNetAvailable,
          wastedAmount: newWastedAmount,
          status: newStatus,
        },
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка списання");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!batch) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Списання товару
          </DialogTitle>
          <DialogDescription>
            Партія: {batch.batchNumber}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Batch Info */}
          <div className="p-3 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Продукт:</span>
              <span className="font-medium">{batch.ingredient?.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Доступно:</span>
              <span className="font-medium">
                {batch.netAvailable} {batch.ingredient?.unit}
              </span>
            </div>
            {batch.expiryDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Термін придатності:
                </span>
                <span className="font-medium">
                  {new Date(batch.expiryDate).toLocaleDateString("uk-UA")}
                </span>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label htmlFor="writeoff-qty">
              Кількість для списання <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="writeoff-qty"
                type="number"
                step="0.01"
                min="0"
                max={batch.netAvailable}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {batch.ingredient?.unit || "кг"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Максимум: {batch.netAvailable} {batch.ingredient?.unit}
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <Label>
              Причина списання <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {WRITE_OFF_REASONS.map((reason) => {
                const Icon = reason.icon;
                const isSelected = reasonCode === reason.code;
                return (
                  <button
                    key={reason.code}
                    type="button"
                    onClick={() => setReasonCode(reason.code)}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg border text-left text-sm transition-colors",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{reason.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="writeoff-notes">Примітки</Label>
            <Textarea
              id="writeoff-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Додаткова інформація..."
              rows={2}
            />
          </div>

          {/* Cost Impact Warning */}
          {costImpact > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-destructive flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" />
                  Втрати:
                </span>
                <span className="text-lg font-bold text-destructive">
                  {costImpact.toLocaleString("uk-UA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  грн
                </span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Списання...
                </>
              ) : (
                "Списати"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
