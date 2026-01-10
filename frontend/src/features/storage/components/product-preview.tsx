"use client";

import * as React from "react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  X,
  ChevronDown,
  Pencil,
  MinusCircle,
  Trash2,
  Thermometer,
  TrendingDown,
  Package,
  Clock,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { StockOverview } from "./stock-bar";
import { StatusBadge, getProductStatus, getStatusDetails } from "./status-indicator";
import type { ExtendedProduct } from "@/types/extended";
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

interface RecentHistoryItem {
  id: string;
  type: "use" | "receive" | "adjust" | "write_off";
  quantity: number;
  unit: string;
  timestamp: string;
  note?: string;
}

// ==========================================
// COLLAPSIBLE SECTION
// ==========================================

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: React.ReactNode;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        {title}
      </h4>
      {children}
    </div>
  );
}

function CollapsibleSection({ title, children, defaultOpen = false, badge }: SectionProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium hover:text-foreground transition-colors">
        <span className="flex items-center gap-2">
          {title}
          {badge}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

// ==========================================
// MOCK HISTORY (Replace with real data)
// ==========================================

function getMockHistory(productId: string): RecentHistoryItem[] {
  return [
    {
      id: "1",
      type: "use",
      quantity: 2.5,
      unit: "кг",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      note: "Замовлення #124",
    },
    {
      id: "2",
      type: "receive",
      quantity: 15,
      unit: "кг",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      note: "Партія B-001",
    },
    {
      id: "3",
      type: "use",
      quantity: 3.2,
      unit: "кг",
      timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

// ==========================================
// HISTORY ITEM
// ==========================================

const HISTORY_TYPE_CONFIG = {
  use: { icon: ArrowUpCircle, color: "text-orange-500", label: "Використано" },
  receive: { icon: ArrowDownCircle, color: "text-green-500", label: "Отримано" },
  adjust: { icon: Package, color: "text-blue-500", label: "Коригування" },
  write_off: { icon: Trash2, color: "text-red-500", label: "Списано" },
};

function HistoryItem({ item }: { item: RecentHistoryItem }) {
  const config = HISTORY_TYPE_CONFIG[item.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium">
            {item.type === "use" ? "-" : "+"}{item.quantity} {item.unit}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(new Date(item.timestamp))}
          </span>
        </div>
        {item.note && (
          <p className="text-xs text-muted-foreground truncate">{item.note}</p>
        )}
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
  if (!product) return null;

  const status = getProductStatus(product);
  const statusDetails = getStatusDetails(product);
  const history = getMockHistory(product.documentId);

  const storageCondition =
    STORAGE_CONDITION_LABELS[product.storageCondition] || {
      uk: "Кімнатна",
      tempRange: "15-25°C",
    };

  const subCategoryLabel =
    STORAGE_SUB_CATEGORY_LABELS[product.subCategory] || {
      uk: product.subCategory || "Інше",
    };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent side="right" className="w-full sm:w-[420px] flex flex-col">
        {/* Header */}
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 pr-4">
              <DrawerTitle className="text-xl truncate">
                {product.name}
              </DrawerTitle>
              <DrawerDescription className="flex items-center gap-2 mt-1">
                <span>{product.sku}</span>
                <span className="text-muted-foreground">•</span>
                <span>{product.category} → {subCategoryLabel.uk}</span>
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <X className="h-4 w-4" />
              </Button>
            </DrawerClose>
          </div>

          {/* Status alert */}
          {statusDetails.length > 0 && (
            <div
              className={cn(
                "mt-4 p-3 rounded-lg text-sm",
                status === "critical"
                  ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
              )}
            >
              <div className="flex items-center gap-2">
                <StatusBadge status={status} />
              </div>
              <ul className="mt-1 space-y-0.5 text-xs">
                {statusDetails.map((detail, i) => (
                  <li key={i}>• {detail}</li>
                ))}
              </ul>
            </div>
          )}
        </DrawerHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stock Overview */}
          <Section title="Запас">
            <StockOverview
              current={product.currentStock}
              min={product.minStock}
              max={product.maxStock}
              unit={product.unit}
            />
          </Section>

          {/* Storage Conditions - Collapsible */}
          <CollapsibleSection title="Умови зберігання">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Thermometer className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{storageCondition.uk}</div>
                  <div className="text-xs text-muted-foreground">
                    {storageCondition.tempRange}
                  </div>
                </div>
              </div>
              {product.expiryDate && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">Термін придатності</span>
                  <span className="font-medium">
                    {new Date(product.expiryDate).toLocaleDateString("uk-UA")}
                  </span>
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* Yield Profile - Collapsible */}
          {product.yieldProfile && (
            <CollapsibleSection
              title="Профіль виходу"
              badge={
                <Badge variant="outline" className="text-xs">
                  {Math.round(product.yieldProfile.baseYieldRatio * 100)}%
                </Badge>
              }
            >
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="font-medium">
                      Базовий вихід: {Math.round(product.yieldProfile.baseYieldRatio * 100)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Очікувані втрати при обробці
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* Price Info */}
          <CollapsibleSection title="Вартість">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Ціна за одиницю</span>
                <span className="font-medium">
                  {product.costPerUnit.toFixed(2)} грн/{product.unit}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-muted-foreground">Загальна вартість</span>
                <span className="font-medium">
                  {(product.currentStock * product.costPerUnit).toFixed(2)} грн
                </span>
              </div>
            </div>
          </CollapsibleSection>

          {/* Recent Activity */}
          <Section title="Остання активність">
            {history.length > 0 ? (
              <div className="divide-y">
                {history.map((item) => (
                  <HistoryItem key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Немає активності</p>
            )}
          </Section>

          {/* Meta */}
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Clock className="h-3 w-3" />
            Оновлено: {formatRelativeTime(new Date(product.lastUpdated))}
          </div>
        </div>

        {/* Footer Actions */}
        <DrawerFooter className="border-t">
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onEdit(product)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Редагувати
              </Button>
            )}
            {onWriteOff && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onWriteOff(product)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Списати
              </Button>
            )}
          </div>
          {onUse && (
            <Button className="w-full" onClick={() => onUse(product)}>
              <MinusCircle className="h-4 w-4 mr-2" />
              Використати
            </Button>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
