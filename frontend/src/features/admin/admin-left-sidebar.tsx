'use client';

import * as React from 'react';
import {
  LayoutDashboard,
  ScrollText,
  BarChart3,
  Users,
  CalendarDays,
  MessageSquare,
} from 'lucide-react';
import { AppSidebar, type NavigationItem } from '@/components/layout/app-sidebar';

export type AdminView = 'overview' | 'logs' | 'analytics' | 'workers' | 'chat' | 'profile';

const navigationItems: NavigationItem<AdminView>[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Огляд' },
  { id: 'logs', icon: ScrollText, label: 'Журнал дій' },
  { id: 'analytics', icon: BarChart3, label: 'Аналітика' },
  { id: 'workers', icon: Users, label: 'Робітники' },
  { id: 'chat', icon: MessageSquare, label: 'Чат' },
];

const externalLinks: NavigationItem<AdminView>[] = [
  { id: 'schedule' as AdminView, icon: CalendarDays, label: 'Графік змін', path: '/dashboard/admin/schedule' },
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
      navigationItems={navigationItems}
      externalLinks={externalLinks}
      activeView={activeView}
      onViewChange={onViewChange}
      userName={userName}
      userRole={userRole}
      showProfile={true}
      profileViewId="profile"
    />
  );
}
