'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  ScrollText,
  BarChart3,
  Users,
  CalendarDays,
  User,
  X,
  MessageSquare,
  Settings,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';

export type AdminView = 'overview' | 'logs' | 'analytics' | 'workers' | 'chat';

const navigationItems: { id: AdminView; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'overview', icon: LayoutDashboard, label: 'Огляд' },
  { id: 'logs', icon: ScrollText, label: 'Журнал дій' },
  { id: 'analytics', icon: BarChart3, label: 'Аналітика' },
  { id: 'workers', icon: Users, label: 'Робітники' },
  { id: 'chat', icon: MessageSquare, label: 'Чат' },
];

// External links (navigate to different pages)
const externalLinks: { id: string; icon: typeof LayoutDashboard; label: string; path: string }[] = [
  { id: 'schedule', icon: CalendarDays, label: 'Графік змін', path: '/dashboard/admin/schedule' },
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
  const router = useRouter();
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

  const handleNavigation = (view: AdminView) => {
    onViewChange(view);
    if (isMobile) {
      handleOpenChange(false);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex flex-col items-center gap-3 flex-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.id)}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 touch-feedback',
                'hover:bg-slate-100 active:scale-95',
                isActive
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900'
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

        {/* External links */}
        {externalLinks.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 touch-feedback',
                'hover:bg-slate-100 active:scale-95',
                'text-slate-600 hover:text-slate-900'
              )}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {/* Profile bar at bottom */}
      <div className="w-full px-2 py-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{userName}</p>
            <p className="text-[10px] text-slate-600 truncate">{userRole}</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - Always visible */}
      <aside className="hidden lg:flex w-16 bg-white border-r border-slate-200 flex-col items-center py-4 h-full">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <Drawer open={isMobileOpen} onOpenChange={handleOpenChange}>
        <DrawerContent side="left" className="flex flex-col h-full p-0 w-64 sm:w-72">
          <div className="relative flex flex-col items-start px-4 py-6 h-full bg-white">
            {/* Close button for mobile */}
            <button
              onClick={() => handleOpenChange(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Закрити"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>

            {/* Navigation items - vertical layout for mobile */}
            <div className="flex flex-col gap-1.5 w-full mt-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 min-h-[52px] rounded-xl transition-all duration-200 touch-feedback',
                      'hover:bg-slate-100 active:scale-[0.98]',
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </button>
                );
              })}

              {/* Separator */}
              <div className="h-px bg-slate-200 my-3" />

              {/* External links */}
              {externalLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      router.push(item.path);
                      handleOpenChange(false);
                    }}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3.5 min-h-[52px] rounded-xl transition-all duration-200 touch-feedback',
                      'hover:bg-slate-100 active:scale-[0.98]',
                      'text-slate-600 hover:text-slate-900'
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Profile bar at bottom */}
            <div className="mt-auto w-full px-4 py-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{userName}</p>
                  <p className="text-xs text-slate-600 truncate">{userRole}</p>
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
