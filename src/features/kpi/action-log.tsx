"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatRelativeTime } from "@/lib/utils";
import {
  History,
  ShoppingCart,
  UtensilsCrossed,
  Package,
  Settings,
} from "lucide-react";
import type { ActionLog } from "@/types";

interface ActionLogViewProps {
  logs: ActionLog[];
  className?: string;
}

const moduleConfig: Record<
  ActionLog["module"],
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  pos: {
    icon: ShoppingCart,
    color: "text-primary",
    bgColor: "bg-primary-light",
  },
  kitchen: {
    icon: UtensilsCrossed,
    color: "text-warning",
    bgColor: "bg-warning-light",
  },
  storage: {
    icon: Package,
    color: "text-info",
    bgColor: "bg-info-light",
  },
  admin: {
    icon: Settings,
    color: "text-secondary",
    bgColor: "bg-secondary-light",
  },
};

export function ActionLogView({ logs, className }: ActionLogViewProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Журнал дій
        </CardTitle>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Немає записів
          </p>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {logs.map((log) => (
              <LogItem key={log.id} log={log} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LogItem({ log }: { log: ActionLog }) {
  const config = moduleConfig[log.module];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
      {/* Module icon */}
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
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{log.userName}</span>
          <span className="text-muted-foreground text-sm">•</span>
          <span className="text-sm">{log.action}</span>
        </div>
        <p className="text-sm text-muted-foreground truncate">{log.details}</p>
      </div>

      {/* Time */}
      <span className="text-xs text-muted-foreground shrink-0">
        {formatRelativeTime(new Date(log.timestamp))}
      </span>
    </div>
  );
}
