"use client";

import * as React from "react";
import { toast } from "sonner";
import { useStorageAlerts } from "./use-batches";

interface NotificationConfig {
  lowStockEnabled?: boolean;
  expiryEnabled?: boolean;
  checkIntervalMs?: number;
  expiryWarningDays?: number;
}

interface StorageNotificationsResult {
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  lowStockCount: number;
  expiringCount: number;
  expiredCount: number;
  criticalCount: number;
  totalAlerts: number;
  checkNow: () => void;
}

const STORAGE_NOTIFICATIONS_KEY = "storage-notifications-enabled";
const LAST_NOTIFIED_KEY = "storage-last-notified";

export function useStorageNotifications(
  config: NotificationConfig = {}
): StorageNotificationsResult {
  const {
    lowStockEnabled = true,
    expiryEnabled = true,
    checkIntervalMs = 60000, // Check every minute
    expiryWarningDays = 7,
  } = config;

  const [isEnabled, setIsEnabledState] = React.useState(true);
  const lastNotifiedRef = React.useRef<Record<string, number>>({});

  // Get alerts from API
  const {
    expiringSoon,
    alreadyExpired,
    lowStock,
    critical,
    isLoading,
    refetch,
  } = useStorageAlerts(expiryWarningDays);

  // Load persisted state
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_NOTIFICATIONS_KEY);
      if (stored !== null) {
        setIsEnabledState(stored === "true");
      }

      const lastNotified = localStorage.getItem(LAST_NOTIFIED_KEY);
      if (lastNotified) {
        try {
          lastNotifiedRef.current = JSON.parse(lastNotified);
        } catch {
          lastNotifiedRef.current = {};
        }
      }
    }
  }, []);

  // Set enabled state
  const setEnabled = React.useCallback((enabled: boolean) => {
    setIsEnabledState(enabled);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_NOTIFICATIONS_KEY, String(enabled));
    }
  }, []);

  // Show notifications
  const showNotifications = React.useCallback(() => {
    if (!isEnabled || isLoading) return;

    const now = Date.now();
    const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes cooldown per item

    // Critical low stock alerts
    if (lowStockEnabled && critical.length > 0) {
      const newCritical = critical.filter((item) => {
        const lastNotified = lastNotifiedRef.current[`critical-${item.documentId}`] || 0;
        return now - lastNotified > COOLDOWN_MS;
      });

      if (newCritical.length > 0) {
        const first = newCritical[0];
        toast.error(`Критично низький запас: ${first.nameUk || first.name}`, {
          description: `Залишок: ${first.currentStock} ${first.unit}. Мінімум: ${first.minStock} ${first.unit}`,
          duration: 10000,
          action: {
            label: "Переглянути",
            onClick: () => {
              window.location.href = "/storage?filter=critical";
            },
          },
        });

        // Mark as notified
        newCritical.forEach((item) => {
          lastNotifiedRef.current[`critical-${item.documentId}`] = now;
        });
      }

      // General low stock
      const nonCriticalLowStock = lowStock.filter(
        (item) => !item.isCritical
      );
      const newLowStock = nonCriticalLowStock.filter((item) => {
        const lastNotified = lastNotifiedRef.current[`low-${item.documentId}`] || 0;
        return now - lastNotified > COOLDOWN_MS;
      });

      if (newLowStock.length > 0) {
        toast.warning(`Низький запас: ${newLowStock.length} позицій`, {
          description: newLowStock.slice(0, 3).map((i) => i.nameUk || i.name).join(", "),
          duration: 8000,
        });

        newLowStock.forEach((item) => {
          lastNotifiedRef.current[`low-${item.documentId}`] = now;
        });
      }
    }

    // Already expired alerts
    if (expiryEnabled && alreadyExpired.length > 0) {
      const newExpired = alreadyExpired.filter((item) => {
        const lastNotified = lastNotifiedRef.current[`expired-${item.documentId}`] || 0;
        return now - lastNotified > COOLDOWN_MS;
      });

      if (newExpired.length > 0) {
        toast.error(`Прострочено: ${newExpired.length} партій`, {
          description: newExpired.slice(0, 3).map((i) => `${i.ingredientUk || i.ingredient} (${i.batchNumber})`).join(", "),
          duration: 10000,
          action: {
            label: "Списати",
            onClick: () => {
              window.location.href = "/storage?view=batches&filter=expired";
            },
          },
        });

        newExpired.forEach((item) => {
          lastNotifiedRef.current[`expired-${item.documentId}`] = now;
        });
      }
    }

    // Expiring soon alerts
    if (expiryEnabled && expiringSoon.length > 0) {
      const newExpiring = expiringSoon.filter((item) => {
        const lastNotified = lastNotifiedRef.current[`expiring-${item.documentId}`] || 0;
        return now - lastNotified > COOLDOWN_MS;
      });

      if (newExpiring.length > 0) {
        const urgentCount = newExpiring.filter((i) => (i.daysUntilExpiry || 0) <= 2).length;

        if (urgentCount > 0) {
          toast.warning(`Скоро закінчується термін: ${urgentCount} партій`, {
            description: `Термін закінчується через 1-2 дні`,
            duration: 8000,
          });
        } else if (newExpiring.length >= 3) {
          toast("Партії, що скоро закінчуються", {
            description: `${newExpiring.length} партій закінчуються протягом ${expiryWarningDays} днів`,
            duration: 6000,
          });
        }

        newExpiring.forEach((item) => {
          lastNotifiedRef.current[`expiring-${item.documentId}`] = now;
        });
      }
    }

    // Save last notified state
    if (typeof window !== "undefined") {
      localStorage.setItem(LAST_NOTIFIED_KEY, JSON.stringify(lastNotifiedRef.current));
    }
  }, [isEnabled, isLoading, lowStockEnabled, expiryEnabled, critical, lowStock, alreadyExpired, expiringSoon, expiryWarningDays]);

  // Check on mount and interval
  React.useEffect(() => {
    if (!isEnabled) return;

    // Initial check after data loads
    const initialTimeout = setTimeout(() => {
      showNotifications();
    }, 2000);

    // Periodic checks
    const interval = setInterval(() => {
      refetch();
    }, checkIntervalMs);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isEnabled, showNotifications, refetch, checkIntervalMs]);

  // Show notifications when data changes
  React.useEffect(() => {
    if (!isLoading && isEnabled) {
      showNotifications();
    }
  }, [isLoading, isEnabled, lowStock, expiringSoon, alreadyExpired, critical, showNotifications]);

  // Manual check
  const checkNow = React.useCallback(() => {
    refetch();
    // Clear cooldowns for immediate notification
    lastNotifiedRef.current = {};
    if (typeof window !== "undefined") {
      localStorage.removeItem(LAST_NOTIFIED_KEY);
    }
  }, [refetch]);

  return {
    isEnabled,
    setEnabled,
    lowStockCount: lowStock.length,
    expiringCount: expiringSoon.length,
    expiredCount: alreadyExpired.length,
    criticalCount: critical.length,
    totalAlerts: lowStock.length + expiringSoon.length + alreadyExpired.length,
    checkNow,
  };
}

