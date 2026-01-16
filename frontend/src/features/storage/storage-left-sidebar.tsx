'use client';

import * as React from 'react';
import {
  Layers,
  Archive,
  MessageSquare,
  CalendarDays,
  FileBarChart,
  Trash2,
} from 'lucide-react';
import { AppSidebar, type NavigationItem } from '@/components/layout/app-sidebar';

export type StorageView = 'inventory' | 'batches' | 'chat' | 'schedule' | 'profile';

const defaultNavigationItems: NavigationItem<StorageView>[] = [
  { id: 'inventory', icon: Layers, label: 'Інвентар' },
  { id: 'batches', icon: Archive, label: 'Партії' },
];

const secondaryItems: NavigationItem<StorageView>[] = [
  { id: 'chat', icon: MessageSquare, label: 'Чат' },
  { id: 'schedule', icon: CalendarDays, label: 'Графік змін' },
];

// External page links (use 'reports' and 'waste' as ids for typing, with path for navigation)
const externalPageLinks: NavigationItem<string>[] = [
  { id: 'reports', icon: FileBarChart, label: 'Звіти витрат', path: '/storage/reports' },
  { id: 'waste', icon: Trash2, label: 'Аналітика втрат', path: '/storage/waste' },
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
      secondaryItems={secondaryItems}
      externalLinks={externalPageLinks}
      activeView={activeView}
      onViewChange={onViewChange as (view: StorageView | string) => void}
      userName={userName}
      userRole={userRole}
      showProfile={true}
      profileViewId="profile"
    />
  );
}
