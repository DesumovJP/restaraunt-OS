"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Undo2,
  RotateCcw,
  AlertCircle,
  ChefHat,
  UserX,
  Flame,
  Bug,
  HelpCircle,
  Check,
} from "lucide-react";
import type { UndoReasonCode } from "@/types/fsm";

// Reason code configurations
interface ReasonConfig {
  code: UndoReasonCode;
  label: string;
  description: string;
  icon: React.ElementType;
  severity: "low" | "medium" | "high";
  requiresApproval: boolean;
  allowedFromStatuses: string[];
}

export const UNDO_REASONS: ReasonConfig[] = [
  {
    code: "guest_changed_mind",
    label: "Гість передумав",
    description: "Гість змінив своє замовлення",
    icon: UserX,
    severity: "low",
    requiresApproval: false,
    allowedFromStatuses: ["pending", "sent", "cooking"],
  },
  {
    code: "kitchen_issue",
    label: "Проблема на кухні",
    description: "Нестача інгредієнтів або обладнання",
    icon: ChefHat,
    severity: "medium",
    requiresApproval: false,
    allowedFromStatuses: ["sent", "cooking", "plating"],
  },
  {
    code: "quality_issue",
    label: "Проблема якості",
    description: "Страва не відповідає стандартам",
    icon: AlertCircle,
    severity: "medium",
    requiresApproval: false,
    allowedFromStatuses: ["plating", "ready", "served"],
  },
  {
    code: "wrong_item",
    label: "Помилка в замовленні",
    description: "Замовлено не ту страву",
    icon: Bug,
    severity: "low",
    requiresApproval: false,
    allowedFromStatuses: ["pending", "sent", "cooking", "plating"],
  },
  {
    code: "burned",
    label: "Страва підгоріла",
    description: "Потрібно готувати заново",
    icon: Flame,
    severity: "high",
    requiresApproval: true,
    allowedFromStatuses: ["cooking", "plating"],
  },
  {
    code: "allergy_detected",
    label: "Виявлено алерген",
    description: "Конфлікт з алергіями гостя",
    icon: AlertTriangle,
    severity: "high",
    requiresApproval: true,
    allowedFromStatuses: ["pending", "sent", "cooking", "plating", "ready"],
  },
  {
    code: "other",
    label: "Інша причина",
    description: "Потрібно вказати причину",
    icon: HelpCircle,
    severity: "medium",
    requiresApproval: true,
    allowedFromStatuses: ["pending", "sent", "cooking", "plating", "ready", "served"],
  },
];

interface UndoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: UndoReasonCode, customReason?: string) => void;
  itemName: string;
  currentStatus: string;
  targetStatus: string;
  requiresManagerApproval?: boolean;
}

