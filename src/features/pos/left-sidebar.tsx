'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  Calendar,
  List,
  MessageCircle,
  HelpCircle,
  User,
  X,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
} from '@/components/ui/drawer';

const navigationItems = [
  { id: 'menu', icon: LayoutGrid, path: '/pos/waiter', label: 'Menu' },
  { id: 'calendar', icon: Calendar, path: '/pos/waiter/calendar', label: 'Calendar' },
  { id: 'orders', icon: List, path: '/pos/waiter/orders', label: 'Orders' },
  { id: 'messages', icon: MessageCircle, path: '/pos/waiter/messages', label: 'Messages' },
  { id: 'help', icon: HelpCircle, path: '/pos/waiter/help', label: 'Help' },
];

interface LeftSidebarProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  userName?: string;
  userRole?: string;
}

export function LeftSidebar({ 
  open, 
  onOpenChange,
  userName = 'Courtney Henry',
  userRole = 'Cashier 1st Shift',
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
    // Navigate to available pages
    if (path === '/pos/waiter' || path === '/pos/waiter/calendar') {
      router.push(path);
    }
    // Close drawer on mobile after navigation
    if (isMobile) {
      handleOpenChange(false);
    }
  };

  const SidebarContent = () => (
    <>
      <div className="flex flex-col items-center gap-6 flex-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || (item.id === 'menu' && pathname === '/pos/waiter');

          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item.path)}
              className={cn(
                'w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200',
                'hover:bg-slate-100 active:scale-95',
                isActive
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-600 hover:text-slate-900'
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
      <aside className="hidden lg:flex w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 h-full">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <Drawer open={isMobileOpen} onOpenChange={handleOpenChange} side="left">
        <DrawerContent className="flex flex-col h-full p-0 w-64 sm:w-72">
          <div className="relative flex flex-col items-start px-4 py-6 h-full bg-white">
            {/* Close button for mobile */}
            <button
              onClick={() => handleOpenChange(false)}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
            
            {/* Navigation items - vertical layout for mobile */}
            <div className="flex flex-col gap-2 w-full mt-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path || (item.id === 'menu' && pathname === '/pos/waiter');

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                      'hover:bg-slate-100 active:scale-95',
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'text-slate-600 hover:text-slate-900'
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Profile bar at bottom */}
            <div className="mt-auto w-full px-4 py-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
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

