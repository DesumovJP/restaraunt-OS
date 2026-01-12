"use client";

/**
 * Action Detail Views
 *
 * Specialized detail views for different action types in action history.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Timer,
  Utensils,
  FileText,
  ChefHat,
  Table2,
  TrendingDown,
  TrendingUp,
  Box,
  CheckCircle,
  Package,
} from "lucide-react";
import { formatCurrency, formatDurationSeconds } from "@/lib/formatters";
import type {
  IngredientUsed,
  ConsumptionDetail,
  TimingData,
  TimingFormatted,
  TimestampData,
  ReleasedItem,
} from "../history-config";

// ==========================================
// KITCHEN TICKET START (INVENTORY CONSUMPTION)
// ==========================================

interface KitchenTicketStartDetailsProps {
  metadata: Record<string, unknown>;
}

export function KitchenTicketStartDetails({
  metadata,
}: KitchenTicketStartDetailsProps) {
  const ingredientsUsed = metadata.ingredientsUsed as IngredientUsed[] | undefined;
  const consumptionDetails = metadata.consumptionDetails as ConsumptionDetail[] | undefined;

  return (
    <div className="space-y-4">
      {/* Order Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Utensils className="h-3 w-3" />
            Страва
          </div>
          <p className="font-medium">{(metadata.menuItemName as string) || "—"}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <FileText className="h-3 w-3" />
            Замовлення
          </div>
          <p className="font-medium">{(metadata.orderNumber as string) || "—"}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Table2 className="h-3 w-3" />
            Стіл
          </div>
          <p className="font-medium">{(metadata.tableNumber as string) || "—"}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <ChefHat className="h-3 w-3" />
            Станція
          </div>
          <p className="font-medium capitalize">{(metadata.station as string) || "—"}</p>
        </div>
      </div>

      {/* Ingredients Summary */}
      {ingredientsUsed && ingredientsUsed.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Використані інгредієнти ({ingredientsUsed.length})
          </h4>
          <div className="bg-muted/30 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-2 font-medium">Інгредієнт</th>
                  <th className="text-right p-2 font-medium">Кількість</th>
                  <th className="text-right p-2 font-medium">Вартість</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ingredientsUsed.map((ing, idx) => (
                  <tr key={idx} className="hover:bg-muted/20">
                    <td className="p-2">{ing.name}</td>
                    <td className="text-right p-2 font-mono text-xs">
                      {ing.quantity} {ing.unit}
                    </td>
                    <td className="text-right p-2 font-mono text-xs">
                      {formatCurrency(ing.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 font-medium">
                <tr>
                  <td className="p-2" colSpan={2}>
                    Загальна собівартість
                  </td>
                  <td className="text-right p-2 text-primary">
                    {formatCurrency(metadata.totalCost as number)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Batch Consumption Details */}
      {consumptionDetails && consumptionDetails.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Box className="h-4 w-4 text-info" />
            Списання з партій (FIFO/FEFO)
          </h4>
          <div className="space-y-2">
            {consumptionDetails.map((detail, idx) => (
              <div key={idx} className="bg-muted/20 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{detail.ingredient}</span>
                  <Badge variant="outline" className="text-xs">
                    Партія: {detail.batch}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Списано:</span>
                    <span className="ml-1 font-mono">
                      {detail.quantity} {detail.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Вартість:</span>
                    <span className="ml-1 font-mono">{formatCurrency(detail.cost)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-3 w-3 text-warning" />
                    <span className="text-muted-foreground">До:</span>
                    <span className="font-mono">{detail.stockBefore}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono">{detail.stockAfter}</span>
                  </div>
                  {detail.expiryDate && (
                    <div>
                      <span className="text-muted-foreground">Термін:</span>
                      <span className="ml-1">
                        {new Date(detail.expiryDate).toLocaleDateString("uk-UA")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
        <span className="flex items-center gap-1">
          <Timer className="h-3 w-3" />
          Час обробки: {metadata.processingTimeMs as number}мс
        </span>
        <span>Партій: {metadata.totalBatchesUsed as number}</span>
        <span>Інгредієнтів: {metadata.totalIngredients as number}</span>
      </div>
    </div>
  );
}

// ==========================================
// KITCHEN TICKET TIMING (COMPLETE/SERVE)
// ==========================================

interface KitchenTicketTimingDetailsProps {
  metadata: Record<string, unknown>;
}

export function KitchenTicketTimingDetails({
  metadata,
}: KitchenTicketTimingDetailsProps) {
  const menuItemName = String(metadata.menuItemName ?? "—");
  const orderNumber = String(metadata.orderNumber ?? "—");
  const tableNumber = String(metadata.tableNumber ?? "—");
  const orderReady = Boolean(metadata.orderReady);
  const cookingTimeFormatted = metadata.cookingTimeFormatted
    ? String(metadata.cookingTimeFormatted)
    : null;

  const timings = metadata.timings as TimingData | undefined;
  const timingsFormatted = metadata.timingsFormatted as TimingFormatted | undefined;
  const timestamps = metadata.timestamps as TimestampData | undefined;

  const hasTimings = timings != null || timingsFormatted != null;
  const hasTimestamps = timestamps != null;
  const hasCookingTime = cookingTimeFormatted != null;

  return (
    <div className="space-y-4">
      {/* Order Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Utensils className="h-3 w-3" />
            Страва
          </div>
          <p className="font-medium">{menuItemName}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <FileText className="h-3 w-3" />
            Замовлення
          </div>
          <p className="font-medium">{orderNumber}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Table2 className="h-3 w-3" />
            Стіл
          </div>
          <p className="font-medium">{tableNumber}</p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <CheckCircle className="h-3 w-3" />
            Все замовлення готове
          </div>
          <p className="font-medium">{orderReady ? "Так" : "Ні"}</p>
        </div>
      </div>

      {/* Time Tracking */}
      {hasTimings && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            Хронометраж
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {timings?.queueTimeSeconds !== undefined && (
              <div className="bg-warning/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-warning">
                  {timingsFormatted?.queueTime ||
                    formatDurationSeconds(timings.queueTimeSeconds)}
                </p>
                <p className="text-xs text-muted-foreground">В черзі</p>
              </div>
            )}
            {timings?.cookingTimeSeconds !== undefined && (
              <div className="bg-orange-100 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {timingsFormatted?.cookingTime ||
                    formatDurationSeconds(timings.cookingTimeSeconds)}
                </p>
                <p className="text-xs text-muted-foreground">Приготування</p>
              </div>
            )}
            {timings?.pickupWaitSeconds !== undefined && (
              <div className="bg-info/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-info">
                  {timingsFormatted?.pickupWait ||
                    formatDurationSeconds(timings.pickupWaitSeconds)}
                </p>
                <p className="text-xs text-muted-foreground">Очікування видачі</p>
              </div>
            )}
            {timings?.totalTimeSeconds !== undefined && (
              <div className="bg-success/10 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-success">
                  {timingsFormatted?.totalTime ||
                    formatDurationSeconds(timings.totalTimeSeconds)}
                </p>
                <p className="text-xs text-muted-foreground">Загальний час</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamps */}
      {hasTimestamps && timestamps && (
        <div className="bg-muted/30 rounded-lg p-3">
          <h4 className="text-xs font-medium mb-2 text-muted-foreground">Мітки часу</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {timestamps.createdAt && (
              <div>
                <span className="text-muted-foreground">Створено:</span>
                <p className="font-mono">
                  {new Date(timestamps.createdAt).toLocaleTimeString("uk-UA")}
                </p>
              </div>
            )}
            {timestamps.startedAt && (
              <div>
                <span className="text-muted-foreground">Почато:</span>
                <p className="font-mono">
                  {new Date(timestamps.startedAt).toLocaleTimeString("uk-UA")}
                </p>
              </div>
            )}
            {timestamps.completedAt && (
              <div>
                <span className="text-muted-foreground">Готово:</span>
                <p className="font-mono">
                  {new Date(timestamps.completedAt).toLocaleTimeString("uk-UA")}
                </p>
              </div>
            )}
            {timestamps.servedAt && (
              <div>
                <span className="text-muted-foreground">Подано:</span>
                <p className="font-mono">
                  {new Date(timestamps.servedAt).toLocaleTimeString("uk-UA")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cooking time for complete action */}
      {hasCookingTime && (
        <div className="bg-success/10 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-success">{cookingTimeFormatted}</p>
          <p className="text-sm text-muted-foreground">Час приготування</p>
        </div>
      )}
    </div>
  );
}

// ==========================================
// INVENTORY RELEASE (CANCEL/FAIL)
// ==========================================

interface InventoryReleaseDetailsProps {
  metadata: Record<string, unknown>;
}

export function InventoryReleaseDetails({ metadata }: InventoryReleaseDetailsProps) {
  const releasedItems = metadata.releasedItems as ReleasedItem[] | undefined;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-warning/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-warning">
            {(metadata.movementsReversed as number) || 0}
          </p>
          <p className="text-xs text-muted-foreground">Рухів скасовано</p>
        </div>
        <div className="bg-success/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-success">
            {(metadata.batchesRestored as number) || 0}
          </p>
          <p className="text-xs text-muted-foreground">Партій відновлено</p>
        </div>
        <div className="bg-info/10 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-info">
            {(metadata.ingredientsRestored as number) || 0}
          </p>
          <p className="text-xs text-muted-foreground">Інгредієнтів</p>
        </div>
        <div className="bg-muted rounded-lg p-3 text-center">
          <p className="text-2xl font-bold">
            {(metadata.totalQuantityRestored as number)?.toFixed(3) || "0"}
          </p>
          <p className="text-xs text-muted-foreground">Повернуто одиниць</p>
        </div>
      </div>

      {/* Reason */}
      <div className="bg-error/5 border border-error/20 rounded-lg p-3">
        <p className="text-sm font-medium text-error">
          Причина: {(metadata.reason as string) || "Не вказано"}
        </p>
      </div>

      {/* Released items */}
      {releasedItems && releasedItems.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-success" />
            Повернуті позиції
          </h4>
          <div className="space-y-2">
            {releasedItems.map((item, idx) => (
              <div
                key={idx}
                className="bg-muted/20 rounded-lg p-2 flex items-center justify-between text-sm"
              >
                <span>{item.ingredientName}</span>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    {item.batchNumber}
                  </Badge>
                  <span className="font-mono text-xs">
                    +{item.quantity} {item.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// GENERIC METADATA VIEW
// ==========================================

interface GenericMetadataProps {
  metadata: Record<string, unknown>;
}

export function GenericMetadata({ metadata }: GenericMetadataProps) {
  const simpleEntries = Object.entries(metadata).filter(
    ([, value]) => typeof value !== "object" || value === null
  );

  if (simpleEntries.length === 0) return null;

  return (
    <div className="bg-muted/30 rounded-lg p-3">
      <h4 className="text-xs font-medium mb-2 text-muted-foreground">
        Додаткова інформація
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
        {simpleEntries.map(([key, value]) => (
          <div key={key}>
            <span className="text-muted-foreground">{key}:</span>
            <span className="ml-1 font-mono">{String(value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
