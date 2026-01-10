"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  Pencil,
  MinusCircle,
  Trash2,
  History,
  QrCode,
  ArrowRightLeft,
} from "lucide-react";
import type { QuickAction } from "@/types/storage-ui";

// ==========================================
// QUICK ACTIONS MENU (Dropdown)
// ==========================================

interface QuickActionsMenuProps {
  actions: QuickAction[];
  className?: string;
}

/**
 * Dropdown menu for product quick actions
 */
export function QuickActionsMenu({ actions, className }: QuickActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8", className)}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Дії</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {actions.map((action, index) => (
          <React.Fragment key={action.id}>
            {index > 0 && action.variant === "destructive" && (
              <DropdownMenuSeparator />
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              disabled={action.disabled}
              className={cn(
                action.variant === "destructive" && "text-destructive focus:text-destructive"
              )}
            >
              <action.icon className="mr-2 h-4 w-4" />
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ==========================================
// QUICK ACTIONS BAR (Inline buttons)
// ==========================================

interface QuickActionsBarProps {
  actions: QuickAction[];
  maxVisible?: number;
  className?: string;
}

/**
 * Inline action buttons with overflow menu
 */
export function QuickActionsBar({
  actions,
  maxVisible = 2,
  className,
}: QuickActionsBarProps) {
  const visibleActions = actions.slice(0, maxVisible);
  const overflowActions = actions.slice(maxVisible);

  return (
    <TooltipProvider>
      <div
        className={cn("flex items-center gap-1", className)}
        onClick={(e) => e.stopPropagation()}
      >
        {visibleActions.map((action) => (
          <Tooltip key={action.id}>
            <TooltipTrigger asChild>
              <Button
                variant={action.variant === "destructive" ? "ghost" : "ghost"}
                size="icon"
                className={cn(
                  "h-7 w-7",
                  action.variant === "destructive" &&
                    "text-muted-foreground hover:text-destructive"
                )}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                <action.icon className="h-4 w-4" />
                <span className="sr-only">{action.label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {action.label}
            </TooltipContent>
          </Tooltip>
        ))}

        {overflowActions.length > 0 && (
          <QuickActionsMenu actions={overflowActions} />
        )}
      </div>
    </TooltipProvider>
  );
}

// ==========================================
// DEFAULT PRODUCT ACTIONS
// ==========================================

interface ProductActionsProps {
  productId: string;
  onEdit?: () => void;
  onUse?: () => void;
  onWriteOff?: () => void;
  onViewHistory?: () => void;
  onTransfer?: () => void;
  onScanBatch?: () => void;
  variant?: "menu" | "bar";
  className?: string;
}

/**
 * Pre-configured product actions
 */
export function ProductActions({
  productId,
  onEdit,
  onUse,
  onWriteOff,
  onViewHistory,
  onTransfer,
  onScanBatch,
  variant = "menu",
  className,
}: ProductActionsProps) {
  const actions: QuickAction[] = [
    ...(onEdit
      ? [
          {
            id: "edit",
            label: "Редагувати",
            icon: Pencil,
            onClick: onEdit,
          },
        ]
      : []),
    ...(onUse
      ? [
          {
            id: "use",
            label: "Використати",
            icon: MinusCircle,
            onClick: onUse,
          },
        ]
      : []),
    ...(onViewHistory
      ? [
          {
            id: "history",
            label: "Історія",
            icon: History,
            onClick: onViewHistory,
          },
        ]
      : []),
    ...(onTransfer
      ? [
          {
            id: "transfer",
            label: "Перемістити",
            icon: ArrowRightLeft,
            onClick: onTransfer,
          },
        ]
      : []),
    ...(onScanBatch
      ? [
          {
            id: "scan",
            label: "Сканувати партію",
            icon: QrCode,
            onClick: onScanBatch,
          },
        ]
      : []),
    ...(onWriteOff
      ? [
          {
            id: "writeoff",
            label: "Списати",
            icon: Trash2,
            onClick: onWriteOff,
            variant: "destructive" as const,
          },
        ]
      : []),
  ];

  if (actions.length === 0) return null;

  if (variant === "bar") {
    return <QuickActionsBar actions={actions} className={className} />;
  }

  return <QuickActionsMenu actions={actions} className={className} />;
}
