import { type ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { LogOut, Menu } from 'lucide-react';
import { IconButton } from './icon-button';
import { useAuth } from '../../hooks/use-auth';
import { useMobile } from '../../hooks/use-mobile';
import { useSidebarStore } from '../../stores/sidebar.store';
import { ThemeToggle } from './theme-toggle';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

interface SidebarLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  title: string;
  fullHeight?: boolean;
}

export function SidebarLayout({ children, navItems, title, fullHeight }: SidebarLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMobile();
  const { isOpen, open, close } = useSidebarStore();

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile) close();
  }, [location.pathname, isMobile, close]);

  const sidebarContent = (
    <>
      {/* Header com brand gradient */}
      <div className="flex h-14 items-center brand-gradient px-5">
        <div className="flex items-center gap-2.5">
          <img
            src="/cloup-one-brand.svg"
            alt={title}
            className="h-7 w-auto brand-logo-shadow"
          />
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
                isActive
                  ? 'bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.15)]'
                  : 'text-text-tertiary hover:bg-surface-3 hover:text-text-secondary'
              }`}
            >
              <span className={isActive ? 'text-accent' : 'text-text-muted'}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 flex items-center justify-between px-3">
          <div className="truncate text-xs font-medium text-text-tertiary">
            {user?.name}
          </div>
          <ThemeToggle />
        </div>
        <button
          onClick={() => void logout()}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-text-muted hover:bg-surface-3 hover:text-text-secondary transition-colors"
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-dvh flex-col bg-surface-0">
      <div className="flex flex-1 min-h-0">
        {/* Mobile overlay */}
        {isMobile && isOpen && (
          <div className="fixed inset-0 z-40">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={close} />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-[min(18rem,calc(100vw-3rem))] flex-col border-r border-border glass animate-slide-in-right safe-top">
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-60 flex-col border-r border-border glass">
          {sidebarContent}
        </aside>

        <main className={`flex-1 ${fullHeight ? 'flex flex-col overflow-hidden' : 'overflow-auto'}`}>
          {isMobile && (
            <div className="flex h-14 items-center border-b border-border px-4">
              <IconButton onClick={open} aria-label="Abrir menu">
                <Menu size={20} />
              </IconButton>
              <h1 className="ml-3 text-sm font-bold text-text-primary">{title}</h1>
            </div>
          )}
          {fullHeight ? children : (
            <div className="p-4 lg:p-8 animate-fade-in">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
