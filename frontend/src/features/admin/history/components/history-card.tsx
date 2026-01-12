"use client";

/**
 * History Card Component
 *
 * Displays a single action history item with expandable details.
 */

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  User,
  FileText,
} from "lucide-react";
import {
  ACTION_ICONS,
  MODULE_COLORS,
  SEVERITY_COLORS,
} from "@/lib/config/action-type-config";
import {
  ACTION_LABELS_UK,
  ENTITY_LABELS_UK,
  MODULE_LABELS_UK,
} from "@/lib/config/i18n-labels";
import { formatDateTime, formatTimeAgo } from "@/lib/formatters";
import {
  KitchenTicketStartDetails,
  KitchenTicketTimingDetails,
  InventoryReleaseDetails,
  GenericMetadata,
} from "./action-detail-views";
import { type ActionHistoryItem, getDetailViewType } from "../history-config";

interface HistoryCardProps {
  item: ActionHistoryItem;
  isExpanded: boolean;
  onToggle: () => void;
}

export function HistoryCard({ item, isExpanded, onToggle }: HistoryCardProps) {
  const ActionIcon = ACTION_ICONS[item.action] || FileText;

  const renderChangedFields = () => {
    if (!item.changedFields?.length) return null;

    return (
      <div className="mt-2">
        <p className="text-xs text-muted-foreground mb-1">Змінені поля:</p>
        <div className="flex flex-wrap gap-1">
          {item.changedFields.map((field) => (
            <Badge key={field} variant="outline" className="text-xs">
              {field}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  const renderExpandedContent = () => {
    const metadata = item.metadata || {};
    const detailViewType = getDetailViewType(item);

    return (
      <div className="mt-4 pt-4 border-t space-y-4">
        {/* Basic info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">ID сутності</p>
            <p className="font-mono text-xs">{item.entityId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Точний час</p>
            <p>{formatDateTime(item.createdAt)}</p>
          </div>
        </div>

        {/* Changed fields */}
        {renderChangedFields()}

        {/* Specialized views */}
        {detailViewType === "kitchen_start" && (
          <KitchenTicketStartDetails metadata={metadata} />
        )}
        {detailViewType === "kitchen_timing" && (
          <KitchenTicketTimingDetails metadata={metadata} />
        )}
        {detailViewType === "inventory_release" && (
          <InventoryReleaseDetails metadata={metadata} />
        )}
        {detailViewType === "generic" && Object.keys(metadata).length > 0 && (
          <GenericMetadata metadata={metadata} />
        )}

        {/* Raw data diff (collapsible) */}
        {(item.dataBefore || item.dataAfter) && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Показати сирі дані (JSON)
            </summary>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
              {item.dataBefore && (
                <div className="bg-error/5 rounded-lg p-3">
                  <p className="text-xs font-medium text-error mb-2">До:</p>
                  <pre className="text-xs overflow-auto max-h-40 text-muted-foreground">
                    {JSON.stringify(item.dataBefore, null, 2)}
                  </pre>
                </div>
              )}
              {item.dataAfter && (
                <div className="bg-success/5 rounded-lg p-3">
                  <p className="text-xs font-medium text-success mb-2">Після:</p>
                  <pre className="text-xs overflow-auto max-h-40 text-muted-foreground">
                    {JSON.stringify(item.dataAfter, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    );
  };

  return (
    <Card
      className={`transition-all cursor-pointer hover:shadow-card-hover ${
        item.severity === "warning"
          ? "border-l-4 border-l-warning"
          : item.severity === "critical"
          ? "border-l-4 border-l-error"
          : ""
      }`}
      onClick={onToggle}
    >
      <CardContent className="py-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              item.action === "delete" || item.action === "cancel"
                ? "bg-error/10 text-error"
                : item.action === "create" || item.action === "receive"
                ? "bg-success/10 text-success"
                : item.action === "start"
                ? "bg-orange-100 text-orange-600"
                : item.action === "complete"
                ? "bg-success/10 text-success"
                : "bg-primary/10 text-primary"
            }`}
          >
            <ActionIcon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">
                {ACTION_LABELS_UK[item.action] || item.action}
              </span>
              <Badge variant="outline" className={MODULE_COLORS[item.module] || ""}>
                {MODULE_LABELS_UK[item.module] || item.module}
              </Badge>
              {item.severity !== "info" && (
                <Badge
                  variant="outline"
                  className={SEVERITY_COLORS[item.severity] || ""}
                >
                  {item.severity}
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mt-1">
              {item.descriptionUk || item.description}
            </p>

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeAgo(item.createdAt)}
              </span>
              {(item.performedByName || item.performedBy?.username) && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {item.performedByName || item.performedBy?.username}
                  {item.performedByRole && (
                    <span className="text-muted-foreground/70">
                      ({item.performedByRole})
                    </span>
                  )}
                </span>
              )}
              <span className="hidden md:flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {ENTITY_LABELS_UK[item.entityType] || item.entityType}
                {item.entityName && `: ${item.entityName}`}
              </span>
            </div>

            {/* Expanded content */}
            {isExpanded && renderExpandedContent()}
          </div>

          {/* Expand indicator */}
          <div className="flex-shrink-0">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
