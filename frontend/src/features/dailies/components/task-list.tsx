"use client";

import { cn } from "@/lib/utils";
import { DailyTask, GroupedTasks, TASK_STATUS_LABELS } from "@/types/daily-tasks";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, AlertTriangle, Play, Clock, CheckCircle2, XCircle, Plus, ClipboardList } from "lucide-react";
import { useState } from "react";

interface TaskListProps {
  tasks: DailyTask[];
  grouped?: boolean;
  groupedTasks?: GroupedTasks;
  onStartTask?: (documentId: string) => void;
  onCompleteTask?: (documentId: string) => void;
  onEditTask?: (task: DailyTask) => void;
  onAddTask?: () => void;
  showAssignee?: boolean;
  showCreator?: boolean;
  emptyMessage?: string;
  emptySubMessage?: string;
  className?: string;
}

interface TaskGroupProps {
  title: string;
  icon: React.ReactNode;
  tasks: DailyTask[];
  defaultOpen?: boolean;
  variant?: "default" | "danger" | "success" | "muted";
  onStartTask?: (documentId: string) => void;
  onCompleteTask?: (documentId: string) => void;
  onEditTask?: (task: DailyTask) => void;
  showAssignee?: boolean;
  showCreator?: boolean;
}

const variantStyles = {
  default: "text-foreground",
  danger: "text-error",
  success: "text-success",
  muted: "text-muted-foreground",
};

function TaskGroup({
  title,
  icon,
  tasks,
  defaultOpen = true,
  variant = "default",
  onStartTask,
  onCompleteTask,
  onEditTask,
  showAssignee,
  showCreator,
}: TaskGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (tasks.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors">
        <div className={cn("flex items-center gap-2 font-medium", variantStyles[variant])}>
          {icon}
          <span>{title}</span>
          <span className="text-muted-foreground font-normal">({tasks.length})</span>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-3 pt-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.documentId}
              task={task}
              onStart={onStartTask ? () => onStartTask(task.documentId) : undefined}
              onComplete={onCompleteTask ? () => onCompleteTask(task.documentId) : undefined}
              onEdit={onEditTask ? () => onEditTask(task) : undefined}
              showAssignee={showAssignee}
              showCreator={showCreator}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TaskList({
  tasks,
  grouped = false,
  groupedTasks,
  onStartTask,
  onCompleteTask,
  onEditTask,
  onAddTask,
  showAssignee = false,
  showCreator = false,
  emptyMessage = "Немає завдань",
  emptySubMessage = "Створіть нове завдання, щоб почати планувати свій день",
  className,
}: TaskListProps) {
  if (grouped && groupedTasks) {
    const hasAnyTasks =
      groupedTasks.overdue.length > 0 ||
      groupedTasks.inProgress.length > 0 ||
      groupedTasks.pending.length > 0 ||
      groupedTasks.completed.length > 0;

    if (!hasAnyTasks) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
            <ClipboardList className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium mb-1">{emptyMessage}</h3>
          <p className="text-muted-foreground text-sm max-w-xs mb-4">{emptySubMessage}</p>
          {onAddTask && (
            <Button onClick={onAddTask} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Створити завдання
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className={cn("space-y-4", className)}>
        {/* Overdue - always expanded, danger style */}
        <TaskGroup
          title={TASK_STATUS_LABELS.overdue.uk}
          icon={<AlertTriangle className="h-5 w-5" />}
          tasks={groupedTasks.overdue}
          defaultOpen={true}
          variant="danger"
          onStartTask={onStartTask}
          onCompleteTask={onCompleteTask}
          onEditTask={onEditTask}
          showAssignee={showAssignee}
          showCreator={showCreator}
        />

        {/* In Progress */}
        <TaskGroup
          title={TASK_STATUS_LABELS.in_progress.uk}
          icon={<Play className="h-5 w-5" />}
          tasks={groupedTasks.inProgress}
          defaultOpen={true}
          variant="default"
          onStartTask={onStartTask}
          onCompleteTask={onCompleteTask}
          onEditTask={onEditTask}
          showAssignee={showAssignee}
          showCreator={showCreator}
        />

        {/* Pending */}
        <TaskGroup
          title={TASK_STATUS_LABELS.pending.uk}
          icon={<Clock className="h-5 w-5" />}
          tasks={groupedTasks.pending}
          defaultOpen={true}
          variant="default"
          onStartTask={onStartTask}
          onCompleteTask={onCompleteTask}
          onEditTask={onEditTask}
          showAssignee={showAssignee}
          showCreator={showCreator}
        />

        {/* Completed - collapsed by default */}
        <TaskGroup
          title={TASK_STATUS_LABELS.completed.uk}
          icon={<CheckCircle2 className="h-5 w-5" />}
          tasks={groupedTasks.completed}
          defaultOpen={false}
          variant="success"
          onStartTask={onStartTask}
          onCompleteTask={onCompleteTask}
          onEditTask={onEditTask}
          showAssignee={showAssignee}
          showCreator={showCreator}
        />

        {/* Cancelled - collapsed by default */}
        {groupedTasks.cancelled.length > 0 && (
          <TaskGroup
            title={TASK_STATUS_LABELS.cancelled.uk}
            icon={<XCircle className="h-5 w-5" />}
            tasks={groupedTasks.cancelled}
            defaultOpen={false}
            variant="muted"
            onStartTask={onStartTask}
            onCompleteTask={onCompleteTask}
            onEditTask={onEditTask}
            showAssignee={showAssignee}
            showCreator={showCreator}
          />
        )}
      </div>
    );
  }

  // Flat list
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
          <ClipboardList className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-base font-medium mb-1">{emptyMessage}</h3>
        <p className="text-muted-foreground text-sm max-w-xs mb-4">{emptySubMessage}</p>
        {onAddTask && (
          <Button onClick={onAddTask} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Створити завдання
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {tasks.map((task) => (
        <TaskCard
          key={task.documentId}
          task={task}
          onStart={onStartTask ? () => onStartTask(task.documentId) : undefined}
          onComplete={onCompleteTask ? () => onCompleteTask(task.documentId) : undefined}
          onEdit={onEditTask ? () => onEditTask(task) : undefined}
          showAssignee={showAssignee}
          showCreator={showCreator}
        />
      ))}
    </div>
  );
}
