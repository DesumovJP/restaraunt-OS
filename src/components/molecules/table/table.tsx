"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

/**
 * Restaurant OS Table Component
 *
 * Переваги над конкурентами:
 * - Mobile-first responsive design
 * - Sticky headers для довгих таблиць
 * - Sortable columns з clear indicators
 * - Row selection з accessibility
 * - Zebra striping для читабельності
 */

// =============================================================================
// TABLE ROOT
// =============================================================================

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  /** Enable horizontal scroll on mobile */
  responsive?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, responsive = true, ...props }, ref) => (
    <div
      className={cn(
        responsive && "w-full overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0"
      )}
    >
      <table
        ref={ref}
        className={cn(
          "w-full caption-bottom text-sm",
          "border-collapse",
          className
        )}
        {...props}
      />
    </div>
  )
);
Table.displayName = "Table";

// =============================================================================
// TABLE HEADER
// =============================================================================

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn(
      "bg-slate-50",
      "[&_tr]:border-b [&_tr]:border-slate-200",
      className
    )}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

// =============================================================================
// TABLE BODY
// =============================================================================

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn(
      "[&_tr:last-child]:border-0",
      // Zebra striping
      "[&_tr:nth-child(even)]:bg-slate-50/50",
      className
    )}
    {...props}
  />
));
TableBody.displayName = "TableBody";

// =============================================================================
// TABLE FOOTER
// =============================================================================

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "bg-slate-100 font-medium",
      "border-t-2 border-slate-200",
      className
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

// =============================================================================
// TABLE ROW
// =============================================================================

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Row is selected */
  selected?: boolean;
  /** Row is clickable */
  interactive?: boolean;
}

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, selected, interactive, onClick, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-slate-200",
        "transition-colors duration-200",
        // Interactive states
        interactive && [
          "cursor-pointer",
          "hover:bg-slate-50",
          "focus-visible:bg-slate-50 focus-visible:outline-none",
        ],
        // Selected state
        selected && "bg-accent-light/20 hover:bg-accent-light/30",
        className
      )}
      onClick={onClick}
      tabIndex={interactive ? 0 : undefined}
      data-state={selected ? "selected" : undefined}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

// =============================================================================
// TABLE HEAD CELL
// =============================================================================

type SortDirection = "asc" | "desc" | null;

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Enable sorting */
  sortable?: boolean;
  /** Current sort direction */
  sortDirection?: SortDirection;
  /** Sort change handler */
  onSort?: () => void;
}

const TableHead = React.forwardRef<HTMLTableCellElement, TableHeadProps>(
  (
    { className, children, sortable, sortDirection, onSort, ...props },
    ref
  ) => {
    const SortIcon =
      sortDirection === "asc"
        ? ChevronUp
        : sortDirection === "desc"
          ? ChevronDown
          : ChevronsUpDown;

    return (
      <th
        ref={ref}
        className={cn(
          "h-11 px-3 text-left align-middle",
          "font-semibold text-slate-600 text-xs uppercase tracking-wider",
          // Sticky header
          "sticky top-0 bg-slate-50 z-10",
          // Sortable styles
          sortable && [
            "cursor-pointer select-none",
            "hover:text-navy-950 hover:bg-slate-100",
            "transition-colors duration-200",
          ],
          className
        )}
        onClick={sortable ? onSort : undefined}
        aria-sort={
          sortDirection === "asc"
            ? "ascending"
            : sortDirection === "desc"
              ? "descending"
              : undefined
        }
        {...props}
      >
        <div className="flex items-center gap-1">
          <span>{children}</span>
          {sortable && (
            <SortIcon
              className={cn(
                "h-4 w-4 shrink-0",
                sortDirection ? "text-accent" : "text-slate-400"
              )}
              aria-hidden="true"
            />
          )}
        </div>
      </th>
    );
  }
);
TableHead.displayName = "TableHead";

// =============================================================================
// TABLE CELL
// =============================================================================

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** Cell content alignment */
  align?: "left" | "center" | "right";
  /** Truncate long content */
  truncate?: boolean;
  /** Monospace font (for numbers, codes) */
  mono?: boolean;
}

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, align = "left", truncate, mono, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "p-3 align-middle",
        "text-navy-950",
        // Alignment
        align === "center" && "text-center",
        align === "right" && "text-right",
        // Truncation
        truncate && "max-w-[200px] truncate",
        // Monospace
        mono && "font-mono tabular-nums",
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

// =============================================================================
// TABLE CAPTION
// =============================================================================

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn(
      "mt-4 text-sm text-slate-600 text-left",
      className
    )}
    {...props}
  />
));
TableCaption.displayName = "TableCaption";

// =============================================================================
// EMPTY STATE
// =============================================================================

interface TableEmptyProps {
  /** Number of columns to span */
  colSpan: number;
  /** Message to display */
  message?: string;
  /** Custom content */
  children?: React.ReactNode;
}

const TableEmpty = ({ colSpan, message = "Немає даних", children }: TableEmptyProps) => (
  <TableRow>
    <TableCell colSpan={colSpan} className="h-32 text-center">
      {children || (
        <div className="flex flex-col items-center justify-center text-slate-600">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
            <svg
              className="w-6 h-6 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <p className="text-sm">{message}</p>
        </div>
      )}
    </TableCell>
  </TableRow>
);
TableEmpty.displayName = "TableEmpty";

// =============================================================================
// EXPORTS
// =============================================================================

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableEmpty,
};
