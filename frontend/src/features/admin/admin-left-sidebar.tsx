'use client';

import * as React from 'react';
import {
  LayoutDashboard,
  ScrollText,
  BarChart3,
  Users,
  CalendarDays,
  MessageSquare,
  ListTodo,
} from 'lucide-react';
import { AppSidebar, type NavigationItem } from '@/components/layout/app-sidebar';

export type AdminView = 'overview' | 'logs' | 'analytics' | 'workers' | 'dailies' | 'chat' | 'schedule' | 'profile';

// Main item - dashboard overview
const mainItems: NavigationItem<AdminView>[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Огляд' },
];

// Dashboard tabs - specific admin functionality
const dashboardTabs: NavigationItem<AdminView>[] = [
  { id: 'logs', icon: ScrollText, label: 'Журнал дій' },
  { id: 'analytics', icon: BarChart3, label: 'Аналітика' },
  { id: 'workers', icon: Users, label: 'Робітники' },
];

// Common items - tasks, communication, scheduling
const commonItems: NavigationItem<AdminView>[] = [
  { id: 'dailies', icon: ListTodo, label: 'Завдання' },
  { id: 'chat', icon: MessageSquare, label: 'Чат' },
  { id: 'schedule', icon: CalendarDays, label: 'Графік змін' },
];

interface AdminLeftSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  userName?: string;
  userRole?: string;
  activeView: AdminView;
  onViewChange: (view: AdminView) => void;
}

export function AdminLeftSidebar({
  open,
  onOpenChange,
  userName = 'Адміністратор',
  userRole = 'Менеджер',
  activeView,
  onViewChange,
}: AdminLeftSidebarProps) {
  return (
    <AppSidebar<AdminView>
      variant="admin"
      open={open}
      onOpenChange={onOpenChange}
      navigationItems={mainItems}
      secondaryItems={dashboardTabs}
      externalLinks={commonItems}
      activeView={activeView}
      onViewChange={onViewChange}
      userName={userName}
      userRole={userRole}
      showProfile={true}
      profileViewId="profile"
    />
  );
}
