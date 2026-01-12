"use client";

import * as React from "react";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Users,
  Split,
  UserPlus,
  UserMinus,
  Check,
  CreditCard,
  Banknote,
  Clock,
  X,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import type { BillSplit, SplitParticipant, SplitMode } from "@/types/extended";
import { calculateEvenSplit } from "@/lib/bill-split-calculator";

interface BillSplitPanelProps {
  orderDocumentId: string;
  items: Array<{
    documentId: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  subtotal: number;
  taxRate: number;
  tipPercent: number;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (split: BillSplit) => void;
}

export function BillSplitPanel({
  orderDocumentId,
  items,
  subtotal,
  taxRate,
  tipPercent,
  isOpen,
  onClose,
  onConfirm,
}: BillSplitPanelProps) {
  const [mode, setMode] = React.useState<SplitMode>("even");
  const [participantCount, setParticipantCount] = React.useState(2);
  const [participants, setParticipants] = React.useState<SplitParticipant[]>([]);
  const [itemAssignments, setItemAssignments] = React.useState<
    Record<string, string[]>
  >({});
  const [selectedPerson, setSelectedPerson] = React.useState<string | null>(
    null
  );

  // Initialize participants when count changes
  React.useEffect(() => {
    const newParticipants: SplitParticipant[] = Array.from(
      { length: participantCount },
      (_, i) => ({
        personId: `person_${i + 1}`,
        name: `Гість ${i + 1}`,
        share: 100 / participantCount,
        assignedItems: [],
        subtotal: 0,
        tax: 0,
        tip: 0,
        total: 0,
      })
    );
    setParticipants(newParticipants);
    setItemAssignments({});
    setSelectedPerson(newParticipants[0]?.personId || null);
  }, [participantCount]);

  // Calculate split based on mode - returns normalized structure with participants array and totals
  type CalculatedTotals = { subtotal: number; tax: number; tip: number; total: number; unassigned: number };
  const calculatedSplit = React.useMemo((): { participants: SplitParticipant[]; totals: CalculatedTotals } | null => {
    if (participants.length === 0) return null;

    const tax = subtotal * taxRate;
    const tip = subtotal * (tipPercent / 100);
    const total = subtotal + tax + tip;

    if (mode === "even") {
      const split = calculateEvenSplit(subtotal, participantCount, taxRate, tipPercent);
      const splitParticipants: SplitParticipant[] = participants.map((p, i) => {
        const isFirst = i === 0;
        const personSubtotal = Math.floor((subtotal / participantCount) * 100) / 100;
        return {
          ...p,
          subtotal: personSubtotal,
          tax: split.tax,
          tip: split.tip,
          total: isFirst ? split.perPerson + split.remainder : split.perPerson,
        };
      });
      return { participants: splitParticipants, totals: { subtotal, tax, tip, total, unassigned: 0 } };
    }

    if (mode === "by_items") {
      // Calculate totals per person based on item assignments
      let assignedTotal = 0;
      const splitParticipants: SplitParticipant[] = participants.map((p) => {
        let personSubtotal = 0;
        Object.entries(itemAssignments).forEach(([itemId, assignees]) => {
          if (assignees.includes(p.personId)) {
            const item = items.find((i) => i.documentId === itemId);
            if (item) {
              const share = 1 / assignees.length;
              personSubtotal += (item.price * item.quantity) * share;
            }
          }
        });
        assignedTotal += personSubtotal;

        const personTax = personSubtotal * taxRate;
        const personTip = personSubtotal * (tipPercent / 100);
        return {
          ...p,
          subtotal: personSubtotal,
          tax: personTax,
          tip: personTip,
          total: personSubtotal + personTax + personTip,
        };
      });
      const unassigned = subtotal - assignedTotal;
      return { participants: splitParticipants, totals: { subtotal, tax, tip, total, unassigned } };
    }

    return null;
  }, [
    mode,
    participantCount,
    participants,
    itemAssignments,
    subtotal,
    taxRate,
    tipPercent,
    items,
  ]);

  // Update participants with calculated values
  const updatedParticipants = React.useMemo(() => {
    if (!calculatedSplit) return participants;

    return participants.map((p) => {
      const splitPerson = calculatedSplit.participants.find(
        (sp) => sp.personId === p.personId
      );
      return splitPerson
        ? { ...p, ...splitPerson }
        : p;
    });
  }, [participants, calculatedSplit]);

  const handleAssignItem = (itemDocumentId: string) => {
    if (!selectedPerson) return;

    setItemAssignments((prev) => {
      const current = prev[itemDocumentId] || [];
      if (current.includes(selectedPerson)) {
        return {
          ...prev,
          [itemDocumentId]: current.filter((id) => id !== selectedPerson),
        };
      }
      return {
        ...prev,
        [itemDocumentId]: [...current, selectedPerson],
      };
    });
  };

  const handleConfirm = () => {
    if (!calculatedSplit) return;

    // Calculate totals from participants
    const totalSubtotal = updatedParticipants.reduce((sum, p) => sum + p.subtotal, 0);
    const totalTax = updatedParticipants.reduce((sum, p) => sum + p.tax, 0);
    const totalTip = updatedParticipants.reduce((sum, p) => sum + p.tip, 0);
    const totalAmount = updatedParticipants.reduce((sum, p) => sum + p.total, 0);

    const split: BillSplit = {
      documentId: `split_${Date.now()}`,
      slug: `split-${Date.now()}`,
      orderId: orderDocumentId,
      mode,
      participants: updatedParticipants,
      totals: {
        subtotal: totalSubtotal,
        tax: totalTax,
        tip: totalTip,
        total: totalAmount,
        unassigned: 0,
      },
      createdAt: new Date().toISOString(),
      createdBy: "current_user",
      status: "draft",
    };

    onConfirm(split);
    onClose();
  };

  const totalAssigned = Object.values(itemAssignments).reduce(
    (sum, assignees) => sum + (assignees.length > 0 ? 1 : 0),
    0
  );
  const allItemsAssigned = totalAssigned === items.length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Split className="h-5 w-5" />
            Розділити рахунок
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Mode selection */}
          <div className="flex gap-2">
            <ModeButton
              mode="even"
              currentMode={mode}
              onClick={() => setMode("even")}
              label="Порівну"
              description="Кожен платить однаково"
            />
            <ModeButton
              mode="by_items"
              currentMode={mode}
              onClick={() => setMode("by_items")}
              label="По стравах"
              description="Кожен платить за своє"
            />
          </div>

