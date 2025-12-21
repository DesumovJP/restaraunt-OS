"use client";

import * as React from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Package,
  Search,
  Clock,
  TrendingDown,
  FileDown,
  CheckCircle2,
  AlertCircle,
  Truck,
} from "lucide-react";
import type { StorageBatch, BatchStatus } from "@/types/extended";

// ==========================================
// MOCK BATCHES DATA
// ==========================================

const today = new Date();
const formatDate = (daysOffset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
};

export const MOCK_BATCHES: StorageBatch[] = [
  // Сьогоднішні поставки
  {
    documentId: 'batch_001',
    slug: 'pork-shoulder-001',
    productId: 'prod_001',
    productName: 'Свинина (лопатка)',
    yieldProfileId: 'yield_pork',
    grossIn: 25,
    unitCost: 185,
    totalCost: 4625,
    supplierId: 'supplier_001',
    invoiceNumber: 'INV-2024-1201',
    receivedAt: formatDate(0),
    expiryDate: formatDate(5),
    batchNumber: 'B-001-1221',
    processes: [],
    netAvailable: 25,
    usedAmount: 0,
    wastedAmount: 0,
    status: 'received',
  },
  {
    documentId: 'batch_002',
    slug: 'chicken-whole-001',
    productId: 'prod_003',
    productName: 'Курка (ціла)',
    yieldProfileId: 'yield_chicken',
    grossIn: 30,
    unitCost: 98,
    totalCost: 2940,
    supplierId: 'supplier_002',
    invoiceNumber: 'INV-2024-1202',
    receivedAt: formatDate(0),
    expiryDate: formatDate(4),
    batchNumber: 'B-002-1221',
    processes: [],
    netAvailable: 30,
    usedAmount: 0,
    wastedAmount: 0,
    status: 'received',
  },
  {
    documentId: 'batch_003',
    slug: 'salmon-fillet-001',
    productId: 'prod_005',
    productName: 'Лосось (філе)',
    yieldProfileId: 'yield_salmon',
    grossIn: 8,
    unitCost: 820,
    totalCost: 6560,
    supplierId: 'supplier_003',
    invoiceNumber: 'INV-2024-1203',
    receivedAt: formatDate(0),
    expiryDate: formatDate(3),
    batchNumber: 'B-003-1221',
    processes: [],
    netAvailable: 8,
    usedAmount: 0,
    wastedAmount: 0,
    status: 'received',
  },
  {
    documentId: 'batch_004',
    slug: 'potato-001',
    productId: 'prod_007',
    productName: 'Картопля',
    yieldProfileId: 'yield_potato',
    grossIn: 50,
    unitCost: 18,
    totalCost: 900,
    supplierId: 'supplier_004',
    invoiceNumber: 'INV-2024-1204',
    receivedAt: formatDate(0),
    expiryDate: formatDate(30),
    batchNumber: 'B-004-1221',
    processes: [],
    netAvailable: 50,
    usedAmount: 0,
    wastedAmount: 0,
    status: 'received',
  },
  {
    documentId: 'batch_005',
    slug: 'tomatoes-001',
    productId: 'prod_010',
    productName: 'Помідори',
    yieldProfileId: 'yield_potato',
    grossIn: 15,
    unitCost: 95,
    totalCost: 1425,
    supplierId: 'supplier_004',
    invoiceNumber: 'INV-2024-1205',
    receivedAt: formatDate(0),
    expiryDate: formatDate(7),
    batchNumber: 'B-005-1221',
    processes: [],
    netAvailable: 15,
    usedAmount: 0,
    wastedAmount: 0,
    status: 'received',
  },
  // Вчорашні (частково оброблені)
  {
    documentId: 'batch_006',
    slug: 'beef-tenderloin-001',
    productId: 'prod_002',
    productName: 'Яловичина (вирізка)',
    yieldProfileId: 'yield_beef',
    grossIn: 12,
    unitCost: 480,
    totalCost: 5760,
    supplierId: 'supplier_001',
    invoiceNumber: 'INV-2024-1195',
    receivedAt: formatDate(-1),
    expiryDate: formatDate(4),
    batchNumber: 'B-006-1220',
    processes: [
      {
        documentId: 'proc_001',
        processType: 'portioning',
        processedAt: formatDate(-1),
        operatorId: 'chef_001',
        operatorName: 'Олександр К.',
        grossInput: 12,
        netOutput: 8.64,
        wasteOutput: 3.36,
        expectedYield: 0.72,
        actualYield: 0.72,
        variancePercent: 0,
      }
    ],
    netAvailable: 6.5,
    usedAmount: 2.14,
    wastedAmount: 3.36,
    status: 'in_use',
  },
  {
    documentId: 'batch_007',
    slug: 'duck-whole-001',
    productId: 'prod_004',
    productName: 'Качка (ціла)',
    yieldProfileId: 'yield_duck',
    grossIn: 8,
    unitCost: 290,
    totalCost: 2320,
    supplierId: 'supplier_002',
    invoiceNumber: 'INV-2024-1196',
    receivedAt: formatDate(-1),
    expiryDate: formatDate(3),
    batchNumber: 'B-007-1220',
    processes: [],
    netAvailable: 8,
    usedAmount: 0,
    wastedAmount: 0,
    status: 'available',
  },
  // Позавчорашні
  {
    documentId: 'batch_008',
    slug: 'shrimp-001',
    productId: 'prod_006',
    productName: 'Креветки тигрові',
    yieldProfileId: 'yield_shrimp',
    grossIn: 5,
    unitCost: 520,
    totalCost: 2600,
    supplierId: 'supplier_003',
    invoiceNumber: 'INV-2024-1190',
    receivedAt: formatDate(-2),
    expiryDate: formatDate(0),
    batchNumber: 'B-008-1219',
    processes: [
      {
        documentId: 'proc_002',
        processType: 'cleaning',
        processedAt: formatDate(-2),
        operatorId: 'chef_002',
        operatorName: 'Марія С.',
        grossInput: 5,
        netOutput: 2.25,
        wasteOutput: 2.75,
        expectedYield: 0.45,
        actualYield: 0.45,
        variancePercent: 0,
      }
    ],
    netAvailable: 0.5,
    usedAmount: 1.75,
    wastedAmount: 2.75,
    status: 'in_use',
  },
];

