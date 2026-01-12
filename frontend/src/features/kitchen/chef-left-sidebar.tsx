'use client';

import * as React from 'react';
import {
  ClipboardList,
  ChefHat,
  MessageSquare,
  CalendarDays,
} from 'lucide-react';
import { AppSidebar, type NavigationItem } from '@/components/layout/app-sidebar';

export type ChefView = 'orders' | 'recipes' | 'stations' | 'calendar' | 'dailies' | 'chat' | 'schedule' | 'profile';

const defaultNavigationItems: NavigationItem<ChefView>[] = [
  { id: 'orders', icon: ClipboardList, label: 'Замовлення' },
  { id: 'recipes', icon: ChefHat, label: 'Рецепти' },
];

const secondaryItems: NavigationItem<ChefView>[] = [
  { id: 'chat', icon: MessageSquare, label: 'Чат' },
  { id: 'schedule', icon: CalendarDays, label: 'Графік змін' },
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