          {/* Participant count */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Кількість гостей:</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setParticipantCount(Math.max(2, participantCount - 1))}
                disabled={participantCount <= 2}
              >
                <UserMinus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold text-lg">
                {participantCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setParticipantCount(Math.min(10, participantCount + 1))}
                disabled={participantCount >= 10}
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* By items: Item assignment */}
          {mode === "by_items" && (
            <div className="grid grid-cols-2 gap-4">
              {/* Items list */}
              <div>
                <h4 className="text-sm font-medium mb-2">Страви</h4>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                  {items.map((item) => {
                    const assignees = itemAssignments[item.documentId] || [];
                    const isAssigned = assignees.length > 0;

                    return (
                      <button
                        key={item.documentId}
                        onClick={() => handleAssignItem(item.documentId)}
                        className={cn(
                          "w-full text-left p-2 rounded-lg border transition-all",
                          isAssigned
                            ? "bg-primary/5 border-primary"
                            : "border-border hover:border-primary/50"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                        {isAssigned && (
                          <div className="flex gap-1 mt-1">
                            {assignees.map((id) => (
                              <Badge
                                key={id}
                                variant="secondary"
                                className="text-[10px]"
                              >
                                {updatedParticipants.find((p) => p.personId === id)
                                  ?.name || id}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Participants list */}
              <div>
                <h4 className="text-sm font-medium mb-2">Гості</h4>
                <div className="space-y-1.5">
                  {updatedParticipants.map((participant) => (
                    <button
                      key={participant.personId}
                      onClick={() => setSelectedPerson(participant.personId)}
                      className={cn(
                        "w-full text-left p-2 rounded-lg border transition-all",
                        selectedPerson === participant.personId
                          ? "bg-primary/10 border-primary ring-2 ring-primary"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{participant.name}</span>
                        </div>
                        <span className="font-semibold">
                          {formatPrice(participant.total)}
                        </span>
                      </div>
                      {participant.assignedItems.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {participant.assignedItems.length} позицій
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Even split: Summary */}
          {mode === "even" && calculatedSplit && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Сума на кожного:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {updatedParticipants.map((participant) => (
                  <Card key={participant.personId} className="p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">
                        {participant.name}
                      </span>
                    </div>
                    <div className="text-lg font-bold">
                      {formatPrice(participant.total)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      (вкл. {formatPrice(participant.tax)} податок)
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Totals summary */}
          {calculatedSplit && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Підсумок:</span>
                    <span>{formatPrice(calculatedSplit.totals.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Податок:</span>
                    <span>{formatPrice(calculatedSplit.totals.tax)}</span>
                  </div>
                  {calculatedSplit.totals.tip > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Чайові:</span>
                      <span>{formatPrice(calculatedSplit.totals.tip)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-base pt-1.5 border-t">
                    <span>Загалом:</span>
                    <span>{formatPrice(calculatedSplit.totals.total)}</span>
                  </div>
                  {calculatedSplit.totals.unassigned > 0 && (
                    <div className="flex justify-between text-warning">
                      <span>Не призначено:</span>
                      <span>{formatPrice(calculatedSplit.totals.unassigned)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            onClick={handleConfirm}
            disabled={mode === "by_items" && !allItemsAssigned}
            className="w-full h-11 text-base font-medium rounded-xl"
          >
            <Check className="h-4 w-4 mr-1.5" />
            Підтвердити розділення
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Mode selection button
interface ModeButtonProps {
  mode: SplitMode;
  currentMode: SplitMode;
  onClick: () => void;
  label: string;
  description: string;
}

function ModeButton({
  mode,
  currentMode,
  onClick,
  label,
  description,
}: ModeButtonProps) {
  const isSelected = mode === currentMode;

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 p-3 rounded-lg border-2 transition-all text-left",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      <div className="flex items-center gap-2">
        {isSelected && <Check className="h-4 w-4 text-primary" />}
        <span className="font-medium">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </button>
  );
}

// Payment button component for individual payments
interface PaymentButtonProps {
  participant: SplitParticipant;
  onPay: (personId: string, method: "cash" | "card" | "paylater") => void;
}

export function PaymentButton({ participant, onPay }: PaymentButtonProps) {
  const [showMethods, setShowMethods] = React.useState(false);

  if (participant.paidAt) {
    return (
      <Badge variant="default" className="gap-1">
        <Check className="h-3 w-3" />
        Сплачено
      </Badge>
    );
  }

  if (showMethods) {
    return (
      <div className="flex gap-1">
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2"
          onClick={() => {
            onPay(participant.personId, "cash");
            setShowMethods(false);
          }}
        >
          <Banknote className="h-3 w-3 mr-1" />
          Готівка
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2"
          onClick={() => {
            onPay(participant.personId, "card");
            setShowMethods(false);
          }}
        >
          <CreditCard className="h-3 w-3 mr-1" />
          Картка
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          onClick={() => setShowMethods(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="default"
      className="h-7"
      onClick={() => setShowMethods(true)}
    >
      Сплатити {formatPrice(participant.total)}
      <ChevronRight className="h-3 w-3 ml-1" />
    </Button>
  );
}
