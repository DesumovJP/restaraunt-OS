"use client";

import * as React from "react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Search,
  Clock,
  AlertTriangle,
  Check,
  Trash2,
  RefreshCw,
  Lock,
  Unlock,
  ClipboardCheck,
  Flame,
  Filter,
  Calendar,
  Loader2,
  Archive,
} from "lucide-react";
import type { StorageBatch, BatchStatus, ProcessType } from "@/types/extended";

// ==========================================
// STATUS CONFIGURATION
// ==========================================

const BATCH_STATUS_CONFIG: Record<
  BatchStatus,
  { label: string; color: string; bgColor: string }
> = {
  received: {
    label: "Отримано",
    color: "text-blue-700",
    bgColor: "bg-blue-50 border-blue-200",
  },
  inspecting: {
    label: "На перевірці",
    color: "text-purple-700",
    bgColor: "bg-purple-50 border-purple-200",
  },
  processing: {
    label: "Обробляється",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
  },
  available: {
    label: "Доступно",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50 border-emerald-200",
  },
  reserved: {
    label: "Зарезервовано",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
  },
  in_use: {
    label: "В роботі",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
  },
  processed: {
    label: "Оброблено",
    color: "text-teal-700",
    bgColor: "bg-teal-50 border-teal-200",
  },
  depleted: {
    label: "Вичерпано",
    color: "text-slate-500",
    bgColor: "bg-slate-50 border-slate-200",
  },
  expired: {
    label: "Прострочено",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
  },
  quarantine: {
    label: "Карантин",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
  },
  written_off: {
    label: "Списано",
    color: "text-slate-500",
    bgColor: "bg-slate-50 border-slate-200",
  },
};

const WRITE_OFF_REASONS = [
  { value: "expired", label: "Закінчився термін придатності" },
  { value: "spoiled", label: "Зіпсовано" },
  { value: "damaged", label: "Пошкоджено" },
  { value: "contaminated", label: "Забруднено" },
  { value: "quality_issue", label: "Проблема з якістю" },
  { value: "overproduction", label: "Надлишкове виробництво" },
  { value: "inventory_discrepancy", label: "Інвентаризаційна невідповідність" },
  { value: "other", label: "Інша причина" },
];

const PROCESS_TYPES: { value: ProcessType; label: string }[] = [
  { value: "cleaning", label: "Чистка" },
  { value: "boiling", label: "Варіння" },
  { value: "frying", label: "Смаження" },
  { value: "rendering", label: "Топлення" },
  { value: "baking", label: "Випікання" },
  { value: "grilling", label: "Гриль" },
  { value: "portioning", label: "Порціювання" },
];

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getDaysUntilExpiry(expiryDate?: string): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ==========================================
// BATCH CARD COMPONENT
// ==========================================

interface BatchCardProps {
  batch: StorageBatch;
  onProcess?: () => void;
  onWriteOff?: () => void;
  onCount?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
}

