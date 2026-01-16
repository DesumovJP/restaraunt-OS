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
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Users,
  Table as TableIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table } from "@/types/table";
import { ZONE_LABELS, ZONE_ICONS } from "@/lib/constants/tables";

interface TransferGuestsDialogProps {
  sourceTable: Table | null;
  availableTables: Table[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetTableId: string) => Promise<void>;
}

export function TransferGuestsDialog({
  sourceTable,
  availableTables,
  isOpen,
  onClose,
  onConfirm,
}: TransferGuestsDialogProps) {
  const [selectedTableId, setSelectedTableId] = React.useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Filter available tables - only free tables
  const selectableTables = React.useMemo(() => {
    return availableTables.filter(
      (table) =>
        table.id !== sourceTable?.id &&
        table.documentId !== sourceTable?.documentId &&
        table.status === "free" &&
        !table.primaryTableId
    );
  }, [availableTables, sourceTable]);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedTableId(null);
      setIsSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selectedTableId) return;

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(selectedTableId);
      setIsSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Помилка при перенесенні гостей"
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

  if (!sourceTable) return null;

  // Success state
  if (isSuccess) {
    const targetTable = selectableTables.find(
      (t) => t.id === selectedTableId || t.documentId === selectedTableId
    );

    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-emerald-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Гостей перенесено</DialogTitle>
            <DialogDescription>
              Стіл №{sourceTable.number} → Стіл №{targetTable?.number}
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const SourceZoneIcon = sourceTable.zone
    ? ZONE_ICONS[sourceTable.zone]
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <div className="rounded-full bg-blue-100 p-2">
              <ArrowRight className="h-5 w-5" />
            </div>
            Перенести гостей
          </DialogTitle>
          <DialogDescription>
            Виберіть стіл, на який перенести гостей та замовлення
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Source Table */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Поточний стіл
            </Label>
            <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-blue-100">
                    <span className="text-xl font-bold text-blue-700">
                      {sourceTable.number}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">Стіл №{sourceTable.number}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {sourceTable.currentGuests && (
                        <>
                          <Users className="w-3 h-3" />
                          <span>{sourceTable.currentGuests} гостей</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{sourceTable.capacity} місць</span>
                      {sourceTable.zone && SourceZoneIcon && (
                        <>
                          <span>•</span>
                          <SourceZoneIcon className="w-3 h-3" />
                          <span>{ZONE_LABELS[sourceTable.zone]}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-amber-50 text-amber-700 border-amber-300"
                >
                  Зайнятий
                </Badge>
              </div>
            </div>
          </div>

          {/* Arrow indicator */}
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-2">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>

          {/* Available Tables */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Вільні столи ({selectableTables.length})
            </Label>
            {selectableTables.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TableIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Немає вільних столів для перенесення</p>
              </div>
            ) : (
              <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                {selectableTables.map((table) => {
                  const isSelected =
                    selectedTableId === table.id ||
                    selectedTableId === table.documentId;
                  const ZoneIcon = table.zone ? ZONE_ICONS[table.zone] : null;

                  return (
                    <button
                      key={table.documentId || table.id}
                      onClick={() =>
                        setSelectedTableId(table.documentId || table.id)
                      }
                      className={cn(
                        "flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                        "hover:bg-accent",
                        isSelected &&
                          "border-blue-500 bg-blue-50 ring-2 ring-blue-500 ring-offset-2"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded",
                          isSelected ? "bg-blue-100" : "bg-muted"
                        )}
                      >
                        <span className="text-lg font-bold">{table.number}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          Стіл №{table.number}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{table.capacity} місць</span>
                          {table.zone && ZoneIcon && (
                            <>
                              <span>•</span>
                              <ZoneIcon className="w-3 h-3" />
                              <span>{ZONE_LABELS[table.zone]}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-300"
                      >
                        Вільний
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <p className="font-medium mb-1">При перенесенні:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Всі активні замовлення будуть перенесені на новий стіл</li>
              <li>Час сесії буде збережено</li>
              <li>Поточний стіл стане вільним</li>
            </ul>
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
            disabled={!selectedTableId || isLoading}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-base font-medium rounded-xl"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Перенести гостей
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