export function UndoModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  currentStatus,
  targetStatus,
  requiresManagerApproval = false,
}: UndoModalProps) {
  const [selectedReason, setSelectedReason] = React.useState<UndoReasonCode | null>(null);
  const [customReason, setCustomReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Filter available reasons based on current status
  const availableReasons = React.useMemo(() => {
    return UNDO_REASONS.filter((reason) =>
      reason.allowedFromStatuses.includes(currentStatus)
    );
  }, [currentStatus]);

  // Reset state when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedReason(null);
      setCustomReason("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const selectedReasonConfig = selectedReason
    ? UNDO_REASONS.find((r) => r.code === selectedReason)
    : null;

  const needsApproval =
    requiresManagerApproval || selectedReasonConfig?.requiresApproval;

  const canSubmit =
    selectedReason !== null &&
    (selectedReason !== "other" || customReason.trim().length > 0);

  const handleConfirm = async () => {
    if (!selectedReason || !canSubmit) return;

    setIsSubmitting(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    onConfirm(
      selectedReason,
      selectedReason === "other" ? customReason.trim() : undefined
    );

    setIsSubmitting(false);
    onClose();
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: "Очікує",
      sent: "Відправлено",
      cooking: "Готується",
      plating: "Сервірується",
      ready: "Готово",
      served: "Подано",
      cancelled: "Скасовано",
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5 text-warning" />
            Відкат статусу
          </DialogTitle>
          <DialogDescription>
            Оберіть причину для відкату статусу страви
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item info */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="font-medium">{itemName}</p>
            <div className="flex items-center gap-2 mt-1.5 text-sm">
              <Badge variant="secondary">{getStatusLabel(currentStatus)}</Badge>
              <RotateCcw className="h-3 w-3 text-muted-foreground" />
              <Badge variant="outline">{getStatusLabel(targetStatus)}</Badge>
            </div>
          </div>

          {/* Approval warning */}
          {needsApproval && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-foreground">
                  Потрібне підтвердження менеджера
                </p>
                <p className="text-xs text-warning-foreground/80 mt-0.5">
                  Цей відкат буде надіслано на погодження
                </p>
              </div>
            </div>
          )}

          {/* Reason selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Причина відкату</label>
            <div className="grid gap-2">
              {availableReasons.map((reason) => {
                const Icon = reason.icon;
                const isSelected = selectedReason === reason.code;

                return (
                  <button
                    key={reason.code}
                    onClick={() => setSelectedReason(reason.code)}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 mt-0.5",
                        reason.severity === "high"
                          ? "text-danger"
                          : reason.severity === "medium"
                            ? "text-warning"
                            : "text-muted-foreground"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {reason.label}
                        </span>
                        {reason.requiresApproval && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            Підтвердження
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {reason.description}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom reason input */}
          {selectedReason === "other" && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Вкажіть причину
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Опишіть причину відкату..."
                className="w-full h-20 px-3 py-2 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground text-right mt-1">
                {customReason.length}/200
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Скасувати
          </Button>
          <Button
            variant={needsApproval ? "default" : "destructive"}
            onClick={handleConfirm}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <RotateCcw className="h-4 w-4 mr-1.5 animate-spin" />
                Обробка...
              </>
            ) : needsApproval ? (
              <>
                <AlertTriangle className="h-4 w-4 mr-1.5" />
                Запросити підтвердження
              </>
            ) : (
              <>
                <Undo2 className="h-4 w-4 mr-1.5" />
                Підтвердити відкат
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Compact undo button with dropdown
interface UndoButtonProps {
  itemDocumentId: string;
  itemName: string;
  currentStatus: string;
  canUndo: boolean;
  targetStatus: string;
  onUndo: (reason: UndoReasonCode, customReason?: string) => void;
  size?: "sm" | "md";
  className?: string;
}

export function UndoButton({
  itemDocumentId,
  itemName,
  currentStatus,
  canUndo,
  targetStatus,
  onUndo,
  size = "md",
  className,
}: UndoButtonProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  if (!canUndo) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size={size === "sm" ? "icon" : "sm"}
        onClick={() => setIsModalOpen(true)}
        className={cn(
          size === "sm" ? "h-7 w-7" : "h-8 px-2",
          "text-muted-foreground hover:text-warning",
          className
        )}
        title="Відкат статусу"
      >
        <Undo2 className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {size !== "sm" && <span className="ml-1">Відкат</span>}
      </Button>

      <UndoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={onUndo}
        itemName={itemName}
        currentStatus={currentStatus}
        targetStatus={targetStatus}
      />
    </>
  );
}

// Undo history display
interface UndoHistoryEntry {
  timestamp: string;
  previousStatus: string;
  newStatus: string;
  reason: UndoReasonCode;
  customReason?: string;
  actorName: string;
  approvedBy?: string;
}

interface UndoHistoryProps {
  history: UndoHistoryEntry[];
  className?: string;
}

export function UndoHistory({ history, className }: UndoHistoryProps) {
  if (history.length === 0) {
    return null;
  }

  const getReasonLabel = (code: UndoReasonCode): string => {
    const reason = UNDO_REASONS.find((r) => r.code === code);
    return reason?.label || code;
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: "Очікує",
      sent: "Відправлено",
      cooking: "Готується",
      plating: "Сервірується",
      ready: "Готово",
      served: "Подано",
      cancelled: "Скасовано",
    };
    return labels[status] || status;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <h4 className="text-sm font-medium flex items-center gap-1.5">
        <Undo2 className="h-4 w-4" />
        Історія відкатів
      </h4>
      <div className="space-y-1.5">
        {history.map((entry, index) => (
          <div
            key={index}
            className="p-2 rounded-lg bg-muted/50 border text-xs"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">{getReasonLabel(entry.reason)}</span>
              <span className="text-muted-foreground">
                {new Date(entry.timestamp).toLocaleString("uk-UA")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Badge variant="secondary" className="text-[10px]">
                {getStatusLabel(entry.previousStatus)}
              </Badge>
              <RotateCcw className="h-2.5 w-2.5" />
              <Badge variant="outline" className="text-[10px]">
                {getStatusLabel(entry.newStatus)}
              </Badge>
              <span className="ml-auto">{entry.actorName}</span>
            </div>
            {entry.customReason && (
              <p className="mt-1 text-muted-foreground italic">
                &quot;{entry.customReason}&quot;
              </p>
            )}
            {entry.approvedBy && (
              <p className="mt-1 text-success text-[10px]">
                Підтверджено: {entry.approvedBy}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
