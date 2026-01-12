"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Clock,
  Users,
  Send,
  Split,
  MoreHorizontal,
  Printer,
  MessageSquare,
  CheckCircle2,
  DoorOpen,
  CreditCard,
  Banknote,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { authFetch } from "@/stores/auth-store";
import { OrderProvider, useOrderContext, useCourseTimings } from "@/hooks/use-order";
import { useOrderDetails } from "@/hooks/use-graphql-orders";
import { useTableEvents } from "@/hooks/use-websocket";
import { OrderItemCard, OrderItemsList } from "@/features/orders/order-item-card";
import { CourseSelector, CourseBadge } from "@/features/orders/course-selector";
import { CommentEditor } from "@/features/orders/comment-editor";
import { TableTimer, CourseTimeline } from "@/features/tables/table-timer";
import { BillSplitPanel } from "@/features/billing/bill-split-panel";
import type { OrderItemStatus, CourseType, ItemComment, BillSplit } from "@/types/extended";
import type { UndoReasonCode } from "@/types/fsm";

function OrderDetailContent() {
  const router = useRouter();
  const params = useParams();
  const documentId = params.documentId as string;

  const {
    order,
    isLoading,
    error,
    updateItemStatus,
    undoItemStatus,
    updateItemCourse,
    updateItemComment,
    submitOrder,
  } = useOrderContext();

  // Get tableDocumentId from GraphQL (extended order doesn't have it)
  const { order: graphqlOrder } = useOrderDetails(documentId);
  const tableDocumentId = graphqlOrder?.table?.documentId;

  // Comment editor state
  const [editingCommentItemId, setEditingCommentItemId] = React.useState<string | null>(null);
  const [courseEditorItemId, setCourseEditorItemId] = React.useState<string | null>(null);
  const [showBillSplit, setShowBillSplit] = React.useState(false);

  // Close table state
  const [showCloseDialog, setShowCloseDialog] = React.useState(false);
  const [closingTable, setClosingTable] = React.useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = React.useState<"cash" | "card">("cash");
  const [tipAmount, setTipAmount] = React.useState<string>("");
  const [closeError, setCloseError] = React.useState<string | null>(null);

  // Course timings
  const courseTimings = useCourseTimings(
    order?.items.map((item) => ({
      courseType: item.courseType,
      status: item.status,
      prepStartAt: item.prepStartAt,
      servedAt: item.servedAt,
    })) || []
  );

  // Real-time updates
  useTableEvents(order?.tableNumber || 0, {
    onItemStatusChanged: (event) => {
      console.log("Item status changed:", event);
    },
    onTimerSync: (event) => {
      console.log("Timer sync:", event);
    },
    onSLAWarning: (event) => {
      console.log("SLA warning:", event);
    },
  });

  // Handlers
  const handleStatusChange = async (itemDocumentId: string, newStatus: OrderItemStatus) => {
    try {
      await updateItemStatus(itemDocumentId, newStatus);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleUndo = async (
    itemDocumentId: string,
    reason: UndoReasonCode,
    customReason?: string
  ) => {
    try {
      await undoItemStatus(itemDocumentId, reason, customReason);
    } catch (err) {
      console.error("Failed to undo:", err);
    }
  };

  const handleCommentSave = async (comment: ItemComment | null) => {
    if (!editingCommentItemId) return;
    try {
      await updateItemComment(editingCommentItemId, comment);
      setEditingCommentItemId(null);
    } catch (err) {
      console.error("Failed to save comment:", err);
    }
  };

  const handleCourseChange = async (courseType: CourseType) => {
    if (!courseEditorItemId || !order) return;
    const item = order.items.find((i) => i.documentId === courseEditorItemId);
    if (!item) return;

    // Calculate new course index
    const sameCourseitems = order.items.filter(
      (i) => i.courseType === courseType && i.documentId !== courseEditorItemId
    );
    const newIndex = sameCourseitems.length;

    try {
      await updateItemCourse(courseEditorItemId, courseType, newIndex);
      setCourseEditorItemId(null);
    } catch (err) {
      console.error("Failed to update course:", err);
    }
  };

  const handleBillSplitConfirm = (split: BillSplit) => {
    console.log("Bill split confirmed:", split);
    // Would save to API
  };

  // Close table handler
  const handleCloseTable = async () => {
    if (!tableDocumentId) {
      setCloseError("Не вдалося знайти столик");
      return;
    }

    setClosingTable(true);
    setCloseError(null);

    try {
      const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
      const response = await authFetch(`${STRAPI_URL}/api/tables/${tableDocumentId}/close`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod: selectedPaymentMethod,
          tipAmount: tipAmount ? parseFloat(tipAmount) : 0,
          notes: null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Не вдалося закрити столик");
      }

      const data = await response.json();
      console.log("[Order] Table closed:", data);

      // Navigate back to tables view
      setShowCloseDialog(false);
      router.push("/pos/waiter");
    } catch (err) {
      console.error("[Order] Failed to close table:", err);
      setCloseError(err instanceof Error ? err.message : "Не вдалося закрити столик");
    } finally {
      setClosingTable(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="container mx-auto p-4">
        <Card className="p-8 text-center">
          <p className="text-danger mb-4">{error || "Замовлення не знайдено"}</p>
          <Button onClick={() => router.back()}>Повернутися</Button>
        </Card>
      </div>
    );
  }

  const editingItem = order.items.find((i) => i.documentId === editingCommentItemId);
  const courseEditItem = order.items.find((i) => i.documentId === courseEditorItemId);

  // Calculate totals
  const subtotal = order.items.reduce(
    (sum, item) => sum + item.menuItem.price * item.quantity,
    0
  );
  const taxRate = 0.2; // 20% VAT
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Items for bill split
  const billSplitItems = order.items.map((item) => ({
    documentId: item.documentId,
    name: item.menuItem.name,
    price: item.menuItem.price,
    quantity: item.quantity,
  }));

  return (
    <div className="container mx-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Стіл {order.tableNumber}
              <Badge
                variant={
                  order.status === "preparing"
                    ? "default"
                    : order.status === "served"
                      ? "secondary"
                      : "outline"
                }
              >
                {order.status === "pending"
                  ? "Очікує"
                  : order.status === "confirmed"
                    ? "Підтверджено"
                    : order.status === "preparing"
                      ? "Готується"
                      : order.status === "ready"
                        ? "Готово"
                        : order.status === "served"
                          ? "Подано"
                          : "Скасовано"}
              </Badge>
            </h1>
            <p className="text-sm text-muted-foreground">
              #{order.slug} | {order.items.length} позицій
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-1.5" />
            Друк
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBillSplit(true)}
          >
            <Split className="h-4 w-4 mr-1.5" />
            Розділити
          </Button>
          {order.status === "pending" && (
            <Button onClick={submitOrder}>
              <Send className="h-4 w-4 mr-1.5" />
              Відправити на кухню
            </Button>
          )}
          {/* Close table button - show when order can be closed */}
          {order.status !== "pending" && order.status !== "cancelled" && tableDocumentId && (
            <Button
              variant="default"
              size="sm"
              className="bg-success hover:bg-success/90"
              onClick={() => setShowCloseDialog(true)}
            >
              <DoorOpen className="h-4 w-4 mr-1.5" />
              Закрити стіл
            </Button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Order items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Table timer card */}
          {order.tableStartAt && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Час обслуговування
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <TableTimer
                    tableNumber={order.tableNumber}
                    startedAt={order.tableStartAt}
                    elapsedMs={order.tableElapsedMs}
                    size="lg"
                    showLabel={false}
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {order.items.length} позицій
                  </div>
                </div>
                <CourseTimeline
                  courses={courseTimings.map((t) => ({
                    ...t,
                    itemCount: order.items.filter((i) => i.courseType === t.courseType)
                      .length,
                  }))}
                />
              </CardContent>
            </Card>
          )}

          {/* Order items list */}
          <OrderItemsList
            items={order.items.map((item) => ({
              ...item,
              menuItemName: item.menuItem.name,
              price: item.menuItem.price,
              comment: item.comment ?? null,
              prepElapsedMs: item.prepStartAt
                ? Date.now() - new Date(item.prepStartAt).getTime()
                : 0,
            }))}
            groupByCourse
            onStatusChange={handleStatusChange}
            onUndo={handleUndo}
            onEditComment={setEditingCommentItemId}
            onEditCourse={setCourseEditorItemId}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Підсумок</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Підсумок:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ПДВ (20%):</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                <span>Загалом:</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>

              {order.splitConfig && (
                <div className="pt-2 border-t">
                  <Badge variant="secondary" className="gap-1">
                    <Split className="h-3 w-3" />
                    Рахунок розділено
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Waiter info */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Офіціант #{order.waiterId}</p>
                  <p className="text-xs text-muted-foreground">Обслуговуючий персонал</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardContent className="pt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {order.items.filter((i) => i.status === "served").length}
                </p>
                <p className="text-xs text-muted-foreground">Подано</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">
                  {
                    order.items.filter((i) =>
                      ["sent", "cooking", "plating"].includes(i.status)
                    ).length
                  }
                </p>
                <p className="text-xs text-muted-foreground">Готується</p>
              </div>
            </CardContent>
          </Card>

          {/* Undo history (if any) */}
          {order.undoHistory.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Історія відкатів</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {order.undoHistory.slice(-5).map((entry, idx) => (
                    <div
                      key={idx}
                      className="text-xs p-2 rounded bg-muted/50"
                    >
                      <p className="font-medium">{entry.reason}</p>
                      <p className="text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString("uk-UA")}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Comment editor modal */}
      {editingItem && (
        <CommentEditor
          value={editingItem.comment ?? null}
          onChange={handleCommentSave}
          menuItemName={editingItem.menuItem.name}
          tableAllergens={[]}
          isOpen={!!editingCommentItemId}
          onClose={() => setEditingCommentItemId(null)}
        />
      )}

      {/* Course selector modal */}
      {courseEditItem && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="w-full max-w-md p-4">
            <CardHeader>
              <CardTitle>Змінити курс</CardTitle>
              <p className="text-sm text-muted-foreground">
                {courseEditItem.menuItem.name}
              </p>
            </CardHeader>
            <CardContent>
              <CourseSelector
                value={courseEditItem.courseType}
                onChange={handleCourseChange}
              />
            </CardContent>
            <div className="flex justify-end gap-2 p-4 pt-0">
              <Button
                variant="outline"
                onClick={() => setCourseEditorItemId(null)}
              >
                Скасувати
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Bill split modal */}
      <BillSplitPanel
        orderDocumentId={order.documentId}
        items={billSplitItems}
        subtotal={subtotal}
        taxRate={taxRate}
        tipPercent={0}
        isOpen={showBillSplit}
        onClose={() => setShowBillSplit(false)}
        onConfirm={handleBillSplitConfirm}
      />

      {/* Close table dialog */}
      <Dialog open={showCloseDialog} onOpenChange={(open) => {
        setShowCloseDialog(open);
        if (!open) {
          setTipAmount("");
          setCloseError(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DoorOpen className="h-5 w-5" />
              Закрити стіл {order.tableNumber}
            </DialogTitle>
            <DialogDescription>
              Оберіть спосіб оплати та підтвердіть закриття столу.
              Всі замовлення будуть позначені як оплачені.
            </DialogDescription>
          </DialogHeader>

          {/* Order summary */}
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Позицій:</span>
                <span>{order.items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Підсумок:</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ПДВ (20%):</span>
                <span>{formatPrice(tax)}</span>
              </div>
              <div className="flex justify-between font-semibold pt-2 border-t">
                <span>До сплати:</span>
                <span className="text-primary">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Payment method selector */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Спосіб оплати:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={selectedPaymentMethod === "cash" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedPaymentMethod("cash")}
                >
                  <Banknote className="h-4 w-4 mr-2" />
                  Готівка
                </Button>
                <Button
                  variant={selectedPaymentMethod === "card" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedPaymentMethod("card")}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Картка
                </Button>
              </div>
            </div>

            {/* Tip amount input */}
            <div className="space-y-2">
              <Label htmlFor="tipAmount" className="text-sm font-medium">
                Чайові (₴)
              </Label>
              <Input
                id="tipAmount"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                className="text-lg"
              />
              {tipAmount && parseFloat(tipAmount) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Загалом з чайовими: {formatPrice(total + parseFloat(tipAmount))}
                </p>
              )}
            </div>

            {closeError && (
              <div className="p-3 bg-danger/10 text-danger text-sm rounded-lg">
                {closeError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowCloseDialog(false)}
              disabled={closingTable}
            >
              Скасувати
            </Button>
            <Button
              onClick={handleCloseTable}
              disabled={closingTable}
              className="bg-success hover:bg-success/90"
            >
              {closingTable ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Закриваю...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Підтвердити оплату
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams();
  const documentId = params.documentId as string;

  return (
    <OrderProvider orderDocumentId={documentId}>
      <OrderDetailContent />
    </OrderProvider>
  );
}
