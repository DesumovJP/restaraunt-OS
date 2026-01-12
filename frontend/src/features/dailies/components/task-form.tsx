"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import {
  CreateTaskInput,
  UpdateTaskInput,
  DailyTask,
  TaskPriority,
  TaskCategory,
  RecurringPattern,
  Station,
  TASK_PRIORITY_LABELS,
  TASK_CATEGORY_LABELS,
  STATION_LABELS,
} from "@/types/daily-tasks";
import { AssigneePicker } from "./assignee-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Clock, Timer, Repeat } from "lucide-react";

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: DailyTask | null;
  onSubmit: (data: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  loading?: boolean;
}

const PRIORITY_OPTIONS: TaskPriority[] = ["low", "normal", "high", "urgent"];
const CATEGORY_OPTIONS: TaskCategory[] = [
  "prep",
  "cleaning",
  "inventory",
  "maintenance",
  "training",
  "admin",
  "service",
  "other",
];
const RECURRING_OPTIONS: RecurringPattern[] = ["daily", "weekdays", "weekly", "monthly"];
const STATION_OPTIONS: Station[] = [
  "grill",
  "fry",
  "salad",
  "hot",
  "dessert",
  "bar",
  "pass",
  "prep",
  "front",
  "back",
];

const RECURRING_LABELS: Record<RecurringPattern, string> = {
  daily: "Щодня",
  weekdays: "Будні дні",
  weekly: "Щотижня",
  monthly: "Щомісяця",
};

export function TaskForm({
  open,
  onOpenChange,
  task,
  onSubmit,
  loading = false,
}: TaskFormProps) {
  const user = useAuthStore((state) => state.user);
  const isEditing = !!task;

  // Form state
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || "normal");
  const [category, setCategory] = useState<TaskCategory>(task?.category || "other");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [dueTime, setDueTime] = useState(task?.dueTime || "");
  const [assignee, setAssignee] = useState(task?.assignee?.documentId || user?.documentId || "");
  const [station, setStation] = useState<Station | "">(task?.station || "");
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimatedMinutes?.toString() || "");
  const [isRecurring, setIsRecurring] = useState(task?.isRecurring || false);
  const [recurringPattern, setRecurringPattern] = useState<RecurringPattern>(
    task?.recurringPattern || "daily"
  );

  // Reset form when task changes
  const resetForm = () => {
    setTitle(task?.title || "");
    setDescription(task?.description || "");
    setPriority(task?.priority || "normal");
    setCategory(task?.category || "other");
    setDueDate(task?.dueDate || "");
    setDueTime(task?.dueTime || "");
    setAssignee(task?.assignee?.documentId || user?.documentId || "");
    setStation(task?.station || "");
    setEstimatedMinutes(task?.estimatedMinutes?.toString() || "");
    setIsRecurring(task?.isRecurring || false);
    setRecurringPattern(task?.recurringPattern || "daily");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    const data: CreateTaskInput | UpdateTaskInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      category,
      dueDate: dueDate || undefined,
      dueTime: dueTime || undefined,
      assignee,
      station: station || undefined,
      estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes, 10) : undefined,
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : undefined,
    };

    await onSubmit(data);
    resetForm();
    onOpenChange(false);
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Редагувати завдання" : "Нове завдання"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Внесіть зміни до завдання"
              : "Створіть нове завдання для себе або колеги"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Назва *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Що потрібно зробити?"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Опис</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Додаткові деталі..."
              rows={2}
            />
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label>Виконавець</Label>
            <AssigneePicker value={assignee} onChange={setAssignee} />
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Пріоритет</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {TASK_PRIORITY_LABELS[p].uk}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Категорія</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      <span className="flex items-center gap-2">
                        <span>{TASK_CATEGORY_LABELS[c].icon}</span>
                        <span>{TASK_CATEGORY_LABELS[c].uk}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Дата
              </Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Час
              </Label>
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {/* Station & Estimated time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Станція</Label>
              <Select value={station || "none"} onValueChange={(v) => setStation(v === "none" ? "" as Station : v as Station)}>
                <SelectTrigger>
                  <SelectValue placeholder="Оберіть станцію" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Не вказано</SelectItem>
                  {STATION_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATION_LABELS[s].uk}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Орієнтовний час (хв)
              </Label>
              <Input
                type="number"
                min="1"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="15"
              />
            </div>
          </div>

          {/* Recurring */}
          <div className="space-y-4 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Повторюване завдання
              </Label>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>

            {isRecurring && (
              <Select
                value={recurringPattern}
                onValueChange={(v) => setRecurringPattern(v as RecurringPattern)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RECURRING_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {RECURRING_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          </DialogBody>

          <DialogFooter>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="w-full h-11 text-base font-medium rounded-xl"
            >
              {loading ? "Збереження..." : isEditing ? "Зберегти" : "Створити"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
