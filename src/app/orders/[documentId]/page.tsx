"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { cn, formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "lucide-react";
import { OrderProvider, useOrderContext, useCourseTimings } from "@/hooks/use-order";
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

  // Comment editor state
  const [editingCommentItemId, setEditingCommentItemId] = React.useState<string | null>(null);
  const [courseEditorItemId, setCourseEditorItemId] = React.useState<string | null>(null);
  const [showBillSplit, setShowBillSplit] = React.useState(false);

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
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const taxRate = 0.2; // 20% VAT
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Items for bill split
  const billSplitItems = order.items.map((item) => ({
    documentId: item.documentId,
    name: item.menuItemName,
    price: item.price,
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
                  order.status === "submitted"
                    ? "default"
                    : order.status === "completed"
                      ? "secondary"
                      : "outline"
                }
              >
                {order.status === "draft"
                  ? "Чернетка"
                  : order.status === "submitted"
                    ? "В роботі"
                    : order.status === "completed"
                      ? "Завершено"
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
          {order.status === "draft" && (
            <Button onClick={submitOrder}>
              <Send className="h-4 w-4 mr-1.5" />
              Відправити на кухню
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
                    {order.guestCount || 2} гостей
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
                  <p className="font-medium">{order.waiterName}</p>
                  <p className="text-xs text-muted-foreground">Офіціант</p>
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
          value={editingItem.comment}
          onChange={handleCommentSave}
          menuItemName={editingItem.menuItemName}
          tableAllergens={order.tableAllergens || []}
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
                {courseEditItem.menuItemName}
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