function BatchCard({
  batch,
  onProcess,
  onWriteOff,
  onCount,
  onLock,
  onUnlock,
}: BatchCardProps) {
  const statusConfig = BATCH_STATUS_CONFIG[batch.status] || BATCH_STATUS_CONFIG.available;
  const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate);
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 3;
  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
  const usagePercent =
    batch.grossIn > 0 ? ((batch.grossIn - batch.netAvailable) / batch.grossIn) * 100 : 0;

  const isActive = ["available", "reserved", "in_use", "received", "processing"].includes(
    batch.status
  );

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-4 bg-white border rounded-xl transition-all",
        "hover:shadow-md hover:border-primary/30",
        batch.isLocked && "ring-2 ring-amber-500 ring-offset-2",
        isExpired && "border-red-300 bg-red-50/30"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              isActive ? "bg-emerald-100" : "bg-slate-100"
            )}
          >
            <Package className={cn("h-5 w-5", isActive ? "text-emerald-600" : "text-slate-500")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900 truncate">
              {batch.productName || `Партія ${batch.batchNumber}`}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="truncate">#{batch.batchNumber}</span>
              {batch.invoiceNumber && (
                <>
                  <span className="text-slate-300">•</span>
                  <span className="truncate">{batch.invoiceNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
          {batch.isLocked && (
            <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700 bg-amber-50 text-[9px] sm:text-[10px] px-4.5 py-0.5">
              <Lock className="h-3 w-3" />
              <span className="truncate max-w-[60px]">{batch.lockedBy}</span>
            </Badge>
          )}
          <Badge variant="outline" className={cn("text-[9px] sm:text-[10px] px-4.5 py-0.5 whitespace-nowrap", statusConfig.bgColor, statusConfig.color)}>
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      {/* Stock info */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Залишок</span>
          <span className="font-bold text-slate-900 tabular-nums">
            {batch.netAvailable.toFixed(2)} кг
            <span className="text-slate-400 font-normal"> / {batch.grossIn} кг</span>
          </span>
        </div>
        {/* Usage bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              usagePercent > 80 ? "bg-red-500" : usagePercent > 50 ? "bg-amber-500" : "bg-emerald-500"
            )}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Використано: {batch.usedAmount.toFixed(2)} кг</span>
          <span>Відходи: {batch.wastedAmount.toFixed(2)} кг</span>
        </div>
      </div>

      {/* Expiry warning */}
      {isExpiringSoon && (
        <div
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg text-xs",
            isExpired ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
          )}
        >
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>
            {isExpired
              ? "Термін придатності минув!"
              : `До закінчення терміну: ${daysUntilExpiry} дн.`}
          </span>
        </div>
      )}

      {/* Info row */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(batch.receivedAt)}</span>
        </div>
        {batch.expiryDate && !isExpiringSoon && (
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>До {formatDate(batch.expiryDate)}</span>
          </div>
        )}
        <div className="ml-auto font-medium text-slate-700 tabular-nums">
          {formatPrice(batch.totalCost)}
        </div>
      </div>

      {/* Process history */}
      {batch.processes && batch.processes.length > 0 && (
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-slate-600 mb-1">
            Обробки ({batch.processes.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {batch.processes.slice(0, 3).map((process, idx) => {
              const yieldPercent = typeof process.actualYield === 'number' && !isNaN(process.actualYield)
                ? (process.actualYield * 100).toFixed(0)
                : '—';
              return (
                <Badge key={idx} variant="secondary" className="text-[9px] sm:text-[10px]">
                  {PROCESS_TYPES.find((p) => p.value === process.processType)?.label ||
                    process.processType}
                  : {yieldPercent}%
                </Badge>
              );
            })}
            {batch.processes.length > 3 && (
              <Badge variant="secondary" className="text-[9px] sm:text-[10px]">
                +{batch.processes.length - 3}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {isActive && (
        <div className="flex items-center gap-2 pt-2 border-t">
          {onProcess && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={onProcess}
              disabled={batch.isLocked}
            >
              <Flame className="h-3.5 w-3.5 mr-1" />
              Обробити
            </Button>
          )}
          {onWriteOff && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs text-amber-600 border-amber-300 hover:bg-amber-50"
              onClick={onWriteOff}
              disabled={batch.isLocked}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Списати
            </Button>
          )}
          {onCount && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={onCount}
              disabled={batch.isLocked}
            >
              <ClipboardCheck className="h-3.5 w-3.5" />
            </Button>
          )}
          {batch.isLocked ? (
            onUnlock && (
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={onUnlock}>
                <Unlock className="h-3.5 w-3.5" />
              </Button>
            )
          ) : (
            onLock && (
              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={onLock}>
                <Lock className="h-3.5 w-3.5" />
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ==========================================
// DIALOGS
// ==========================================

interface ProcessDialogProps {
  batch: StorageBatch | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (processType: ProcessType, yieldRatio: number, notes?: string) => Promise<void>;
}

function ProcessDialog({ batch, open, onClose, onConfirm }: ProcessDialogProps) {
  const [processType, setProcessType] = React.useState<ProcessType>("cleaning");
  const [yieldRatio, setYieldRatio] = React.useState("0.9");
  const [notes, setNotes] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setProcessType("cleaning");
      setYieldRatio("0.9");
      setNotes("");
    }
  }, [open]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onConfirm(processType, parseFloat(yieldRatio), notes || undefined);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!batch) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-700">
            <div className="rounded-full bg-orange-100 p-2">
              <Flame className="h-5 w-5" />
            </div>
            Обробка партії
          </DialogTitle>
          <DialogDescription>
            {batch.productName || batch.batchNumber} • {batch.netAvailable.toFixed(2)} кг доступно
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 px-4">
          <div className="space-y-2">
            <Label>Тип обробки</Label>
            <Select value={processType} onValueChange={(v) => setProcessType(v as ProcessType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROCESS_TYPES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Очікуваний вихід (%)</Label>
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={yieldRatio}
              onChange={(e) => setYieldRatio(e.target.value)}
              placeholder="0.9 (90%)"
            />
            <p className="text-xs text-muted-foreground">
              Очікуваний вихід: {(batch.netAvailable * parseFloat(yieldRatio || "0")).toFixed(2)} кг
            </p>
          </div>

          <div className="space-y-2">
            <Label>Примітки</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Додаткові примітки..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="px-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Скасувати
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-orange-600 hover:bg-orange-700">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Обробити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface WriteOffDialogProps {
  batch: StorageBatch | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, quantity: number, notes?: string) => Promise<void>;
}

function WriteOffDialog({ batch, open, onClose, onConfirm }: WriteOffDialogProps) {
  const [reason, setReason] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && batch) {
      setReason("");
      setQuantity(batch.netAvailable.toString());
      setNotes("");
    }
  }, [open, batch]);

  const handleSubmit = async () => {
    if (!reason) return;
    setIsLoading(true);
    try {
      await onConfirm(reason, parseFloat(quantity), notes || undefined);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!batch) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <div className="rounded-full bg-amber-100 p-2">
              <Trash2 className="h-5 w-5" />
            </div>
            Списання партії
          </DialogTitle>
          <DialogDescription>
            {batch.productName || batch.batchNumber} • {batch.netAvailable.toFixed(2)} кг доступно
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 px-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p className="font-medium mb-1">Увага</p>
                <p>Списання неможливо скасувати. Переконайтеся, що вказали правильну кількість.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Причина списання</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Оберіть причину..." />
              </SelectTrigger>
              <SelectContent>
                {WRITE_OFF_REASONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Кількість (кг)</Label>
            <Input
              type="number"
              min="0"
              max={batch.netAvailable}
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Вартість списання: {formatPrice(parseFloat(quantity || "0") * batch.unitCost)}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Примітки</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Додаткові деталі..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="px-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !reason}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Списати
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CountDialogProps {
  batch: StorageBatch | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (actualQuantity: number, notes?: string) => Promise<void>;
}

function CountDialog({ batch, open, onClose, onConfirm }: CountDialogProps) {
  const [actualQuantity, setActualQuantity] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    if (open && batch) {
      setActualQuantity("");
      setNotes("");
    }
  }, [open, batch]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await onConfirm(parseFloat(actualQuantity), notes || undefined);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  if (!batch) return null;

  const discrepancy = actualQuantity
    ? parseFloat(actualQuantity) - batch.netAvailable
    : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <div className="rounded-full bg-blue-100 p-2">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            Інвентаризація партії
          </DialogTitle>
          <DialogDescription>
            {batch.productName || batch.batchNumber} • Системний залишок: {batch.netAvailable.toFixed(2)} кг
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 px-4">
          <div className="space-y-2">
            <Label>Фактична кількість (кг)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={actualQuantity}
              onChange={(e) => setActualQuantity(e.target.value)}
              placeholder="Введіть фактичну кількість..."
              autoFocus
            />
          </div>

          {actualQuantity && Math.abs(discrepancy) > 0.001 && (
            <div
              className={cn(
                "rounded-lg p-3 text-sm",
                discrepancy > 0
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              )}
            >
              <p className="font-medium">
                {discrepancy > 0 ? "Надлишок" : "Недостача"}: {Math.abs(discrepancy).toFixed(2)} кг
              </p>
              <p className="text-xs mt-1">
                Різниця: {((discrepancy / batch.netAvailable) * 100).toFixed(1)}%
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Примітки</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Причина розбіжності або примітки..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="px-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !actualQuantity}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Зберегти
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ==========================================
// MAIN BATCH VIEW COMPONENT
// ==========================================

interface BatchViewProps {
  batches: StorageBatch[];
  isLoading?: boolean;
  error?: string | null;
  onProcess?: (batch: StorageBatch, processType: ProcessType, yieldRatio: number, notes?: string) => Promise<void>;
  onWriteOff?: (batch: StorageBatch, reason: string, quantity: number, notes?: string) => Promise<void>;
  onCount?: (batch: StorageBatch, actualQuantity: number, notes?: string) => Promise<void>;
  onLock?: (batch: StorageBatch) => Promise<void>;
  onUnlock?: (batch: StorageBatch) => Promise<void>;
  onRefresh?: () => void;
}

export function BatchView({
  batches,
  isLoading,
  error,
  onProcess,
  onWriteOff,
  onCount,
  onLock,
  onUnlock,
  onRefresh,
}: BatchViewProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<BatchStatus | "all">("all");

  // Dialog states
  const [selectedBatch, setSelectedBatch] = React.useState<StorageBatch | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = React.useState(false);
  const [isWriteOffDialogOpen, setIsWriteOffDialogOpen] = React.useState(false);
  const [isCountDialogOpen, setIsCountDialogOpen] = React.useState(false);

  // Filter batches
  const filteredBatches = React.useMemo(() => {
    let result = [...batches];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          (b.productName || "").toLowerCase().includes(query) ||
          (b.batchNumber || "").toLowerCase().includes(query) ||
          (b.invoiceNumber || "").toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
    }

    // Sort by received date (newest first)
    result.sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime());

    return result;
  }, [batches, searchQuery, statusFilter]);

  // Count alerts
  const expiringCount = React.useMemo(() => {
    return batches.filter((b) => {
      const days = getDaysUntilExpiry(b.expiryDate);
      return days !== null && days <= 3 && days > 0;
    }).length;
  }, [batches]);

  const expiredCount = React.useMemo(() => {
    return batches.filter((b) => {
      const days = getDaysUntilExpiry(b.expiryDate);
      return days !== null && days <= 0;
    }).length;
  }, [batches]);

  // Action handlers
  const handleProcessClick = (batch: StorageBatch) => {
    setSelectedBatch(batch);
    setIsProcessDialogOpen(true);
  };

  const handleWriteOffClick = (batch: StorageBatch) => {
    setSelectedBatch(batch);
    setIsWriteOffDialogOpen(true);
  };

  const handleCountClick = (batch: StorageBatch) => {
    setSelectedBatch(batch);
    setIsCountDialogOpen(true);
  };

  const handleProcessConfirm = async (processType: ProcessType, yieldRatio: number, notes?: string) => {
    if (selectedBatch && onProcess) {
      await onProcess(selectedBatch, processType, yieldRatio, notes);
    }
  };

  const handleWriteOffConfirm = async (reason: string, quantity: number, notes?: string) => {
    if (selectedBatch && onWriteOff) {
      await onWriteOff(selectedBatch, reason, quantity, notes);
    }
  };

  const handleCountConfirm = async (actualQuantity: number, notes?: string) => {
    if (selectedBatch && onCount) {
      await onCount(selectedBatch, actualQuantity, notes);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
        <p className="text-destructive font-medium">Помилка завантаження</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        {onRefresh && (
          <Button variant="outline" size="sm" className="mt-2" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Спробувати знову
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Alerts */}
      {(expiringCount > 0 || expiredCount > 0) && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1 text-sm text-amber-700">
            {expiredCount > 0 && (
              <span className="font-medium text-red-600">{expiredCount} партій прострочено! </span>
            )}
            {expiringCount > 0 && <span>{expiringCount} партій закінчується протягом 3 днів</span>}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter("expired")}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            Переглянути
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Пошук партій..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl text-sm"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as BatchStatus | "all")}
        >
          <SelectTrigger className="w-[180px] h-10 rounded-xl">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Всі статуси" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Всі статуси</SelectItem>
            {Object.entries(BATCH_STATUS_CONFIG).map(([status, config]) => (
              <SelectItem key={status} value={status}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onRefresh && (
          <Button variant="outline" size="icon" onClick={onRefresh} className="h-10 w-10 rounded-xl">
            <RefreshCw className="h-4 w-4" />
          </Button>
        )}

        <div className="ml-auto text-sm text-muted-foreground">
          {filteredBatches.length} з {batches.length} партій
        </div>
      </div>

      {/* Batch list */}
      {filteredBatches.length === 0 ? (
        <EmptyState
          type={searchQuery || statusFilter !== "all" ? "search" : "inventory"}
          title={searchQuery || statusFilter !== "all" ? "Нічого не знайдено" : "Немає партій"}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filteredBatches.map((batch) => (
            <BatchCard
              key={batch.documentId}
              batch={batch}
              onProcess={onProcess ? () => handleProcessClick(batch) : undefined}
              onWriteOff={onWriteOff ? () => handleWriteOffClick(batch) : undefined}
              onCount={onCount ? () => handleCountClick(batch) : undefined}
              onLock={onLock ? () => onLock(batch) : undefined}
              onUnlock={onUnlock ? () => onUnlock(batch) : undefined}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <ProcessDialog
        batch={selectedBatch}
        open={isProcessDialogOpen}
        onClose={() => setIsProcessDialogOpen(false)}
        onConfirm={handleProcessConfirm}
      />
      <WriteOffDialog
        batch={selectedBatch}
        open={isWriteOffDialogOpen}
        onClose={() => setIsWriteOffDialogOpen(false)}
        onConfirm={handleWriteOffConfirm}
      />
      <CountDialog
        batch={selectedBatch}
        open={isCountDialogOpen}
        onClose={() => setIsCountDialogOpen(false)}
        onConfirm={handleCountConfirm}
      />
    </div>
  );
}

export default BatchView;