// ==========================================
// BATCH STATUS CONFIG
// ==========================================

const BATCH_STATUS_CONFIG: Record<BatchStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'warning' }> = {
  received: { label: 'Отримано', variant: 'default' },
  processed: { label: 'Оброблено', variant: 'secondary' },
  in_use: { label: 'В роботі', variant: 'outline' },
  processing: { label: 'Обробляється', variant: 'warning' },
  available: { label: 'Доступно', variant: 'secondary' },
  depleted: { label: 'Вичерпано', variant: 'outline' },
  expired: { label: 'Прострочено', variant: 'destructive' },
  written_off: { label: 'Списано', variant: 'destructive' },
};

// ==========================================
// COMPONENT PROPS
// ==========================================

interface BatchesListProps {
  onCloseShift: () => void;
  className?: string;
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function BatchesList({ onCloseShift, className }: BatchesListProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<BatchStatus | 'all'>('all');

  // Filter batches
  const filteredBatches = React.useMemo(() => {
    let result = [...MOCK_BATCHES];

    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        b =>
          b.productName?.toLowerCase().includes(query) ||
          b.batchNumber?.toLowerCase().includes(query) ||
          b.invoiceNumber?.toLowerCase().includes(query)
      );
    }

    return result.sort((a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    );
  }, [statusFilter, searchQuery]);

