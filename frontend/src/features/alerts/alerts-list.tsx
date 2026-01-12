"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ArrowRight,
} from "lucide-react";
import type { Alert, AlertSeverity } from "@/types";

interface AlertsListProps {
  alerts: Alert[];
  onMarkRead: (alertId: string) => void;
  onAlertClick?: (alert: Alert) => void;
  className?: string;
}

const severityConfig: Record<
  AlertSeverity,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  info: {
    icon: Info,
    color: "text-info",
    bgColor: "bg-info-light",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-warning",
    bgColor: "bg-warning-light",
  },
  critical: {
    icon: AlertCircle,
    color: "text-danger",
    bgColor: "bg-danger-light",
  },
};

export function AlertsList({
  alerts,
  onMarkRead,
  onAlertClick,
  className,
}: AlertsListProps) {
  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Сповіщення
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <EmptyState type="alerts" className="py-6" />
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {alerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onMarkRead={onMarkRead}
                onClick={onAlertClick}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Individual alert item
interface AlertItemProps {
  alert: Alert;
  onMarkRead: (alertId: string) => void;
  onClick?: (alert: Alert) => void;
}

function AlertItem({ alert, onMarkRead, onClick }: AlertItemProps) {
  const config = severityConfig[alert.severity] ?? severityConfig.info;
  const Icon = config.icon;

  const handleClick = () => {
    if (!alert.read) {
      onMarkRead(alert.id);
    }
    onClick?.(alert);
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-all",
        alert.read ? "bg-background opacity-60" : config.bgColor,
        onClick && "cursor-pointer hover:shadow-sm"
      )}
      onClick={handleClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${alert.read ? "Прочитано: " : ""}${alert.title}`}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          config.bgColor
        )}
      >
        <Icon className={cn("h-4 w-4", config.color)} aria-hidden="true" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className={cn(
              "text-sm font-medium",
              !alert.read && "font-semibold"
            )}
          >
            {alert.title}
          </h4>
          {!alert.read && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onMarkRead(alert.id);
              }}
              aria-label="Позначити як прочитане"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">{alert.message}</p>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(new Date(alert.createdAt))}
          </span>
          {alert.actionUrl && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs gap-1"
              onClick={(e) => {
                e.stopPropagation();
                // Navigate to action URL
                window.location.href = alert.actionUrl!;
              }}
            >
              Детальніше
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