// ==========================================
// NOTIFICATION SETTINGS COMPONENT
// ==========================================

interface NotificationSettingsProps {
  className?: string;
}

export function StorageNotificationSettings({ className }: NotificationSettingsProps) {
  const {
    isEnabled,
    setEnabled,
    lowStockCount,
    expiringCount,
    expiredCount,
    criticalCount,
    checkNow,
  } = useStorageNotifications();

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Сповіщення про склад</h3>
          <p className="text-sm text-muted-foreground">
            Автоматичні сповіщення про низький запас та терміни придатності
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
        </label>
      </div>

      {isEnabled && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-2xl font-bold text-red-700">{criticalCount}</p>
              <p className="text-xs text-red-600">Критичний запас</p>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-2xl font-bold text-amber-700">{lowStockCount}</p>
              <p className="text-xs text-amber-600">Низький запас</p>
            </div>
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-2xl font-bold text-orange-700">{expiredCount}</p>
              <p className="text-xs text-orange-600">Прострочено</p>
            </div>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-2xl font-bold text-yellow-700">{expiringCount}</p>
              <p className="text-xs text-yellow-600">Скоро закінчується</p>
            </div>
          </div>

          <button
            onClick={checkNow}
            className="w-full px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
          >
            Перевірити зараз
          </button>
        </div>
      )}
    </div>
  );
}