  // Today's batches
  const todaysBatches = React.useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return MOCK_BATCHES.filter(b => new Date(b.receivedAt) >= todayStart);
  }, []);

  // Calculate totals
  const todaysTotals = React.useMemo(() => {
    return todaysBatches.reduce(
      (acc, batch) => ({
        count: acc.count + 1,
        totalCost: acc.totalCost + batch.totalCost,
        totalWeight: acc.totalWeight + batch.grossIn,
      }),
      { count: 0, totalCost: 0, totalWeight: 0 }
    );
  }, [todaysBatches]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Today's summary */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <span className="font-medium">Поставки сьогодні</span>
            </div>
            <Badge variant="default">{todaysTotals.count} партій</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Загальна вага:</span>
              <span className="ml-2 font-medium">{todaysTotals.totalWeight} кг</span>
            </div>
            <div>
              <span className="text-muted-foreground">Загальна сума:</span>
              <span className="ml-2 font-medium">{todaysTotals.totalCost.toLocaleString()} грн</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Close shift button */}
      <Button
        onClick={onCloseShift}
        className="w-full gap-2"
        variant="outline"
      >
        <FileDown className="h-4 w-4" />
        Закрити зміну та експортувати
      </Button>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('all')}
        >
          Всі
        </Button>
        <Button
          variant={statusFilter === 'received' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('received')}
        >
          Отримано
        </Button>
        <Button
          variant={statusFilter === 'in_use' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('in_use')}
        >
          В роботі
        </Button>
        <Button
          variant={statusFilter === 'available' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setStatusFilter('available')}
        >
          Доступно
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Пошук по назві, номеру партії..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Batches list */}
      {filteredBatches.length === 0 ? (
        <EmptyState
          type="inventory"
          title="Немає партій"
          description="Партії з'являться після отримання поставок"
        />
      ) : (
        <div className="space-y-3">
          {filteredBatches.map((batch) => (
            <BatchCard key={batch.documentId} batch={batch} />
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================
// BATCH CARD COMPONENT
// ==========================================

interface BatchCardProps {
  batch: StorageBatch;
  onSelect?: (batch: StorageBatch) => void;
}

function BatchCard({ batch, onSelect }: BatchCardProps) {
  const statusConfig = BATCH_STATUS_CONFIG[batch.status];
  const isExpiringSoon = batch.expiryDate &&
    new Date(batch.expiryDate) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
  const isToday = new Date(batch.receivedAt).toDateString() === new Date().toDateString();

  const usagePercent = batch.grossIn > 0
    ? ((batch.usedAmount + batch.wastedAmount) / batch.grossIn) * 100
    : 0;

  return (
    <Card
      className={cn(
        "transition-all cursor-pointer hover:shadow-card-hover active:scale-[0.99]",
        isToday && "border-primary/50",
        isExpiringSoon && "border-warning"
      )}
      onClick={() => onSelect?.(batch)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "relative w-12 h-12 shrink-0 rounded-lg flex items-center justify-center",
            isToday ? "bg-primary/10" : "bg-muted"
          )}>
            <Package className={cn(
              "h-5 w-5",
              isToday ? "text-primary" : "text-muted-foreground"
            )} />
            {isToday && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium truncate">{batch.productName}</h3>
                  <Badge variant={statusConfig.variant} className="h-5 text-xs">
                    {statusConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {batch.batchNumber} | {batch.invoiceNumber}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-lg font-bold">{batch.grossIn} кг</div>
                <div className="text-xs text-muted-foreground">
                  {batch.totalCost.toLocaleString()} грн
                </div>
              </div>
            </div>

            {/* Usage bar */}
            {usagePercent > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Використано: {batch.usedAmount.toFixed(1)} кг</span>
                  <span>Залишок: {batch.netAvailable.toFixed(1)} кг</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(new Date(batch.receivedAt))}
              </span>
              {batch.expiryDate && (
                <span className={cn(
                  "flex items-center gap-1",
                  isExpiringSoon && "text-warning"
                )}>
                  {isExpiringSoon ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <CheckCircle2 className="h-3 w-3" />
                  )}
                  До: {new Date(batch.expiryDate).toLocaleDateString('uk-UA')}
                </span>
              )}
              {batch.processes.length > 0 && (
                <span className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  {batch.processes.length} обробок
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
