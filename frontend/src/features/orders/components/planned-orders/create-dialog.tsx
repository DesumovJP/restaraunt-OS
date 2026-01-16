"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  Users,
  CreditCard,
  Cake,
  PartyPopper,
  User,
  Baby,
} from "lucide-react";
import { useTableStore, type TableStore } from "@/stores/table-store";
import type { Table } from "@/types/table";
import {
  useScheduledOrdersStore,
  type EventType,
  type SeatingArea,
  type MenuPreset,
} from "@/stores/scheduled-orders-store";
import {
  EVENT_TYPES,
  SEATING_AREAS,
  MENU_PRESETS,
} from "./config";
import { calculatePrepTime, getInitialFormData } from "./utils";
import type { CreateDialogProps, CreateOrderFormData } from "./types";

/**
 * Dialog for creating new scheduled orders
 */
export function CreateDialog({
  open,
  onOpenChange,
  onSuccess,
  selectedDate,
}: CreateDialogProps) {
  const [activeTab, setActiveTab] = React.useState("basic");
  const [formData, setFormData] = React.useState<CreateOrderFormData>(getInitialFormData);

  // Tables store
  const tables = useTableStore((s: TableStore) => s.tables);
  const addScheduledOrder = useScheduledOrdersStore((state) => state.addOrder);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      const initial = getInitialFormData();
      setFormData({
        ...initial,
        date: selectedDate?.toISOString().split("T")[0] || initial.date,
      });
      setActiveTab("basic");
    }
  }, [open, selectedDate]);

  // Auto-calculate prep time when service time changes
  React.useEffect(() => {
    if (formData.time && !formData.prepTime) {
      const calculatedPrepTime = calculatePrepTime(formData.eventType, formData.time);
      setFormData((prev) => ({ ...prev, prepTime: calculatedPrepTime }));
    }
  }, [formData.time, formData.eventType]);

  const handleSubmit = () => {
    if (!formData.tableNumber || !formData.date || !formData.time || !formData.prepTime) {
      return;
    }

    const scheduledFor = new Date(`${formData.date}T${formData.time}`).toISOString();
    const prepStartAt = new Date(`${formData.date}T${formData.prepTime}`).toISOString();

    // Find table by number to get documentId
    const tableNumber = parseInt(formData.tableNumber, 10);
    const selectedTable = tables.find((t: Table) => t.number === tableNumber);
    const tableId = selectedTable?.documentId || selectedTable?.id || `table_${tableNumber}`;

    addScheduledOrder({
      tableNumber,
      tableId,
      items: [],
      totalAmount: 0,
      scheduledFor,
      prepStartAt,
      notes: formData.notes,
      guestCount: parseInt(formData.guestCount, 10) || 2,
      // HoReCa fields
      eventType: formData.eventType,
      eventName: formData.eventName || undefined,
      seatingArea: formData.seatingArea,
      adultsCount: parseInt(formData.adultsCount, 10) || undefined,
      childrenCount: parseInt(formData.childrenCount, 10) || undefined,
      menuPreset: formData.menuPreset,
      contact: formData.contactPhone
        ? {
            name: formData.contactName,
            phone: formData.contactPhone,
            email: formData.contactEmail || undefined,
            company: formData.contactCompany || undefined,
          }
        : undefined,
      depositAmount: formData.depositAmount
        ? parseFloat(formData.depositAmount)
        : undefined,
      paymentStatus: formData.depositAmount ? "deposit_paid" : "pending",
      decorations: formData.decorations || undefined,
      cakeDetails: formData.cakeDetails || undefined,
      assignedCoordinator: formData.assignedCoordinator || undefined,
    });

    onOpenChange(false);
    onSuccess?.();
  };

  const updateField = <K extends keyof CreateOrderFormData>(
    field: K,
    value: CreateOrderFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            Нове бронювання / подія
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="text-xs sm:text-sm">
              Основне
            </TabsTrigger>
            <TabsTrigger value="guests" className="text-xs sm:text-sm">
              Гості
            </TabsTrigger>
            <TabsTrigger value="contact" className="text-xs sm:text-sm">
              Контакт
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs sm:text-sm">
              Деталі
            </TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4 mt-4">
            {/* Event Type */}
            <div>
              <Label className="text-sm font-medium">Тип події</Label>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {(Object.entries(EVENT_TYPES) as [EventType, (typeof EVENT_TYPES)[EventType]][]).map(
                  ([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateField("eventType", type)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-xs",
                          formData.eventType === type
                            ? "bg-purple-50 border-purple-300 text-purple-700"
                            : "bg-background hover:bg-muted"
                        )}
                      >
                        <Icon className={cn("h-4 w-4", config.color)} />
                        <span className="truncate w-full text-center">
                          {config.label}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Event Name (for non-regular events) */}
            {formData.eventType !== "regular" && (
              <div>
                <Label htmlFor="event-name" className="text-sm font-medium">
                  Назва події
                </Label>
                <Input
                  id="event-name"
                  placeholder="Напр. День народження Марії"
                  value={formData.eventName}
                  onChange={(e) => updateField("eventName", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            )}

            {/* Table & Seating Area */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="table-select" className="text-sm font-medium">
                  Столик
                </Label>
                <select
                  id="table-select"
                  value={formData.tableNumber}
                  onChange={(e) => updateField("tableNumber", e.target.value)}
                  className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Оберіть столик...</option>
                  {tables.map((table: Table) => (
                    <option key={table.id} value={table.number}>
                      Столик {table.number} ({table.capacity} місць)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="seating-area" className="text-sm font-medium">
                  Зона
                </Label>
                <select
                  id="seating-area"
                  value={formData.seatingArea}
                  onChange={(e) =>
                    updateField("seatingArea", e.target.value as SeatingArea)
                  }
                  className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {(Object.entries(SEATING_AREAS) as [SeatingArea, string][]).map(
                    ([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="order-date" className="text-sm font-medium">
                  Дата
                </Label>
                <Input
                  id="order-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateField("date", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="order-time" className="text-sm font-medium">
                  Час прибуття
                </Label>
                <Input
                  id="order-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => {
                    updateField("time", e.target.value);
                    const prepTime = calculatePrepTime(
                      formData.eventType,
                      e.target.value
                    );
                    updateField("prepTime", prepTime);
                  }}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label
                  htmlFor="prep-time"
                  className="text-sm font-medium flex items-center gap-1"
                >
                  <Clock className="h-3.5 w-3.5" />
                  Старт кухні
                </Label>
                <Input
                  id="prep-time"
                  type="time"
                  value={formData.prepTime}
                  onChange={(e) => updateField("prepTime", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Menu Preset */}
            <div>
              <Label className="text-sm font-medium">Тип меню</Label>
              <div className="grid grid-cols-5 gap-2 mt-1.5">
                {(Object.entries(MENU_PRESETS) as [MenuPreset, string][]).map(
                  ([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateField("menuPreset", key)}
                      className={cn(
                        "p-2 rounded-lg border transition-all text-xs",
                        formData.menuPreset === key
                          ? "bg-purple-50 border-purple-300 text-purple-700"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
          </TabsContent>

          {/* Guests Tab */}
          <TabsContent value="guests" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label
                  htmlFor="guest-count"
                  className="text-sm font-medium flex items-center gap-1"
                >
                  <Users className="h-3.5 w-3.5" />
                  Всього гостей
                </Label>
                <Input
                  id="guest-count"
                  type="number"
                  min="1"
                  max="200"
                  value={formData.guestCount}
                  onChange={(e) => updateField("guestCount", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label
                  htmlFor="adults-count"
                  className="text-sm font-medium flex items-center gap-1"
                >
                  <User className="h-3.5 w-3.5" />
                  Дорослих
                </Label>
                <Input
                  id="adults-count"
                  type="number"
                  min="0"
                  value={formData.adultsCount}
                  onChange={(e) => updateField("adultsCount", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label
                  htmlFor="children-count"
                  className="text-sm font-medium flex items-center gap-1"
                >
                  <Baby className="h-3.5 w-3.5" />
                  Дітей
                </Label>
                <Input
                  id="children-count"
                  type="number"
                  min="0"
                  value={formData.childrenCount}
                  onChange={(e) => updateField("childrenCount", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="order-notes" className="text-sm font-medium">
                Примітки та побажання
              </Label>
              <Textarea
                id="order-notes"
                placeholder="Особливі побажання, алергії, дієтичні обмеження..."
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                className="mt-1.5"
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="contact-name" className="text-sm font-medium">
                  Ім'я контактної особи *
                </Label>
                <Input
                  id="contact-name"
                  placeholder="Марія Петренко"
                  value={formData.contactName}
                  onChange={(e) => updateField("contactName", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="contact-phone" className="text-sm font-medium">
                  Телефон *
                </Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  placeholder="+380 XX XXX XX XX"
                  value={formData.contactPhone}
                  onChange={(e) => updateField("contactPhone", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="contact-email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="email@example.com"
                  value={formData.contactEmail}
                  onChange={(e) => updateField("contactEmail", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="contact-company" className="text-sm font-medium">
                  Компанія (для корпоративів)
                </Label>
                <Input
                  id="contact-company"
                  placeholder="Назва компанії"
                  value={formData.contactCompany}
                  onChange={(e) => updateField("contactCompany", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Deposit */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label
                  htmlFor="deposit"
                  className="text-sm font-medium flex items-center gap-1"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                  Завдаток (грн)
                </Label>
                <Input
                  id="deposit"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.depositAmount}
                  onChange={(e) => updateField("depositAmount", e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="coordinator" className="text-sm font-medium">
                  Відповідальний
                </Label>
                <Input
                  id="coordinator"
                  placeholder="Ім'я менеджера/офіціанта"
                  value={formData.assignedCoordinator}
                  onChange={(e) =>
                    updateField("assignedCoordinator", e.target.value)
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4 mt-4">
            {formData.eventType === "birthday" && (
              <div>
                <Label
                  htmlFor="cake-details"
                  className="text-sm font-medium flex items-center gap-1"
                >
                  <Cake className="h-3.5 w-3.5 text-pink-600" />
                  Деталі торту
                </Label>
                <Input
                  id="cake-details"
                  placeholder="Шоколадний торт з написом 'З Днем народження!'"
                  value={formData.cakeDetails}
                  onChange={(e) => updateField("cakeDetails", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            )}

            <div>
              <Label
                htmlFor="decorations"
                className="text-sm font-medium flex items-center gap-1"
              >
                <PartyPopper className="h-3.5 w-3.5 text-purple-600" />
                Декорації
              </Label>
              <Textarea
                id="decorations"
                placeholder="Кульки, банер, квіти на стіл..."
                value={formData.decorations}
                onChange={(e) => updateField("decorations", e.target.value)}
                className="mt-1.5"
                rows={2}
              />
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
              <p className="font-medium mb-1">Підсумок бронювання:</p>
              <ul className="space-y-1">
                <li>• Тип: {EVENT_TYPES[formData.eventType].label}</li>
                <li>• Дата: {formData.date || "Не вказано"}</li>
                <li>• Час: {formData.time || "Не вказано"}</li>
                <li>• Гостей: {formData.guestCount}</li>
                <li>• Зона: {SEATING_AREAS[formData.seatingArea]}</li>
                {formData.depositAmount && (
                  <li>• Завдаток: {formData.depositAmount} грн</li>
                )}
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-4 mt-4">
          <Button
            onClick={handleSubmit}
            disabled={
              !formData.tableNumber ||
              !formData.date ||
              !formData.time ||
              !formData.prepTime
            }
            className="w-full h-11 bg-purple-600 hover:bg-purple-700 text-base font-medium rounded-xl"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Створити бронювання
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
