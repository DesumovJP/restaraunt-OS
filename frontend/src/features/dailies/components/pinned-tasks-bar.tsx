"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { DailyTask } from "@/types/daily-tasks";
import { PinnedTaskCard } from "./pinned-task-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  ListTodo,
  Plus,
} from "lucide-react";

interface PinnedTasksBarProps {
  tasks: DailyTask[];
  onStartTask?: (documentId: string) => Promise<void>;
  onCompleteTask?: (documentId: string) => Promise<void>;
  onAddTask?: () => void;
  onViewAll?: () => void;
  maxVisible?: number;
  className?: string;
}

/**
 * Horizontal bar of pinned task cards
 * Shows active tasks with quick actions
 */
export function PinnedTasksBar({
  tasks,
  onStartTask,
  onCompleteTask,
  onAddTask,
  onViewAll,
  maxVisible = 4,
  className,
}: PinnedTasksBarProps) {
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);

  // Filter to show only pending and in_progress tasks
  const activeTasks = useMemo(() => {
    return tasks.filter(
      (t) => t.status === "pending" || t.status === "in_progress"
    );
  }, [tasks]);

  // Sort: in_progress first, then by priority
  const sortedTasks = useMemo(() => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, normal: 2, low: 3 };
    return [...activeTasks].sort((a, b) => {
      // In progress first
      if (a.status === "in_progress" && b.status !== "in_progress") return -1;
      if (b.status === "in_progress" && a.status !== "in_progress") return 1;
      // Then by priority
      return (
        (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2)
      );
    });
  }, [activeTasks]);

  // Visible tasks based on scroll
  const visibleTasks = sortedTasks.slice(
    scrollOffset,
    scrollOffset + maxVisible
  );
  const canScrollLeft = scrollOffset > 0;
  const canScrollRight = scrollOffset + maxVisible < sortedTasks.length;

  const handleStart = async (documentId: string) => {
    if (!onStartTask) return;
    setLoadingTaskId(documentId);
    try {
      await onStartTask(documentId);
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleComplete = async (documentId: string) => {
    if (!onCompleteTask) return;
    setLoadingTaskId(documentId);
    try {
      await onCompleteTask(documentId);
    } finally {
      setLoadingTaskId(null);
    }
  };

  if (sortedTasks.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-dashed",
          className
        )}
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <ListTodo className="h-4 w-4" />
          <span className="text-sm">Немає активних завдань</span>
        </div>
        {onAddTask && (
          <Button size="sm" variant="outline" onClick={onAddTask}>
            <Plus className="h-4 w-4 mr-1" />
            Додати
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Завдання</span>
          <Badge variant="secondary" className="text-xs">
            {activeTasks.length}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {sortedTasks.length > maxVisible && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={!canScrollLeft}
                onClick={() => setScrollOffset(Math.max(0, scrollOffset - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                disabled={!canScrollRight}
                onClick={() =>
                  setScrollOffset(
                    Math.min(sortedTasks.length - maxVisible, scrollOffset + 1)
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {onViewAll && (
            <Button size="sm" variant="ghost" onClick={onViewAll}>
              Всі
            </Button>
          )}

          {onAddTask && (
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onAddTask}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {visibleTasks.map((task) => (
          <PinnedTaskCard
            key={task.documentId}
            task={task}
            onStart={() => handleStart(task.documentId)}
            onComplete={() => handleComplete(task.documentId)}
            loading={loadingTaskId === task.documentId}
          />
        ))}

        {/* Show count of hidden tasks */}
        {sortedTasks.length > maxVisible && canScrollRight && (
          <div className="flex items-center justify-center min-w-[60px] text-sm text-muted-foreground">
            +{sortedTasks.length - scrollOffset - maxVisible}
          </div>
        )}
      </div>
    </div>
  );
}
