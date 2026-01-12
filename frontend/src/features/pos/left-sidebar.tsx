'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  User,
  X,
  Grid3X3,
  ListTodo,
  CalendarCheck,
  MessageSquare,
  CalendarDays,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';

export type WaiterNavView = 'tables' | 'menu' | 'calendar' | 'dailies' | 'chat' | 'schedule' | 'profile';

// Навігаційні елементи - сторінки
const pageNavigationItems = [
  { id: 'tables' as const, icon: Grid3X3, path: '/pos/waiter/tables', label: 'Столи' },
  { id: 'menu' as const, icon: LayoutGrid, path: '/pos/waiter', label: 'Меню' },
  { id: 'calendar' as const, icon: CalendarCheck, path: '/pos/waiter/calendar', label: 'Календар' },
];

// Вкладки всередині сторінки меню
const viewNavigationItems = [
  { id: 'dailies' as const, icon: ListTodo, label: 'Завдання' },
  { id: 'chat' as const, icon: MessageSquare, label: 'Чат' },
  { id: 'schedule' as const, icon: CalendarDays, label: 'Графік змін' },
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
  userName = 'Courtney Henry',
  userRole = 'Cashier 1st Shift',
  activeView,
  onViewChange,
}: LeftSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    if (typeof window !== 'undefined') {
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
    }
  }, []);

  React.useEffect(() => {
    if (open !== undefined) {
      setIsMobileOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsMobileOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleNavigation = (path: string) => {
    router.push(path as never);
    // Close drawer on mobile after navigation
    if (isMobile) {
      handleOpenChange(false);
    }
  };

  const handleViewChange = (view: WaiterNavView) => {
    if (onViewChange) {
      onViewChange(view);
    }
    if (isMobile) {
      handleOpenChange(false);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex flex-col items-center gap-3 flex-1">
        {/* Page navigation */}
        {pageNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = (pathname === item.path || (item.id === 'menu' && pathname === '/pos/waiter')) && activeView !== 'dailies';

          return (
            <button
              key={item.id}
              onClick={() => {
                // If clicking menu while on menu page, reset to menu view
                if (item.id === 'menu' && pathname === '/pos/waiter') {
                  handleViewChange('menu');
                } else {
                  handleNavigation(item.path);
                }
              }}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                'transition-colors duration-150',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              )}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}

        {/* Separator */}
        <div className="w-8 h-px bg-slate-200 my-1" />

        {/* View navigation (tabs within current page) */}
        {viewNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleViewChange(item.id)}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                'transition-colors duration-150',
                isActive
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              )}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {/* Profile - компактний */}
      <button
        onClick={() => handleViewChange('profile')}
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-150',
          activeView === 'profile'
            ? 'bg-slate-900 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        )}
        title={`${userName} • ${userRole}`}
      >
        <User className="w-5 h-5" />
      </button>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - Always visible */}
      <aside className="hidden lg:flex w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 h-full">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <Drawer open={isMobileOpen} onOpenChange={handleOpenChange}>
        <DrawerContent side="left" className="flex flex-col h-full p-0 w-64">
          <div className="flex flex-col px-4 py-4 h-full bg-white">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-slate-900">Меню</span>
              <button
                onClick={() => handleOpenChange(false)}
                className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-slate-100"
                aria-label="Закрити"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Page Navigation */}
            <div className="flex flex-col gap-1 flex-1">
              {pageNavigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = (pathname === item.path || (item.id === 'menu' && pathname === '/pos/waiter')) && activeView !== 'dailies';

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'menu' && pathname === '/pos/waiter') {
                        handleViewChange('menu');
                      } else {
                        handleNavigation(item.path);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 px-4 h-12 rounded-lg',
                      'transition-colors duration-150',
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}

              {/* Separator */}
              <div className="h-px bg-slate-200 my-2" />

              {/* View Navigation (tabs) */}
              {viewNavigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={cn(
                      'flex items-center gap-3 px-4 h-12 rounded-lg',
                      'transition-colors duration-150',
                      isActive
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Profile */}
            <button
              onClick={() => handleViewChange('profile')}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-colors",
                activeView === 'profile'
                  ? "bg-slate-900 text-white"
                  : "bg-slate-50 hover:bg-slate-100"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                activeView === 'profile' ? "bg-white/20" : "bg-slate-200"
              )}>
                <User className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className={cn("text-sm font-medium", activeView === 'profile' ? "text-white" : "text-slate-900")}>{userName}</p>
                <p className={cn("text-xs", activeView === 'profile' ? "text-white/70" : "text-slate-500")}>{userRole}</p>
              </div>
            </button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

