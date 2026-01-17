'use client';

import * as React from 'react';
import {
  Layers,
  Archive,
  MessageSquare,
  CalendarDays,
  FileBarChart,
  ListTodo,
  Truck,
} from 'lucide-react';
import { AppSidebar, type NavigationItem } from '@/components/layout/app-sidebar';

export type StorageView = 'inventory' | 'batches' | 'reports' | 'waste' | 'dailies' | 'chat' | 'schedule' | 'profile';

// Main storage functionality
const defaultNavigationItems: NavigationItem<StorageView>[] = [
  { id: 'inventory', icon: Layers, label: 'Інвентар', path: '/storage' },
  { id: 'batches', icon: Archive, label: 'Партії', path: '/storage?view=batches' },
];

// Reports and analytics - directly related to storage functionality
const analyticsItems: NavigationItem<string>[] = [
  { id: 'delivery', icon: Truck, label: 'Поставки', path: '/storage/delivery' },
  { id: 'reports', icon: FileBarChart, label: 'Журнал руху', path: '/storage/reports' },
];

// Common items - tasks, communication, scheduling (all navigate to main storage page with view param)
const commonItems: NavigationItem<StorageView>[] = [
  { id: 'dailies', icon: ListTodo, label: 'Завдання', path: '/storage?view=dailies' },
  { id: 'chat', icon: MessageSquare, label: 'Чат', path: '/storage?view=chat' },
  { id: 'schedule', icon: CalendarDays, label: 'Графік змін', path: '/storage?view=schedule' },
];

interface StorageLeftSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  userName?: string;
  userRole?: string;
  activeView: StorageView;
  onViewChange: (view: StorageView) => void;
  navigationItems?: NavigationItem<StorageView>[];
}

export function StorageLeftSidebar({
  open,
  onOpenChange,
  userName = 'Комірник',
  userRole = 'Склад',
  activeView,
  onViewChange,
  navigationItems = defaultNavigationItems,
}: StorageLeftSidebarProps) {
  return (
    <AppSidebar<StorageView | string>
      variant="storage"
      open={open}
      onOpenChange={onOpenChange}
      navigationItems={navigationItems}
      secondaryItems={analyticsItems}
      externalLinks={commonItems}
      activeView={activeView}
      onViewChange={onViewChange as (view: StorageView | string) => void}
      userName={userName}
      userRole={userRole}
      showProfile={true}
      profileViewId="profile"
      profilePath="/storage?view=profile"
    />
  );
}
