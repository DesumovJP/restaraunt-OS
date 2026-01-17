/**
 * Hook for fetching waiter shift statistics
 * Orders served, tables, tips, average check for today
 */

import { useQuery, gql } from "urql";
import { useMemo } from "react";

// Query to get waiter's orders for today
const GET_WAITER_TODAY_STATS = gql`
  query GetWaiterTodayStats($waiterId: ID!, $todayStart: DateTime!, $todayEnd: DateTime!) {
    orders(
      filters: {
        waiter: { documentId: { eq: $waiterId } }
        paidAt: { gte: $todayStart, lte: $todayEnd }
        status: { eq: "paid" }
      }
      pagination: { limit: 100 }
    ) {
      documentId
      totalAmount
      tipAmount
      guestCount
      paidAt
      table {
        documentId
        number
      }
    }
  }
`;

export interface WaiterStats {
  ordersCount: number;
  tablesCount: number;
  totalRevenue: number;
  totalTips: number;
  averageCheck: number;
  guestsServed: number;
}

export function useWaiterStats(waiterId: string | null) {
  // Calculate today's date range
  const { todayStart, todayEnd } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    return {
      todayStart: start.toISOString(),
      todayEnd: end.toISOString(),
    };
  }, []);

  const [result] = useQuery({
    query: GET_WAITER_TODAY_STATS,
    variables: {
      waiterId: waiterId || "",
      todayStart,
      todayEnd,
    },
    pause: !waiterId,
  });

  const stats = useMemo<WaiterStats>(() => {
    const orders = result.data?.orders || [];

    if (orders.length === 0) {
      return {
        ordersCount: 0,
        tablesCount: 0,
        totalRevenue: 0,
        totalTips: 0,
        averageCheck: 0,
        guestsServed: 0,
      };
    }

    // Count unique tables
    const uniqueTables = new Set(orders.map((o: any) => o.table?.documentId).filter(Boolean));

    // Calculate totals
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
    const totalTips = orders.reduce((sum: number, o: any) => sum + (o.tipAmount || 0), 0);
    const guestsServed = orders.reduce((sum: number, o: any) => sum + (o.guestCount || 0), 0);

    return {
      ordersCount: orders.length,
      tablesCount: uniqueTables.size,
      totalRevenue,
      totalTips,
      averageCheck: orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0,
      guestsServed,
    };
  }, [result.data]);

  return {
    stats,
    isLoading: result.fetching,
    error: result.error,
  };
}
