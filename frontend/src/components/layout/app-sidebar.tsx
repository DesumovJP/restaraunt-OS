'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, User, X, type LucideIcon } from 'lucide-react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';

// ============================================================================
// Types
// ============================================================================

export type SidebarVariant = 'admin' | 'pos' | 'kitchen' | 'storage';

export interface NavigationItem<T extends string = string> {
  id: T;
  icon: LucideIcon;
  label: string;
  /** If provided, navigates to this path instead of calling onViewChange */
  path?: string;
}

export interface AppSidebarProps<T extends string = string> {
  /** Visual variant that determines colors */
  variant: SidebarVariant;
  /** Whether the mobile drawer is open */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Primary navigation items */
  navigationItems: NavigationItem<T>[];
  /** Secondary navigation items (shown after separator) */
  secondaryItems?: NavigationItem<T>[];
  /** External links (shown after second separator) */
  externalLinks?: NavigationItem<T>[];
  /** Currently active view */
  activeView: T;
  /** Callback when view changes (for internal navigation) */
  onViewChange: (view: T) => void;
  /** User display name */
  userName?: string;
  /** User role/position */
  userRole?: string;
  /** Whether to show profile button */
  showProfile?: boolean;
  /** Profile view id (defaults to 'profile') */
  profileViewId?: T;
  /** Custom class for desktop sidebar */
  className?: string;
  /** Custom class for mobile drawer */
  drawerClassName?: string;
}

// ============================================================================
// Variant Styles
// ============================================================================

const variantStyles: Record<SidebarVariant, {
  activeDesktop: string;
  activeMobile: string;
  inactive: string;
  profileActive: string;
  profileInactive: string;
  profileAvatar: string;
  profileAvatarActive: string;
}> = {
  admin: {
    activeDesktop: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25',
    activeMobile: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25',
    inactive: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    profileActive: 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-500',
    profileInactive: 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200/80 hover:bg-slate-100',
    profileAvatar: 'bg-gradient-to-br from-blue-500 to-blue-600',
    profileAvatarActive: 'bg-white/20',
  },
  pos: {
    activeDesktop: 'bg-slate-900 text-white shadow-lg shadow-slate-900/20',
    activeMobile: 'bg-slate-900 text-white shadow-lg shadow-slate-900/20',
    inactive: 'text-slate-500 hover:bg-slate-100 hover:text-slate-700',
    profileActive: 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg shadow-slate-900/20 border-transparent',
    profileInactive: 'bg-slate-50 border-slate-100 hover:bg-slate-100',
    profileAvatar: 'bg-gradient-to-br from-slate-800 to-slate-900',
    profileAvatarActive: 'bg-white/20',
  },
  kitchen: {
    activeDesktop: 'bg-orange-600 text-white shadow-lg shadow-orange-600/25',
    activeMobile: 'bg-orange-600 text-white shadow-lg shadow-orange-600/25',
    inactive: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    profileActive: 'bg-orange-600 border-orange-600',
    profileInactive: 'bg-slate-50 border-slate-200 hover:bg-slate-100',
    profileAvatar: 'bg-gradient-to-br from-orange-500 to-orange-600',
    profileAvatarActive: 'bg-white/20',
  },
  storage: {
    activeDesktop: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25',
    activeMobile: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25',
    inactive: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    profileActive: 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-500',
    profileInactive: 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200/80 hover:bg-slate-100',
    profileAvatar: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
    profileAvatarActive: 'bg-white/20',
  },
};

// ============================================================================
// Component
// ============================================================================

