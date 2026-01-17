'use client';

import * as React from 'react';
import {
  ClipboardList,
  ChefHat,
  MessageSquare,
  CalendarDays,
  ListTodo,
} from 'lucide-react';
import { AppSidebar, type NavigationItem } from '@/components/layout/app-sidebar';

export type ChefView = 'orders' | 'recipes' | 'stations' | 'calendar' | 'dailies' | 'chat' | 'schedule' | 'profile';

// Main kitchen functionality
const defaultNavigationItems: NavigationItem<ChefView>[] = [
  { id: 'orders', icon: ClipboardList, label: 'Замовлення', path: '/kitchen' },
  { id: 'recipes', icon: ChefHat, label: 'Рецепти', path: '/kitchen?view=recipes' },
];

// Common items - communication, scheduling (all navigate to kitchen page with view param)
const commonItems: NavigationItem<ChefView>[] = [
  { id: 'dailies', icon: ListTodo, label: 'Завдання', path: '/kitchen?view=dailies' },
  { id: 'chat', icon: MessageSquare, label: 'Чат', path: '/kitchen?view=chat' },
  { id: 'schedule', icon: CalendarDays, label: 'Графік змін', path: '/kitchen?view=schedule' },
];

interface ChefLeftSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  userName?: string;
  userRole?: string;
  activeView: ChefView;
  onViewChange: (view: ChefView) => void;
  navigationItems?: NavigationItem<ChefView>[];
}

export function ChefLeftSidebar({
  open,
  onOpenChange,
  userName = 'Шеф-кухар',
  userRole = 'Кухня',
  activeView,
  onViewChange,
  navigationItems = defaultNavigationItems,
}: ChefLeftSidebarProps) {
  return (
    <AppSidebar<ChefView>
      variant="kitchen"
      open={open}
      onOpenChange={onOpenChange}
      navigationItems={navigationItems}
      externalLinks={commonItems}
      activeView={activeView}
      onViewChange={onViewChange}
      userName={userName}
      userRole={userRole}
      showProfile={true}
      profileViewId="profile"
      profilePath="/kitchen?view=profile"
    />
  );
}
