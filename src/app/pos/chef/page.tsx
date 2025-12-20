"use client";

import * as React from "react";
import { TicketCard } from "@/features/tickets/ticket-card";
import { LaneFilter } from "@/features/tickets/lane-filter";
import { StationSelector } from "@/features/tickets/station-selector";
import { LiveIndicator } from "@/features/tickets/live-indicator";
import { useKitchenTickets } from "@/features/tickets/use-kitchen-tickets";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonTicket } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DatePlanner } from "@/features/tickets/date-planner";
import { formatTime } from "@/lib/utils";
import type { KitchenStation, TicketStatus } from "@/types";

export default function ChefPOSPage() {
  const {
    tickets,
    filter,
    isConnected,
    counts,
    setFilter,
    handleStatusChange,
  } = useKitchenTickets();

  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedStation, setSelectedStation] = React.useState<KitchenStation>("all");
  const [selectedDate, setSelectedDate] = React.useState<Date>(new Date());

  // Simulate initial loading
  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter tickets by search query and station
  const filteredTickets = React.useMemo(() => {
    let result = tickets;

    // Filter by station
    if (selectedStation !== "all") {
      result = result.filter(
        (ticket) => ticket.station === selectedStation || !ticket.station
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (ticket) =>
          ticket.tableNumber.toString().includes(query) ||
          ticket.orderId.toLowerCase().includes(query) ||
          ticket.orderItems.some((item) =>
            item.menuItem.name.toLowerCase().includes(query)
          )
      );
    }

    return result;
  }, [tickets, searchQuery, selectedStation]);

  // Group tickets by status for Kanban view
  const ticketsByStatus = React.useMemo(() => {
    const grouped: Record<TicketStatus, typeof filteredTickets> = {
      new: [],
      in_progress: [],
      ready: [],
    };

    filteredTickets.forEach((ticket) => {
      grouped[ticket.status].push(ticket);
    });

    return grouped;
  }, [filteredTickets]);

  // Format selected date for display
  const formattedDate = React.useMemo(() => {
    return new Intl.DateTimeFormat("uk-UA", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(selectedDate);
  }, [selectedDate]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b safe-top">
        <div className="px-3 sm:px-4 py-3">
          {/* Title and date row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-bold mb-1">Замовлення</h1>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" aria-hidden="true" />
                <span>{formattedDate}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Date planner */}
              <DatePlanner
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                className="flex-1 sm:flex-initial"
              />
              <LiveIndicator isConnected={isConnected} />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
                onClick={() => window.location.reload()}
                aria-label="Оновити"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Station selector */}
          <div className="mb-3">
            <StationSelector
              currentStation={selectedStation}
              onStationChange={setSelectedStation}
            />
          </div>

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Пошук за номером столу, замовленням або стравою..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 sm:h-10"
            />
          </div>

          {/* Lane filter */}
          <LaneFilter
            currentFilter={filter}
            onFilterChange={setFilter}
            counts={counts}
          />
        </div>
      </header>

      {/* Tickets grid */}
      <main
        className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4"
        role="tabpanel"
        id={`tickets-${filter}`}
        aria-label={`Тікети: ${filter === "all" ? "всі" : filter}`}
      >
        {isLoading ? (
          // Loading skeleton
          filter === "all" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonTicket key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonTicket key={i} />
              ))}
            </div>
          )
        ) : filteredTickets.length === 0 ? (
          // Empty state
          <EmptyState
            type="orders"
            title={
              searchQuery
                ? "Нічого не знайдено"
                : filter === "all"
                  ? "Немає замовлень"
                  : filter === "new"
                    ? "Немає нових замовлень"
                    : filter === "in_progress"
                      ? "Немає замовлень в роботі"
                      : "Немає готових замовлень"
            }
            description={
              searchQuery
                ? "Спробуйте інший пошуковий запит"
                : "Нові замовлення з'являться автоматично"
            }
          />
        ) : filter === "all" ? (
          // Kanban layout for "All" filter
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {/* New column */}
            <div className="flex flex-col">
              <div className="sticky top-0 bg-background z-10 pb-2 mb-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Нові</h2>
                  <Badge variant="secondary" className="bg-info-light text-info border-0 text-xs px-2 py-0.5">
                    {ticketsByStatus.new.length}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {ticketsByStatus.new.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    Немає нових замовлень
                  </div>
                ) : (
                  ticketsByStatus.new.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>

            {/* In Progress column */}
            <div className="flex flex-col">
              <div className="sticky top-0 bg-background z-10 pb-2 mb-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">В роботі</h2>
                  <Badge variant="secondary" className="bg-warning-light text-warning border-0 text-xs px-2 py-0.5">
                    {ticketsByStatus.in_progress.length}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {ticketsByStatus.in_progress.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    Немає замовлень в роботі
                  </div>
                ) : (
                  ticketsByStatus.in_progress.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Ready column */}
            <div className="flex flex-col">
              <div className="sticky top-0 bg-background z-10 pb-2 mb-2 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">Готові</h2>
                  <Badge variant="secondary" className="bg-success-light text-success border-0 text-xs px-2 py-0.5">
                    {ticketsByStatus.ready.length}
                  </Badge>
                </div>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {ticketsByStatus.ready.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    Немає готових замовлень
                  </div>
                ) : (
                  ticketsByStatus.ready.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          // Regular grid for specific status filters
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {filteredTickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bottom bar - new tickets notification */}
      {counts.new > 0 && filter !== "new" && !searchQuery && (
        <div className="sticky bottom-0 p-3 sm:p-4 bg-info text-white safe-bottom">
          <Button
            variant="ghost"
            className="w-full text-white hover:bg-white/20 h-auto py-2"
            onClick={() => setFilter("new")}
          >
            {counts.new} нових замовлень - натисніть для перегляду
          </Button>
        </div>
      )}
    </div>
  );
}