export function AppSidebar<T extends string = string>({
  variant,
  open,
  onOpenChange,
  navigationItems,
  secondaryItems = [],
  externalLinks = [],
  activeView,
  onViewChange,
  userName = 'Користувач',
  userRole = 'Роль',
  showProfile = true,
  profileViewId = 'profile' as T,
  className,
  drawerClassName,
}: AppSidebarProps<T>) {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  const styles = variantStyles[variant];

  // Detect mobile
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

  // Sync external open state
  React.useEffect(() => {
    if (open !== undefined) {
      setIsMobileOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsMobileOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  const handleNavigation = (item: NavigationItem<T>) => {
    if (item.path) {
      router.push(item.path as Parameters<typeof router.push>[0]);
    } else {
      onViewChange(item.id);
    }
    if (isMobile) {
      handleOpenChange(false);
    }
  };

  const handleProfileClick = () => {
    onViewChange(profileViewId);
    if (isMobile) {
      handleOpenChange(false);
    }
  };

  // Home button handler
  const handleHomeClick = () => {
    router.push('/');
    if (isMobile) {
      handleOpenChange(false);
    }
  };

  // Desktop sidebar content (icons only)
  const DesktopContent = () => (
    <>
      <div className="flex flex-col items-center gap-3 flex-1">
        {/* Home button */}
        <button
          onClick={handleHomeClick}
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 touch-feedback',
            'hover:scale-105 active:scale-95',
            styles.inactive
          )}
          aria-label="На головну"
          title="На головну"
        >
          <Home className="w-5 h-5" />
        </button>

        {/* Separator after home */}
        <div className="w-8 h-px bg-slate-200 my-1" />

        {/* Primary navigation */}
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 touch-feedback',
                'hover:scale-105 active:scale-95',
                isActive ? styles.activeDesktop : styles.inactive
              )}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}

        {/* Separator after primary */}
        {(secondaryItems.length > 0 || externalLinks.length > 0) && (
          <div className="w-8 h-px bg-slate-200 my-1" />
        )}

        {/* Secondary navigation */}
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 touch-feedback',
                'hover:scale-105 active:scale-95',
                isActive ? styles.activeDesktop : styles.inactive
              )}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}

        {/* Separator before external links */}
        {secondaryItems.length > 0 && externalLinks.length > 0 && (
          <div className="w-8 h-px bg-slate-200 my-1" />
        )}

        {/* External links */}
        {externalLinks.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 touch-feedback',
                'hover:scale-105 active:scale-95',
                styles.inactive
              )}
              aria-label={item.label}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {/* Profile button at bottom - desktop compact */}
      {showProfile && (
        <button
          onClick={handleProfileClick}
          className={cn(
            'w-12 flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200 touch-feedback',
            'hover:scale-105 active:scale-95',
            activeView === profileViewId ? styles.activeDesktop : styles.inactive
          )}
          aria-label="Профіль"
          title="Профіль"
        >
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center shadow-sm',
            activeView === profileViewId ? 'bg-white/20' : styles.profileAvatar
          )}>
            <User className="w-4 h-4 text-white" />
          </div>
          <span className={cn(
            'text-[9px] sm:text-[10px] font-medium',
            activeView === profileViewId ? 'text-white' : 'text-slate-600'
          )}>
            Профіль
          </span>
        </button>
      )}
    </>
  );

  // Mobile drawer content (full labels)
  const MobileContent = () => (
    <div className="relative flex flex-col h-full bg-white px-4 py-6">
      {/* Close button */}
      <button
        onClick={() => handleOpenChange(false)}
        className="absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 active:bg-slate-200 transition-colors touch-feedback"
        aria-label="Закрити"
      >
        <X className="w-5 h-5 text-slate-600" />
      </button>

      {/* Navigation */}
      <div className="flex flex-col gap-1.5 mt-10 flex-1">
        {/* Home button */}
        <button
          onClick={handleHomeClick}
          className={cn(
            'flex items-center gap-3 px-4 py-3.5 min-h-[52px] rounded-xl transition-all duration-200 touch-feedback',
            'active:scale-[0.98]',
            styles.inactive
          )}
        >
          <Home className="w-5 h-5" />
          <span className="font-semibold text-sm">На головну</span>
        </button>

        {/* Separator after home */}
        <div className="h-px bg-slate-200 my-3" />

        {/* Primary navigation */}
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 min-h-[52px] rounded-xl transition-all duration-200 touch-feedback',
                'active:scale-[0.98]',
                isActive ? styles.activeMobile : styles.inactive
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          );
        })}

        {/* Separator */}
        {(secondaryItems.length > 0 || externalLinks.length > 0) && (
          <div className="h-px bg-slate-200 my-3" />
        )}

        {/* Secondary navigation */}
        {secondaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 min-h-[52px] rounded-xl transition-all duration-200 touch-feedback',
                'active:scale-[0.98]',
                isActive ? styles.activeMobile : styles.inactive
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          );
        })}

        {/* Separator before external links */}
        {secondaryItems.length > 0 && externalLinks.length > 0 && (
          <div className="h-px bg-slate-200 my-3" />
        )}

        {/* External links */}
        {externalLinks.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigation(item)}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5 min-h-[52px] rounded-xl transition-all duration-200 touch-feedback',
                'active:scale-[0.98]',
                styles.inactive
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Profile bar - mobile expanded */}
      {showProfile && (
        <button
          onClick={handleProfileClick}
          className={cn(
            'flex items-center gap-3 px-4 py-4 rounded-xl border transition-all duration-200 touch-feedback shadow-sm',
            activeView === profileViewId ? styles.profileActive : styles.profileInactive
          )}
        >
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md',
            activeView === profileViewId ? styles.profileAvatarActive : styles.profileAvatar
          )}>
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className={cn(
              'text-sm font-bold truncate',
              activeView === profileViewId ? 'text-white' : 'text-slate-900'
            )}>
              {userName}
            </p>
            <p className={cn(
              'text-xs truncate',
              activeView === profileViewId ? 'text-white/70' : 'text-slate-600'
            )}>
              {userRole}
            </p>
          </div>
        </button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex w-16 bg-white border-r border-slate-200 flex-col items-center py-4 h-full',
        className
      )}>
        <DesktopContent />
      </aside>

      {/* Mobile Drawer */}
      <Drawer open={isMobileOpen} onOpenChange={handleOpenChange}>
        <DrawerContent
          side="left"
          className={cn('flex flex-col h-full p-0 w-72 sm:w-80', drawerClassName)}
        >
          <MobileContent />
        </DrawerContent>
      </Drawer>
    </>
  );
}
