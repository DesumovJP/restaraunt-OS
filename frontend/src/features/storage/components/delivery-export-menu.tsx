"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, Mail, Copy, FileSpreadsheet, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import type { DeliveryOrder, DeliverySupplier } from "@/types/delivery";

interface DeliveryExportMenuProps {
  order: DeliveryOrder;
  supplier?: DeliverySupplier;
  disabled?: boolean;
}

const UNIT_LABELS: Record<string, string> = {
  kg: "кг",
  g: "г",
  l: "л",
  ml: "мл",
  pcs: "шт",
  portion: "порц",
};

/**
 * Export order to CSV file
 */
function exportToCSV(order: DeliveryOrder, supplier?: DeliverySupplier) {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel
  let csv = BOM;

  // Header
  csv += "Замовлення на поставку\n";
  csv += `Дата:,${new Date().toLocaleDateString("uk-UA")}\n`;
  csv += `Постачальник:,${supplier?.name || "-"}\n`;
  if (supplier?.phone) {
    csv += `Телефон:,${supplier.phone}\n`;
  }
  if (supplier?.email) {
    csv += `Email:,${supplier.email}\n`;
  }
  csv += "\n";

  // Table header
  csv += "№,Назва,SKU,Од.,Кількість\n";

  // Items
  order.items.forEach((item, idx) => {
    const name = (item.nameUk || item.name).replace(/,/g, ";"); // Escape commas
    const unit = UNIT_LABELS[item.unit] || item.unit;
    csv += `${idx + 1},"${name}",${item.sku || "-"},${unit},${item.quantity}\n`;
  });

  // Total count
  csv += `\n,,,Всього позицій:,${order.items.length}\n`;

  // Download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const date = new Date().toLocaleDateString("uk-UA").replace(/\./g, "-");
  link.href = URL.createObjectURL(blob);
  link.download = `замовлення-поставка-${date}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);

  toast.success("CSV файл завантажено");
}

/**
 * Format order for text/email
 */
function formatOrderText(order: DeliveryOrder, supplier?: DeliverySupplier): string {
  const date = new Date().toLocaleDateString("uk-UA");

  let text = `ЗАМОВЛЕННЯ НА ПОСТАВКУ\n`;
  text += `Дата: ${date}\n`;
  if (supplier?.name) {
    text += `Постачальник: ${supplier.name}\n`;
  }
  text += `\n`;
  text += `СПИСОК ТОВАРІВ:\n`;
  text += `${"─".repeat(40)}\n`;

  order.items.forEach((item, idx) => {
    const name = item.nameUk || item.name;
    const unit = UNIT_LABELS[item.unit] || item.unit;
    text += `${idx + 1}. ${name} — ${item.quantity} ${unit}\n`;
  });

  text += `${"─".repeat(40)}\n`;
  text += `Всього позицій: ${order.items.length}\n`;

  return text;
}

/**
 * Send order via email (mailto)
 */
function sendByEmail(order: DeliveryOrder, supplier?: DeliverySupplier) {
  const date = new Date().toLocaleDateString("uk-UA");
  const subject = encodeURIComponent(`Замовлення на поставку від ${date}`);
  const body = encodeURIComponent(formatOrderText(order, supplier));

  const mailtoUrl = `mailto:${supplier?.email || ""}?subject=${subject}&body=${body}`;
  window.open(mailtoUrl);
}

/**
 * Copy order to clipboard
 */
async function copyToClipboard(order: DeliveryOrder, supplier?: DeliverySupplier) {
  const text = formatOrderText(order, supplier);

  try {
    await navigator.clipboard.writeText(text);
    toast.success("Скопійовано в буфер обміну");
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    toast.success("Скопійовано в буфер обміну");
  }
}

export function DeliveryExportMenu({ order, supplier, disabled }: DeliveryExportMenuProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await copyToClipboard(order, supplier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isEmpty = order.items.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isEmpty}
          className="gap-2 h-10 rounded-xl"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Експорт</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => exportToCSV(order, supplier)} className="gap-3">
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <div>
            <p className="font-medium">Завантажити CSV</p>
            <p className="text-xs text-muted-foreground">Для Excel/Google Sheets</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => sendByEmail(order, supplier)} className="gap-3">
          <Mail className="h-4 w-4 text-blue-600" />
          <div>
            <p className="font-medium">Надіслати Email</p>
            <p className="text-xs text-muted-foreground">
              {supplier?.email || "Відкрити поштовий клієнт"}
            </p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleCopy} className="gap-3">
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <Copy className="h-4 w-4 text-slate-600" />
          )}
          <div>
            <p className="font-medium">Копіювати текст</p>
            <p className="text-xs text-muted-foreground">Для Viber/Telegram</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Standalone buttons for mobile view
 */
export function DeliveryExportButtons({ order, supplier, disabled }: DeliveryExportMenuProps) {
  const [copied, setCopied] = React.useState(false);
  const isEmpty = order.items.length === 0;

  const handleCopy = async () => {
    await copyToClipboard(order, supplier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => exportToCSV(order, supplier)}
        disabled={disabled || isEmpty}
        className="h-10 w-10 rounded-xl"
        title="Завантажити CSV"
      >
        <Download className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={() => sendByEmail(order, supplier)}
        disabled={disabled || isEmpty}
        className="h-10 w-10 rounded-xl"
        title="Надіслати Email"
      >
        <Mail className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="icon"
        onClick={handleCopy}
        disabled={disabled || isEmpty}
        className="h-10 w-10 rounded-xl"
        title="Копіювати"
      >
        {copied ? (
          <Check className="h-4 w-4 text-emerald-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
