"use client";

import { cn } from "@/lib/utils";
import {
  DailyTask,
  isTaskOverdue,
  getTaskDueLabel,
  formatTaskTime,
} from "@/types/daily-tasks";
import { useAuthStore } from "@/stores/auth-store";
import { getTaskPermissions } from "@/lib/task-permissions";
import { StatusBadge } from "./status-badge";
import { PriorityBadge, PriorityDot } from "./priority-badge";
import { CategoryIcon } from "./category-icon";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Clock,
  Play,
  Check,
  Pencil,
  Timer,
  User,
} from "lucide-react";

interface TaskCardProps {
  task: DailyTask;
  onStart?: () => void;
  onComplete?: () => void;
  onEdit?: () => void;
  showAssignee?: boolean;
  showCreator?: boolean;
  compact?: boolean;
  className?: string;
}

export function TaskCard({
  task,
  onStart,
  onComplete,
  onEdit,
  showAssignee = false,
  showCreator = false,
  compact = false,
  className,
}: TaskCardProps) {
  const user = useAuthStore((state) => state.user);

  const permissions = user
    ? getTaskPermissions(user.documentId, user.systemRole, task)
    : {
        canEdit: false,
        canStart: false,
        canComplete: false,
        isAssignee: false,
      };

  const isOverdue = isTaskOverdue(task);
  const dueLabel = getTaskDueLabel(task);

  // Determine border color based on priority and status
  const getBorderClass = () => {
    if (task.status === "completed") return "border-l-success";
    if (isOverdue) return "border-l-error";
    if (task.priority === "urgent") return "border-l-error";
    if (task.priority === "high") return "border-l-warning";
    return "border-l-transparent";
  };

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md border-l-4",
        getBorderClass(),
        task.status === "completed" && "opacity-60",
        task.status === "cancelled" && "opacity-40",
        className
      )}
    >
      <CardHeader className={cn("pb-2", compact && "p-3")}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <PriorityDot priority={task.priority} size="sm" />
              <h3
                className={cn(
                  "font-medium truncate",
                  task.status === "cancelled" && "line-through"
                )}
              >
                {task.title}
              </h3>
            </div>

            {!compact && task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
          </div>

          {!compact && <StatusBadge status={isOverdue ? "overdue" : task.status} size="sm" />}
        </div>
      </CardHeader>

      <CardContent className={cn("pb-2", compact && "p-3 pt-0")}>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <CategoryIcon category={task.category} size="sm" showLabel />

          {dueLabel && (
            <span className={cn("flex items-center gap-1", isOverdue && "text-error")}>
              <Clock className="h-3 w-3" />
              {dueLabel}
            </span>
          )}

          {task.estimatedMinutes && (
            <span className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              ~{formatTaskTime(task.estimatedMinutes)}
            </span>
          )}

          {task.status === "in_progress" && task.startedAt && (
            <span className="flex items-center gap-1 text-accent">
              <Play className="h-3 w-3" />
              В роботі
            </span>
          )}

          {task.status === "completed" && task.actualMinutes && (
            <span className="flex items-center gap-1 text-success">
              <Check className="h-3 w-3" />
              {formatTaskTime(task.actualMinutes)}
            </span>
          )}
        </div>

        {(showAssignee || showCreator) && (
          <div className="flex items-center gap-3 mt-2 pt-2 border-t">
            {showAssignee && task.assignee && (
              <div className="flex items-center gap-1.5">
                <User className="h-3 w-3 text-muted-foreground" />
                <Avatar className="h-5 w-5">
                  <AvatarImage src={task.assignee.avatarUrl} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{task.assignee.username}</span>
              </div>
            )}

            {showCreator && task.createdByUser && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-xs">від</span>
                <span className="text-sm">{task.createdByUser.username}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {!compact && (task.status === "pending" || task.status === "in_progress") && (
        <CardFooter className="pt-2 border-t">
          <div className="flex items-center justify-between w-full">
            {compact ? (
              <StatusBadge status={isOverdue ? "overdue" : task.status} size="sm" />
            ) : (
              <div />
            )}

            <div className="flex gap-2">
              {task.status === "pending" && permissions.canStart && onStart && (
                <Button size="sm" variant="outline" onClick={onStart}>
                  <Play className="h-4 w-4 mr-1" />
                  Почати
                </Button>
              )}

              {task.status === "in_progress" && permissions.canComplete && onComplete && (
                <Button size="sm" onClick={onComplete}>
                  <Check className="h-4 w-4 mr-1" />
                  Готово
                </Button>
              )}

              {permissions.canEdit && onEdit && (
                <Button size="sm" variant="ghost" onClick={onEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
