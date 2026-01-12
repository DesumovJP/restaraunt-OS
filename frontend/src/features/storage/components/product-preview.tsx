"use client";

import * as React from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import {
  X,
  Pencil,
  MinusCircle,
  Trash2,
  Thermometer,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Layers,
  DollarSign,
  Scale,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getProductStatus, getStatusDetails } from "./status-indicator";
import { MOCK_BATCHES } from "../mock-data";
import type { ExtendedProduct, StorageBatch } from "@/types/extended";
import { STORAGE_CONDITION_LABELS, STORAGE_SUB_CATEGORY_LABELS } from "@/types/extended";

// ==========================================
// TYPES
// ==========================================

interface ProductPreviewProps {
  product: ExtendedProduct | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (product: ExtendedProduct) => void;
  onUse?: (product: ExtendedProduct) => void;
  onWriteOff?: (product: ExtendedProduct) => void;
}

// ==========================================
// HELPERS
// ==========================================

function getDaysUntilExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate);
  const now = new Date();
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getExpiryStatus(expiryDate: string): "expired" | "critical" | "warning" | "ok" {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return "expired";
  if (days <= 1) return "critical";
  if (days <= 3) return "warning";
  return "ok";
}

function formatExpiryLabel(expiryDate: string): string {
  const days = getDaysUntilExpiry(expiryDate);
  if (days < 0) return `Прострочено ${Math.abs(days)} дн.`;
  if (days === 0) return "Сьогодні!";
  if (days === 1) return "Завтра";
  return `${days} дн.`;
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function SectionCard({
  title,
  icon: Icon,
  children,
  className,
  collapsible,
  defaultOpen = true,
}: {
  title: string;
  icon: typeof Package;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("bg-white rounded-xl border", className)}>
      <button
        type="button"
        onClick={() => collapsible && setIsOpen(!isOpen)}
        disabled={!collapsible}
        className={cn(
          "w-full px-4 py-3 border-b bg-slate-50/50 flex items-center justify-between",
          collapsible && "cursor-pointer hover:bg-slate-100/50 transition-colors"
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-500" />
          <h3 className="font-semibold text-sm text-slate-700">{title}</h3>
        </div>
        {collapsible && (
          isOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {isOpen && <div className="p-4">{children}</div>}
    </div>
  );
}

function MetricRow({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={cn("font-semibold text-sm", highlight && "text-blue-600")}>
        {value}
        {suffix && <span className="text-slate-400 font-normal ml-1">{suffix}</span>}
      </span>
    </div>
  );
}

function BatchCard({ batch, unit, compact }: { batch: StorageBatch; unit: string; compact?: boolean }) {
  const expiryStatus = batch.expiryDate ? getExpiryStatus(batch.expiryDate) : "ok";
  const expiryLabel = batch.expiryDate ? formatExpiryLabel(batch.expiryDate) : null;

  const expiryColors = {
    expired: "bg-red-100 text-red-700 border-red-200",
    critical: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    ok: "bg-green-100 text-green-700 border-green-200",
  };

  if (compact) {
    return (
      <div className="bg-white border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="font-semibold text-sm">{batch.batchNumber}</p>
            <p className="text-xs text-slate-500">№ {batch.invoiceNumber}</p>
          </div>
          {batch.expiryDate && (
            <Badge variant="outline" className={cn("text-xs", expiryColors[expiryStatus])}>
              {expiryLabel}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-blue-50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold text-blue-600">{batch.netAvailable.toFixed(1)}</p>
            <p className="text-xs text-slate-500">{unit}</p>
          </div>
          <div className="flex-1 bg-slate-100 rounded-lg p-2 text-center">
            <p className="text-lg font-bold">{batch.unitCost.toFixed(0)} ₴</p>
            <p className="text-xs text-slate-500">за {unit}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-slate-50 flex items-center justify-between">
        <div>
          <p className="font-semibold">{batch.batchNumber}</p>
          <p className="text-xs text-slate-500">Накладна: {batch.invoiceNumber}</p>
        </div>
        {batch.expiryDate && (
          <Badge variant="outline" className={cn("text-xs", expiryColors[expiryStatus])}>
            {expiryStatus !== "ok" && <AlertTriangle className="h-3 w-3 mr-1" />}
            {expiryStatus === "ok" && <CheckCircle2 className="h-3 w-3 mr-1" />}
            {expiryLabel}
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Main metrics */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{batch.netAvailable.toFixed(1)}</p>
            <p className="text-xs text-slate-600">Доступно ({unit})</p>
          </div>
          <div className="bg-slate-100 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold">{batch.unitCost.toFixed(0)} ₴</p>
            <p className="text-xs text-slate-600">за {unit}</p>
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Використано:</span>
            <span className="font-medium">{batch.usedAmount.toFixed(1)} {unit}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Списано:</span>
            <span className="font-medium">{batch.wastedAmount.toFixed(1)} {unit}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-50 border-t text-xs text-slate-500 flex justify-between">
        <span>Отримано: {new Date(batch.receivedAt).toLocaleDateString("uk-UA")}</span>
        {batch.expiryDate && (
          <span>До: {new Date(batch.expiryDate).toLocaleDateString("uk-UA")}</span>
        )}
      </div>
    </div>
  );
}

// ==========================================
// CONTENT COMPONENT (shared between Dialog and Drawer)
// ==========================================

function ProductPreviewContent({
  product,
  onClose,
  onEdit,
  onUse,
  onWriteOff,
  isMobile,
}: ProductPreviewProps & { isMobile: boolean }) {
  if (!product) return null;

  const status = getProductStatus(product);
  const statusDetails = getStatusDetails(product);

  // Get batches for this product
  const productBatches = MOCK_BATCHES.filter(
    (b) => b.productId === product.documentId || b.productName === product.name
  ).sort((a, b) => {
    if (a.netAvailable > 0 && b.netAvailable <= 0) return -1;
    if (a.netAvailable <= 0 && b.netAvailable > 0) return 1;
    if (a.expiryDate && b.expiryDate) {
      return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    }
    return 0;
  });

  const storageCondition = STORAGE_CONDITION_LABELS[product.storageCondition] || {
    uk: "Кімнатна",
    tempRange: "15-25°C",
  };

  const subCategoryLabel = STORAGE_SUB_CATEGORY_LABELS[product.subCategory] || {
    uk: product.subCategory || "Інше",
  };

  // Calculations
  const totalAvailable = productBatches.reduce((sum, b) => sum + b.netAvailable, 0);
  const totalValue = productBatches.reduce((sum, b) => sum + (b.netAvailable * b.unitCost), 0);
  const stockPercent = product.maxStock > 0 ? Math.round((product.currentStock / product.maxStock) * 100) : 0;
  const avgUnitCost = totalAvailable > 0 ? totalValue / totalAvailable : product.costPerUnit;

  return (
    <div className="flex flex-col h-full">
      {/* ===== HEADER ===== */}
      <div className="px-4 md:px-6 py-4 border-b flex-shrink-0 bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg md:text-xl font-bold truncate">{product.name}</h2>
              <Badge variant="outline" className="font-mono text-xs flex-shrink-0">
                {product.sku}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="truncate">{product.category}</span>
              <span>→</span>
              <span className="truncate">{subCategoryLabel.uk}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Alert Banner */}
        {statusDetails.length > 0 && (
          <div
            className={cn(
              "mt-3 px-3 py-2 rounded-lg flex items-start gap-2",
              status === "critical" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
            )}
          >
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Потребує уваги</p>
              <ul className="mt-1 text-xs space-y-0.5">
                {statusDetails.map((detail, i) => (
                  <li key={i} className="truncate">• {detail}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ===== CONTENT ===== */}
      {isMobile ? (
        // Mobile: Single column scrollable layout
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Quick Stats - Always visible at top */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{totalAvailable.toFixed(1)}</p>
                <p className="text-xs text-slate-600">Всього ({product.unit})</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{totalValue.toFixed(0)} ₴</p>
                <p className="text-xs text-slate-600">Вартість</p>
              </div>
            </div>

            {/* Stock Level Bar */}
            <div className="bg-white rounded-xl border p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">Рівень запасу</span>
                <span className="font-semibold">{stockPercent}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    stockPercent > 50 ? "bg-green-500" : stockPercent > 25 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${Math.min(stockPercent, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>{product.minStock} {product.unit}</span>
                <span className="font-medium text-slate-700">{product.currentStock} {product.unit}</span>
                <span>{product.maxStock} {product.unit}</span>
              </div>
            </div>

            {/* Collapsible Info Sections */}
            <SectionCard title="Умови зберігання" icon={Thermometer} collapsible defaultOpen={false}>
              <div className="space-y-0 divide-y divide-slate-100">
                <MetricRow label="Температура" value={storageCondition.tempRange} />
                <MetricRow label="Тип" value={storageCondition.uk} />
                {product.shelfLifeDays && (
                  <MetricRow label="Термін" value={`${product.shelfLifeDays} днів`} />
                )}
              </div>
            </SectionCard>

            <SectionCard title="Ціноутворення" icon={DollarSign} collapsible defaultOpen={false}>
              <div className="space-y-0 divide-y divide-slate-100">
                <MetricRow label="Базова ціна" value={`${product.costPerUnit.toFixed(2)} ₴`} suffix={`/${product.unit}`} />
                <MetricRow label="Сер. ціна" value={`${avgUnitCost.toFixed(2)} ₴`} />
                {product.yieldProfile && (
                  <MetricRow label="Вихід" value={`${Math.round(product.yieldProfile.baseYieldRatio * 100)}%`} />
                )}
              </div>
            </SectionCard>

            {/* Batches */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-400" />
                  Партії
                </h3>
                <Badge variant="secondary" className="text-xs">{productBatches.length}</Badge>
              </div>

              {productBatches.length > 0 ? (
                <div className="space-y-3">
                  {productBatches.map((batch) => (
                    <BatchCard key={batch.documentId} batch={batch} unit={product.unit} compact />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed rounded-xl bg-slate-50">
                  <Package className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium text-slate-600">Немає партій</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Desktop/Tablet: Two-column layout
        <div className="flex-1 overflow-hidden flex">
          {/* LEFT SIDEBAR - Product Info */}
          <div className="w-[280px] lg:w-[320px] flex-shrink-0 border-r bg-slate-50/70 overflow-y-auto p-4 space-y-4">
            {/* Overview Stats */}
            <SectionCard title="Огляд" icon={Info}>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xl lg:text-2xl font-bold text-blue-600">{totalAvailable.toFixed(1)}</p>
                  <p className="text-xs text-slate-600">Всього ({product.unit})</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xl lg:text-2xl font-bold text-green-600">{totalValue.toFixed(0)} ₴</p>
                  <p className="text-xs text-slate-600">Вартість</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t">
                <MetricRow label="Партій" value={productBatches.length} />
                <MetricRow label="Сер. ціна" value={`${avgUnitCost.toFixed(2)} ₴`} />
              </div>
            </SectionCard>

            {/* Stock Level */}
            <SectionCard title="Рівень запасу" icon={Scale}>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-500">Заповненість</span>
                  <span className="font-semibold">{stockPercent}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      stockPercent > 50 ? "bg-green-500" : stockPercent > 25 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${Math.min(stockPercent, 100)}%` }}
                  />
                </div>
              </div>
              <div className="space-y-0 divide-y divide-slate-100">
                <MetricRow label="Поточний" value={product.currentStock} suffix={product.unit} highlight />
                <MetricRow label="Мінімум" value={product.minStock} suffix={product.unit} />
                <MetricRow label="Максимум" value={product.maxStock} suffix={product.unit} />
              </div>
            </SectionCard>

            {/* Storage Conditions */}
            <SectionCard title="Зберігання" icon={Thermometer}>
              <div className="space-y-0 divide-y divide-slate-100">
                <MetricRow label="Температура" value={storageCondition.tempRange} />
                <MetricRow label="Тип" value={storageCondition.uk} />
                {product.shelfLifeDays && (
                  <MetricRow label="Термін" value={`${product.shelfLifeDays} днів`} />
                )}
              </div>
            </SectionCard>

            {/* Pricing */}
            <SectionCard title="Ціна" icon={DollarSign}>
              <div className="space-y-0 divide-y divide-slate-100">
                <MetricRow label="Базова" value={`${product.costPerUnit.toFixed(2)} ₴`} suffix={`/${product.unit}`} />
                {product.yieldProfile && (
                  <MetricRow label="Вихід" value={`${Math.round(product.yieldProfile.baseYieldRatio * 100)}%`} />
                )}
              </div>
            </SectionCard>

            {/* Last Updated */}
            <div className="text-xs text-slate-400 flex items-center gap-1.5 px-1">
              <Clock className="h-3.5 w-3.5" />
              {formatRelativeTime(new Date(product.lastUpdated))}
            </div>
          </div>

          {/* RIGHT SIDE - Batches */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Layers className="h-5 w-5 text-slate-400" />
                Партії поставок
              </h3>
              <Badge variant="secondary">{productBatches.length} партій</Badge>
            </div>

            {productBatches.length > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
                {productBatches.map((batch) => (
                  <BatchCard key={batch.documentId} batch={batch} unit={product.unit} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 border-2 border-dashed rounded-xl bg-slate-50">
                <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-lg font-medium text-slate-600">Немає партій</p>
                <p className="text-sm text-slate-500 mt-1">Створіть нову поставку</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== FOOTER ===== */}
      <div className="px-4 md:px-6 py-3 md:py-4 border-t bg-white flex-shrink-0 safe-bottom">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="hidden sm:block text-xs text-slate-400 truncate">
            ID: <span className="font-mono">{product.documentId}</span>
          </div>
          <div className="flex gap-2 sm:gap-3">
            {onEdit && (
              <Button variant="outline" size={isMobile ? "sm" : "default"} className="flex-1 sm:flex-none" onClick={() => onEdit(product)}>
                <Pencil className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Редагувати</span>
                <span className="sm:hidden">Ред.</span>
              </Button>
            )}
            {onWriteOff && (
              <Button
                variant="outline"
                size={isMobile ? "sm" : "default"}
                className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onWriteOff(product)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Списати</span>
                <span className="sm:hidden">Спис.</span>
              </Button>
            )}
            {onUse && (
              <Button size={isMobile ? "sm" : "default"} className="flex-1 sm:flex-none" onClick={() => onUse(product)}>
                <MinusCircle className="h-4 w-4 mr-1.5" />
                <span>Використати</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN COMPONENT
// ==========================================

export function ProductPreview({
  product,
  open,
  onClose,
  onEdit,
  onUse,
  onWriteOff,
}: ProductPreviewProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");

  if (!product) return null;

  // Mobile: Use Drawer from bottom with gap
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
        <DrawerContent side="bottom" className="h-[85vh] rounded-t-[20px] p-0">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>
          <ProductPreviewContent
            product={product}
            open={open}
            onClose={onClose}
            onEdit={onEdit}
            onUse={onUse}
            onWriteOff={onWriteOff}
            isMobile={true}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop/Tablet: Use Dialog
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="!max-w-[95vw] !w-[1100px] h-[90vh] p-0 gap-0 flex flex-col overflow-hidden"
        hideCloseButton
      >
        <ProductPreviewContent
          product={product}
          open={open}
          onClose={onClose}
          onEdit={onEdit}
          onUse={onUse}
          onWriteOff={onWriteOff}
          isMobile={false}
        />
      </DialogContent>
    </Dialog>
  );
}
