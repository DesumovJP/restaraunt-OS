"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Clock,
  UserPlus,
  MoreVertical,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  Briefcase,
  CalendarDays,
  Timer,
} from "lucide-react";
import {
  useScheduleManagement,
  getWeekDates,
  isToday,
  formatTimeDisplay,
  formatMinutesToHours,
  SHIFT_TYPES,
  SHIFT_TYPE_COLORS,
  SHIFT_STATUS_COLORS,
  SHIFT_STATUS_LABELS,
  DEPARTMENTS,
  ROLE_LABELS,
  ROLE_COLORS,
  DEPARTMENT_LABELS,
  type Worker,
  type WorkerShift,
  type ShiftType,
  type ShiftStatus,
} from "@/hooks/use-schedule";
import { useScheduleStore, type ScheduleState } from "@/stores/schedule-store";

const DAYS_UK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Нд"];

export default function ScheduleManagementPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const weekDates = React.useMemo(() => getWeekDates(currentDate), [currentDate]);

  // Store state
  const selectedDepartment = useScheduleStore((s: ScheduleState) => s.selectedDepartment);
  const setSelectedDepartment = useScheduleStore((s: ScheduleState) => s.setSelectedDepartment);
  const showAddDialog = useScheduleStore((s: ScheduleState) => s.showAddDialog);
  const openAddDialog = useScheduleStore((s: ScheduleState) => s.openAddDialog);
  const closeAddDialog = useScheduleStore((s: ScheduleState) => s.closeAddDialog);
  const showEditDialog = useScheduleStore((s: ScheduleState) => s.showEditDialog);
  const openEditDialog = useScheduleStore((s: ScheduleState) => s.openEditDialog);
  const closeEditDialog = useScheduleStore((s: ScheduleState) => s.closeEditDialog);
  const editingShift = useScheduleStore((s: ScheduleState) => s.editingShift);
  const showDeleteConfirm = useScheduleStore((s: ScheduleState) => s.showDeleteConfirm);
  const openDeleteConfirm = useScheduleStore((s: ScheduleState) => s.openDeleteConfirm);
  const closeDeleteConfirm = useScheduleStore((s: ScheduleState) => s.closeDeleteConfirm);
  const deleteTargetShiftId = useScheduleStore((s: ScheduleState) => s.deleteTargetShiftId);
  const showWorkerDetails = useScheduleStore((s: ScheduleState) => s.showWorkerDetails);
  const openWorkerDetails = useScheduleStore((s: ScheduleState) => s.openWorkerDetails);
  const closeWorkerDetails = useScheduleStore((s: ScheduleState) => s.closeWorkerDetails);
  const selectedDate = useScheduleStore((s: ScheduleState) => s.selectedDate);

  // Hook data
  const {
    shifts,
    filteredWorkers,
    scheduleGrid,
    summaryByWorker,
    fetching,
    refetch,
    createShift,
    updateShift,
    deleteShift,
    checkConflict,
    workers,
  } = useScheduleManagement(weekDates, selectedDepartment);

  // Form state
  const [formWorker, setFormWorker] = React.useState<string>("");
  const [formShiftType, setFormShiftType] = React.useState<ShiftType>("morning");
  const [formStartTime, setFormStartTime] = React.useState<string>("");
  const [formEndTime, setFormEndTime] = React.useState<string>("");
  const [formDepartment, setFormDepartment] = React.useState<string>("kitchen");
  const [formNotes, setFormNotes] = React.useState<string>("");
  const [formStatus, setFormStatus] = React.useState<ShiftStatus>("scheduled");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Selected worker for details
  const selectedWorkerId = useScheduleStore((s: ScheduleState) => s.selectedWorkerId);
  const selectedWorkerSummary = selectedWorkerId ? summaryByWorker[selectedWorkerId] : null;

  // Navigation
  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Reset form
  const resetForm = () => {
    setFormWorker("");
    setFormShiftType("morning");
    setFormStartTime("");
    setFormEndTime("");
    setFormDepartment("kitchen");
    setFormNotes("");
    setFormStatus("scheduled");
    setFormError(null);
  };

  // Open add dialog with pre-filled date
  const handleOpenAddDialog = (dateStr: string, workerId?: string) => {
    resetForm();
    if (workerId) {
      setFormWorker(workerId);
      const worker = workers.find(w => w.documentId === workerId);
      if (worker?.department) {
        setFormDepartment(worker.department);
      }
    }
    openAddDialog(dateStr, workerId);
  };

  // Open edit dialog with shift data
  const handleOpenEditDialog = (shift: WorkerShift) => {
    setFormWorker(shift.worker?.documentId || "");
    setFormShiftType(shift.shiftType);
    setFormStartTime(formatTimeDisplay(shift.startTime));
    setFormEndTime(formatTimeDisplay(shift.endTime));
    setFormDepartment(shift.department || "kitchen");
    setFormNotes(shift.notes || "");
    setFormStatus(shift.status);
    setFormError(null);
    openEditDialog(shift);
  };

  // Add shift
  const handleAddShift = async () => {
    if (!formWorker || !selectedDate) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const shiftTypeConfig = SHIFT_TYPES.find(t => t.value === formShiftType);
      const startTime = formStartTime || shiftTypeConfig?.start || "09:00";
      const endTime = formEndTime || shiftTypeConfig?.end || "17:00";

      // Check for conflicts
      const conflict = checkConflict(formWorker, selectedDate, startTime, endTime);
      if (conflict?.type === "overlap") {
        setFormError(`Конфлікт: зміна перетинається з існуючою (${formatTimeDisplay(conflict.existingShift.startTime)}-${formatTimeDisplay(conflict.existingShift.endTime)})`);
        setIsSubmitting(false);
        return;
      }

      await createShift({
        worker: formWorker,
        date: selectedDate,
        startTime,
        endTime,
        shiftType: formShiftType,
        department: formDepartment,
        notes: formNotes || undefined,
        status: "scheduled",
      });

      closeAddDialog();
      resetForm();
      refetch();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Помилка при створенні зміни");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update shift
  const handleUpdateShift = async () => {
    if (!editingShift) return;

    setFormError(null);
    setIsSubmitting(true);

    try {
      const shiftTypeConfig = SHIFT_TYPES.find(t => t.value === formShiftType);
      const startTime = formStartTime || shiftTypeConfig?.start || "09:00";
      const endTime = formEndTime || shiftTypeConfig?.end || "17:00";

      // Check for conflicts (excluding current shift)
      const conflict = checkConflict(
        formWorker,
        editingShift.shift.date,
        startTime,
        endTime,
        editingShift.shift.documentId
      );
      if (conflict?.type === "overlap") {
        setFormError(`Конфлікт: зміна перетинається з існуючою (${formatTimeDisplay(conflict.existingShift.startTime)}-${formatTimeDisplay(conflict.existingShift.endTime)})`);
        setIsSubmitting(false);
        return;
      }

      await updateShift(editingShift.shift.documentId, {
        startTime,
        endTime,
        shiftType: formShiftType,
        department: formDepartment,
        notes: formNotes || undefined,
        status: formStatus,
      });

      closeEditDialog();
      resetForm();
      refetch();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Помилка при оновленні зміни");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete shift
  const handleDeleteShift = async () => {
    if (!deleteTargetShiftId) return;

    try {
      await deleteShift(deleteTargetShiftId);
      closeDeleteConfirm();
      refetch();
    } catch (error) {
      console.error("Failed to delete shift:", error);
    }
  };

  // Shift cell component
  const ShiftCell = ({ shift, compact = false }: { shift: WorkerShift; compact?: boolean }) => (
    <div
      className={`group relative text-[11px] p-1.5 rounded border-l-2 ${SHIFT_TYPE_COLORS[shift.shiftType]} ${SHIFT_STATUS_COLORS[shift.status]} cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all`}
      onClick={() => handleOpenEditDialog(shift)}
    >
      <div className="font-mono font-medium">
        {formatTimeDisplay(shift.startTime)}-{formatTimeDisplay(shift.endTime)}
      </div>
      {!compact && shift.notes && (
        <div className="text-[9px] opacity-70 truncate mt-0.5">{shift.notes}</div>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="absolute top-0.5 right-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-opacity"
          >
            <MoreVertical className="h-3 w-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleOpenEditDialog(shift)}>
            <Edit2 className="h-4 w-4 mr-2" />
            Редагувати
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => openDeleteConfirm(shift.documentId)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Видалити
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  // Worker card component
  const WorkerCard = ({ worker }: { worker: Worker }) => {
    const workerWeekShifts = weekDates.map(date => ({
      date,
      dateStr: date.toISOString().split("T")[0],
      shifts: scheduleGrid[date.toISOString().split("T")[0]]?.[worker.documentId] || []
    }));
    const totalShifts = workerWeekShifts.reduce((sum, d) => sum + d.shifts.length, 0);
    const totalMinutes = workerWeekShifts.reduce((sum, d) =>
      sum + d.shifts.reduce((sSum, s) => sSum + (s.scheduledMinutes || 0), 0), 0);

    return (
      <Card className="overflow-hidden">
        <CardHeader className="p-3 pb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => openWorkerDetails(worker.documentId)}
              className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium shrink-0 hover:bg-primary/20 transition-colors"
            >
              {worker.firstName?.[0] || worker.username?.[0] || "?"}
            </button>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => openWorkerDetails(worker.documentId)}
                className="font-semibold text-sm truncate hover:text-primary transition-colors text-left"
              >
                {worker.firstName} {worker.lastName}
              </button>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[worker.systemRole || "viewer"]}`}>
                  {ROLE_LABELS[worker.systemRole || "viewer"]}
                </span>
                {worker.department && (
                  <span className="text-[10px] text-muted-foreground">
                    {DEPARTMENT_LABELS[worker.department]}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <Badge variant="outline" className="text-[10px] h-5">
                <Clock className="h-3 w-3 mr-1" />
                {totalShifts} зм.
              </Badge>
              {totalMinutes > 0 && (
                <span className="text-[10px] text-muted-foreground">
                  {formatMinutesToHours(totalMinutes)}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-2 pt-0">
          {/* Week grid for this worker */}
          <div className="grid grid-cols-7 gap-1">
            {workerWeekShifts.map(({ date, dateStr, shifts: dayShifts }, i) => {
              const today = isToday(date);
              return (
                <div
                  key={i}
                  className={`min-h-[50px] p-1 rounded-lg text-center ${
                    today ? "bg-primary/10" : "bg-muted/30"
                  }`}
                >
                  <div className={`text-[10px] font-medium mb-0.5 ${today ? "text-primary" : "text-muted-foreground"}`}>
                    {DAYS_UK[i]}
                  </div>
                  {dayShifts.length > 0 ? (
                    <div className="space-y-0.5">
                      {dayShifts.map((shift) => (
                        <ShiftCell key={shift.documentId} shift={shift} compact />
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenAddDialog(dateStr, worker.documentId)}
                      className="w-full h-6 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-3 sm:px-4 py-3 safe-top">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link href="/dashboard/admin">
              <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 shrink-0">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">Графік змін</h1>
              <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Управління робочими змінами команди
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Schedule Toolbar */}
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b bg-background">
        {/* Left: Shift Types Legend */}
        <div className="hidden md:flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Типи змін:</span>
          {SHIFT_TYPES.map((type) => (
            <Badge key={type.value} variant="secondary" className={`text-[10px] px-2 py-0.5 ${SHIFT_TYPE_COLORS[type.value]}`}>
              {type.label}
            </Badge>
          ))}
        </div>

        {/* Center: Week Navigation */}
        <div className="flex items-center gap-0.5 rounded-xl border bg-muted/50 p-0.5">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={navigatePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5 px-2 py-1">
            <Calendar className="h-3.5 w-3.5 text-primary hidden sm:block" />
            <span className="font-semibold text-xs whitespace-nowrap">
              {weekDates[0].toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}
              {" — "}
              {weekDates[6].toLocaleDateString("uk-UA", { day: "numeric", month: "short" })}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Department Filter */}
        <div className="flex items-center gap-1.5">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs sm:text-sm rounded-xl">
              <Users className="h-3.5 w-3.5 text-muted-foreground mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept.value} value={dept.value}>
                  {dept.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-xl"
            onClick={() => refetch()}
            disabled={fetching}
          >
            <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <main className="flex-1 p-3 sm:p-4">

        {/* Mobile: Card-based Schedule View */}
        <div className="md:hidden space-y-3">
          {/* Day selector - horizontal scroll */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {weekDates.map((date, i) => {
              const today = isToday(date);
              const dateStr = date.toISOString().split("T")[0];
              const shiftsOnDay = filteredWorkers.reduce((count, worker) => {
                return count + (scheduleGrid[dateStr]?.[worker.documentId]?.length || 0);
              }, 0);

              return (
                <button
                  key={i}
                  onClick={() => handleOpenAddDialog(dateStr)}
                  className={`flex flex-col items-center min-w-[52px] p-2 rounded-xl border transition-all touch-feedback ${
                    today
                      ? "bg-primary/10 border-primary ring-2 ring-primary/20"
                      : "bg-card border-border hover:bg-muted/50"
                  }`}
                >
                  <span className={`text-xs font-medium ${today ? "text-primary" : "text-muted-foreground"}`}>
                    {DAYS_UK[i]}
                  </span>
                  <span className={`text-lg font-bold ${today ? "text-primary" : "text-foreground"}`}>
                    {date.getDate()}
                  </span>
                  {shiftsOnDay > 0 && (
                    <Badge variant="secondary" className="h-4 px-1 text-[10px] mt-0.5">
                      {shiftsOnDay}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>

          {/* Workers list with shifts */}
          {filteredWorkers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              Немає працівників
            </div>
          ) : (
            filteredWorkers.map((worker) => (
              <WorkerCard key={worker.documentId} worker={worker} />
            ))
          )}

          {/* Add shift FAB */}
          <Button
            onClick={() => handleOpenAddDialog(new Date().toISOString().split("T")[0])}
            className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg"
          >
            <UserPlus className="h-6 w-6" />
          </Button>
        </div>

        {/* Desktop: Table-based Schedule Grid */}
        <Card className="hidden md:block">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="p-3 text-left font-medium w-[200px]">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Працівник
                    </div>
                  </th>
                  {weekDates.map((date, i) => {
                    const today = isToday(date);
                    return (
                      <th
                        key={i}
                        className={`p-2 text-center font-medium ${today ? "bg-primary/10" : ""}`}
                      >
                        <div className="text-xs">{DAYS_UK[i]}</div>
                        <div className={`text-sm ${today ? "text-primary font-bold" : "text-muted-foreground"}`}>
                          {date.getDate()}.{date.getMonth() + 1}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-7 w-7 p-0"
                          onClick={() => handleOpenAddDialog(date.toISOString().split("T")[0])}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </th>
                    );
                  })}
                  <th className="p-2 text-center font-medium w-[80px]">
                    <Timer className="h-4 w-4 mx-auto" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                      Немає працівників
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => {
                    const summary = summaryByWorker[worker.documentId];
                    return (
                      <tr key={worker.documentId} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <button
                            onClick={() => openWorkerDetails(worker.documentId)}
                            className="flex items-center gap-2 text-left hover:bg-muted/50 -m-2 p-2 rounded-lg transition-colors w-full"
                          >
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium shrink-0">
                              {worker.firstName?.[0] || worker.username?.[0] || "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {worker.firstName} {worker.lastName}
                              </p>
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[worker.systemRole || "viewer"]}`}>
                                  {ROLE_LABELS[worker.systemRole || "viewer"]}
                                </span>
                              </div>
                            </div>
                          </button>
                        </td>
                        {weekDates.map((date, i) => {
                          const dateStr = date.toISOString().split("T")[0];
                          const workerShifts = scheduleGrid[dateStr]?.[worker.documentId] || [];
                          const today = isToday(date);

                          return (
                            <td
                              key={i}
                              className={`p-1.5 text-center ${today ? "bg-primary/5" : ""}`}
                            >
                              {workerShifts.length > 0 ? (
                                <div className="space-y-1">
                                  {workerShifts.map((shift) => (
                                    <ShiftCell key={shift.documentId} shift={shift} />
                                  ))}
                                </div>
                              ) : (
                                <button
                                  onClick={() => handleOpenAddDialog(dateStr, worker.documentId)}
                                  className="w-full h-8 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          );
                        })}
                        <td className="p-2 text-center">
                          <div className="text-xs font-medium">
                            {summary ? formatMinutesToHours(summary.totalMinutes) : "—"}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {summary?.totalShifts || 0} зм.
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>

      </main>

      {/* Add Shift Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => !open && closeAddDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Додати зміну на {selectedDate}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {formError}
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-2 block">Працівник</label>
              <Select value={formWorker} onValueChange={setFormWorker}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть працівника" />
                </SelectTrigger>
                <SelectContent>
                  {workers.filter(w => w.isActive !== false).map((worker) => (
                    <SelectItem key={worker.documentId} value={worker.documentId}>
                      <div className="flex items-center gap-2">
                        <span>{worker.firstName} {worker.lastName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${ROLE_COLORS[worker.systemRole || "viewer"]}`}>
                          {ROLE_LABELS[worker.systemRole || "viewer"]}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Тип зміни</label>
              <Select value={formShiftType} onValueChange={(v) => setFormShiftType(v as ShiftType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.labelFull}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Початок</label>
                <Input
                  type="time"
                  value={formStartTime || SHIFT_TYPES.find(t => t.value === formShiftType)?.start}
                  onChange={(e) => setFormStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Кінець</label>
                <Input
                  type="time"
                  value={formEndTime || SHIFT_TYPES.find(t => t.value === formShiftType)?.end}
                  onChange={(e) => setFormEndTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Відділ</label>
              <Select value={formDepartment} onValueChange={setFormDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.filter(d => d.value !== "all").map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Примітка</label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Додаткова інформація..."
                rows={2}
              />
            </div>
          </DialogBody>
          <DialogFooter className="border-t pt-4">
            <Button
              onClick={handleAddShift}
              disabled={!formWorker || isSubmitting}
              className="w-full h-11 text-base font-medium rounded-xl"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Додати зміну
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={showEditDialog} onOpenChange={(open) => !open && closeEditDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редагувати зміну</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {formError && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                {formError}
              </div>
            )}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {editingShift?.shift.worker?.firstName} {editingShift?.shift.worker?.lastName}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm mt-1 text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                <span>{editingShift?.shift.date}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Тип зміни</label>
              <Select value={formShiftType} onValueChange={(v) => setFormShiftType(v as ShiftType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SHIFT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.labelFull}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-2 block">Початок</label>
                <Input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Кінець</label>
                <Input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Статус</label>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as ShiftStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SHIFT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        {value === "completed" && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {value === "cancelled" && <XCircle className="h-4 w-4 text-red-600" />}
                        {value === "scheduled" && <Clock className="h-4 w-4 text-blue-600" />}
                        {value === "started" && <Clock className="h-4 w-4 text-amber-600" />}
                        {value === "missed" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Відділ</label>
              <Select value={formDepartment} onValueChange={setFormDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.filter(d => d.value !== "all").map((dept) => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Примітка</label>
              <Textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Додаткова інформація..."
                rows={2}
              />
            </div>
          </DialogBody>
          <DialogFooter className="border-t pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => editingShift && openDeleteConfirm(editingShift.shift.documentId)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Видалити
            </Button>
            <Button
              onClick={handleUpdateShift}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => !open && closeDeleteConfirm()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити зміну?</AlertDialogTitle>
            <AlertDialogDescription>
              Ця дія незворотня. Зміну буде видалено з графіку.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteShift} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Видалити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Worker Details Dialog */}
      <Dialog open={showWorkerDetails} onOpenChange={(open) => !open && closeWorkerDetails()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Профіль працівника</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {selectedWorkerSummary && (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-medium">
                    {selectedWorkerSummary.worker.firstName?.[0] || selectedWorkerSummary.worker.username?.[0] || "?"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedWorkerSummary.worker.firstName} {selectedWorkerSummary.worker.lastName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={ROLE_COLORS[selectedWorkerSummary.worker.systemRole || "viewer"]}>
                        {ROLE_LABELS[selectedWorkerSummary.worker.systemRole || "viewer"]}
                      </Badge>
                      {selectedWorkerSummary.worker.department && (
                        <Badge variant="outline">
                          {DEPARTMENT_LABELS[selectedWorkerSummary.worker.department]}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-medium mb-3">Статистика за тиждень</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{selectedWorkerSummary.totalShifts}</div>
                      <div className="text-xs text-muted-foreground">Змін</div>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <div className="text-2xl font-bold">{formatMinutesToHours(selectedWorkerSummary.totalMinutes)}</div>
                      <div className="text-xs text-muted-foreground">Загалом</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">Зміни на тижні</h4>
                  <div className="space-y-2">
                    {selectedWorkerSummary.shifts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Немає запланованих змін</p>
                    ) : (
                      selectedWorkerSummary.shifts.map((shift) => (
                        <div
                          key={shift.documentId}
                          onClick={() => handleOpenEditDialog(shift)}
                          className={`p-3 rounded-lg border-l-2 cursor-pointer hover:bg-muted/50 transition-colors ${SHIFT_TYPE_COLORS[shift.shiftType]} ${SHIFT_STATUS_COLORS[shift.status]}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">
                              {new Date(shift.date).toLocaleDateString("uk-UA", { weekday: "short", day: "numeric", month: "short" })}
                            </div>
                            <Badge variant="outline" className="text-[10px]">
                              {SHIFT_STATUS_LABELS[shift.status]}
                            </Badge>
                          </div>
                          <div className="text-sm mt-1 font-mono">
                            {formatTimeDisplay(shift.startTime)} - {formatTimeDisplay(shift.endTime)}
                          </div>
                          {shift.notes && (
                            <div className="text-xs text-muted-foreground mt-1">{shift.notes}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3">За типом зміни</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedWorkerSummary.byType)
                      .filter(([_, count]) => count > 0)
                      .map(([type, count]) => (
                        <Badge key={type} className={SHIFT_TYPE_COLORS[type as ShiftType]}>
                          {SHIFT_TYPES.find(t => t.value === type)?.label}: {count}
                        </Badge>
                      ))
                    }
                  </div>
                </div>
              </>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </div>
  );
}
