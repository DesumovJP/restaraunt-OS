'use client';

import * as React from 'react';
import {
  Grid3X3,
  ListTodo,
  CalendarCheck,
  MessageSquare,
  CalendarDays,
} from 'lucide-react';
import { AppSidebar, type NavigationItem } from '@/components/layout/app-sidebar';

export type WaiterNavView = 'tables' | 'menu' | 'calendar' | 'dailies' | 'chat' | 'schedule' | 'profile';

// Page navigation items (navigate to different routes)
const pageNavigationItems: NavigationItem<WaiterNavView>[] = [
  { id: 'tables', icon: Grid3X3, label: 'Столи', path: '/pos/waiter/tables' },
  { id: 'calendar', icon: CalendarCheck, label: 'Календар', path: '/pos/waiter/calendar' },
];

// View navigation items (change view within page)
const viewNavigationItems: NavigationItem<WaiterNavView>[] = [
  { id: 'dailies', icon: ListTodo, label: 'Завдання' },
  { id: 'chat', icon: MessageSquare, label: 'Чат' },
  { id: 'schedule', icon: CalendarDays, label: 'Графік змін' },
];

interface LeftSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  userName?: string;
  userRole?: string;
  activeView?: WaiterNavView;
  onViewChange?: (view: WaiterNavView) => void;
}

export function LeftSidebar({
  open,
  onOpenChange,
  userName = 'Офіціант',
  userRole = 'POS',
  activeView = 'menu',
  onViewChange,
}: LeftSidebarProps) {
  const handleViewChange = (view: WaiterNavView | string) => {
    if (onViewChange) {
      onViewChange(view as WaiterNavView);
    }
  };

  return (
    <AppSidebar<WaiterNavView | string>
      variant="pos"
      open={open}
      onOpenChange={onOpenChange}
      navigationItems={pageNavigationItems}
      externalLinks={viewNavigationItems}
      activeView={activeView}
      onViewChange={handleViewChange}
      userName={userName}
      userRole={userRole}
      showProfile={true}
      profileViewId="profile"
    />
  );
}
