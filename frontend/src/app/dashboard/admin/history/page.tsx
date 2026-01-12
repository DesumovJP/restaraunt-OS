"use client";

/**
 * Action History Page
 *
 * Admin page for viewing detailed system action history.
 */

import * as React from "react";
import Link from "next/link";
import { useQuery } from "urql";
import { GET_ACTION_HISTORY } from "@/graphql/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  FileText,
} from "lucide-react";
import {
  type ActionHistoryItem,
  type FilterState,
  getDefaultFilters,
  buildQueryVariables,
} from "@/features/admin/history";
import { HistoryFilters, HistoryCard } from "@/features/admin/history/components";

const PAGE_SIZE = 50;

export default function ActionHistoryPage() {
  const [filters, setFilters] = React.useState<FilterState>(getDefaultFilters);
  const [showFilters, setShowFilters] = React.useState(false);
  const [expandedItem, setExpandedItem] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(0);

  // Build query variables from filters
  const queryVariables = React.useMemo(
    () => buildQueryVariables(filters, page, PAGE_SIZE),
    [filters, page]
  );

  const [{ data, fetching, error }, refetch] = useQuery({
    query: GET_ACTION_HISTORY,
    variables: queryVariables,
  });

  const historyItems: ActionHistoryItem[] = data?.actionHistories || [];

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(0);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b px-4 py-3 safe-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/admin">
              <Button variant="ghost" size="icon" aria-label="Назад">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Історія дій</h1>
              <p className="text-sm text-muted-foreground">
                Детальний журнал всіх операцій системи
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Фільтри</span>
              {showFilters ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch({ requestPolicy: "network-only" })}
              disabled={fetching}
              aria-label="Оновити"
            >
              <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <HistoryFilters filters={filters} onFilterChange={handleFilterChange} />
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 p-4">
        {error ? (
          <Card className="border-error/50">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
              <p className="text-error font-medium">Помилка завантаження</p>
              <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch({ requestPolicy: "network-only" })}
              >
                Спробувати знову
              </Button>
            </CardContent>
          </Card>
        ) : fetching && historyItems.length === 0 ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="py-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : historyItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Записів не знайдено за вказаними фільтрами
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <HistoryCard
                key={item.documentId}
                item={item}
                isExpanded={expandedItem === item.documentId}
                onToggle={() =>
                  setExpandedItem(
                    expandedItem === item.documentId ? null : item.documentId
                  )
                }
              />
            ))}

            {/* Pagination */}
            {historyItems.length >= PAGE_SIZE && (
              <div className="flex justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Попередня
                </Button>
                <span className="flex items-center px-3 text-sm text-muted-foreground">
                  Сторінка {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={historyItems.length < PAGE_SIZE}
                >
                  Наступна
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
