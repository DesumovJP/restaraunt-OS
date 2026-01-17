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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, CheckCircle2, Loader2, Users, Table as TableIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Table } from "@/types/table";
import { ZONE_LABELS, ZONE_ICONS } from "@/lib/constants/tables";

interface MergeTablesDialogProps {
  primaryTable: Table | null;
  availableTables: Table[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tableIds: string[]) => Promise<void>;
}

export function MergeTablesDialog({
  primaryTable,
  availableTables,
  isOpen,
  onClose,
  onConfirm,
}: MergeTablesDialogProps) {
  const [selectedTableIds, setSelectedTableIds] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Filter available tables - only free or occupied tables, not reserved or already merged
  const selectableTables = React.useMemo(() => {
    return availableTables.filter(
      (table) =>
        table.id !== primaryTable?.id &&
        (table.status === 'free' || table.status === 'occupied') &&
        !table.primaryTableId &&
        !table.mergedWith?.length
    );
  }, [availableTables, primaryTable?.id]);

  // Calculate total capacity
  const totalCapacity = React.useMemo(() => {
    if (!primaryTable) return 0;

    const selectedTables = selectableTables.filter((t) =>
      selectedTableIds.includes(t.id)
    );

    return (
      primaryTable.capacity +
      selectedTables.reduce((sum, t) => sum + t.capacity, 0)
    );
  }, [primaryTable, selectableTables, selectedTableIds]);

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedTableIds([]);
      setIsSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleToggleTable = (tableId: string) => {
    setSelectedTableIds((prev) =>
      prev.includes(tableId)
        ? prev.filter((id) => id !== tableId)
        : [...prev, tableId]
    );
  };

  const handleConfirm = async () => {
    if (selectedTableIds.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      await onConfirm(selectedTableIds);
      setIsSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Помилка при об'єднанні столів");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!primaryTable) return null;

  // Success state
  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 rounded-full bg-emerald-100 p-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Столи об'єднано</DialogTitle>
            <DialogDescription>
              {selectedTableIds.length + 1} столів успішно об'єднано
            </DialogDescription>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const PrimaryZoneIcon = primaryTable.zone ? ZONE_ICONS[primaryTable.zone] : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-purple-700">
            <div className="rounded-full bg-purple-100 p-2">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            Об'єднати столи
          </DialogTitle>
          <DialogDescription>
            Виберіть додаткові столи для об'єднання з основним столом
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Primary Table */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Основний стіл
            </Label>
            <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-purple-100">
                    <span className="text-xl font-bold text-purple-700">
                      {primaryTable.number}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">Стіл №{primaryTable.number}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span>{primaryTable.capacity} місць</span>
                      {primaryTable.zone && PrimaryZoneIcon && (
                        <>
                          <span>•</span>
                          <PrimaryZoneIcon className="w-3 h-3" />
                          <span>{ZONE_LABELS[primaryTable.zone]}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                  Основний
                </Badge>
              </div>
            </div>
          </div>

          {/* Available Tables */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Доступні столи ({selectableTables.length})
            </Label>
            {selectableTables.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-2">
                  <TableIcon className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-0.5">Немає доступних столів</p>
                <p className="text-xs text-muted-foreground">Всі столи зараз зайняті</p>
              </div>
            ) : (
              <div className="grid gap-2 max-h-[300px] overflow-y-auto pr-2">
                {selectableTables.map((table) => {
                  const isSelected = selectedTableIds.includes(table.id);
                  const ZoneIcon = table.zone ? ZONE_ICONS[table.zone] : null;

                  return (
                    <button
                      key={table.id}
                      onClick={() => handleToggleTable(table.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border-2 p-3 text-left transition-all",
                        "hover:bg-accent",
                        isSelected && "border-purple-500 bg-purple-50 ring-2 ring-purple-500 ring-offset-2"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleTable(table.id)}
                        className="pointer-events-none"
                      />
                      <div className="flex items-center justify-center w-10 h-10 rounded bg-muted">
                        <span className="text-lg font-bold">
                          {table.number}
                        </span>
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
                        variant={table.status === 'free' ? 'outline' : 'secondary'}
                        className={cn(
                          table.status === 'free' && 'bg-emerald-50 text-emerald-700 border-emerald-300',
                          table.status === 'occupied' && 'bg-amber-50 text-amber-700 border-amber-300'
                        )}
                      >
                        {table.status === 'free' ? 'Вільний' : 'Зайнятий'}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Summary */}
          {selectedTableIds.length > 0 && (
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-900">
                  Загальна інформація
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Столів об'єднано</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {selectedTableIds.length + 1}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Загальна місткість</p>
                  <p className="text-2xl font-bold text-purple-700">
                    {totalCapacity}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            <p className="font-medium mb-1">Примітка:</p>
            <ul className="text-xs space-y-1 list-disc list-inside">
              <li>Всі замовлення з додаткових столів будуть перенесені на основний</li>
              <li>Додаткові столи будуть позначені як об'єднані</li>
              <li>Ви зможете розділити столи пізніше</li>
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
            disabled={selectedTableIds.length === 0 || isLoading}
            className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-base font-medium rounded-xl"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Об'єднати {selectedTableIds.length > 0 && `(${selectedTableIds.length + 1})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
