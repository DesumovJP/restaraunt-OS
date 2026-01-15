'use client';

import * as React from 'react';
import {
  Layers,
  Archive,
  MessageSquare,
  CalendarDays,
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
    <AppSidebar<StorageView>
      variant="storage"
      open={open}
      onOpenChange={onOpenChange}
      navigationItems={navigationItems}
      secondaryItems={secondaryItems}
      activeView={activeView}
      onViewChange={onViewChange}
      userName={userName}
      userRole={userRole}
      showProfile={true}
      profileViewId="profile"
    />
  );
}
