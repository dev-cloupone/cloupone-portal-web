import { type ReactNode, useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router';
import { LogOut, Menu, ChevronRight, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { IconButton } from './icon-button';
import { useAuth } from '../../hooks/use-auth';
import { useMobile } from '../../hooks/use-mobile';
import { useSidebarStore } from '../../stores/sidebar.store';
import { ThemeToggle } from './theme-toggle';
import { type NavEntry, type NavItem, type NavGroup, isNavGroup } from '../../hooks/use-nav-items';

interface SidebarLayoutProps {
  children: ReactNode;
  navItems: NavEntry[];
  title: string;
  fullHeight?: boolean;
}

function NavLink({ item, isActive, collapsed }: { item: NavItem; isActive: boolean; collapsed?: boolean }) {
  return (
    <Link
      to={item.path}
      title={collapsed ? item.label : undefined}
      className={`flex items-center rounded-lg py-2 text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
        collapsed ? 'justify-center px-2' : 'gap-2.5 px-3'
      } ${
        isActive
          ? 'bg-accent/10 text-accent shadow-[inset_0_0_0_1px_rgba(59,130,246,0.15)]'
          : 'text-text-tertiary hover:bg-surface-3 hover:text-text-secondary'
      }`}
    >
      <span className={isActive ? 'text-accent' : 'text-text-muted'}>{item.icon}</span>
      {!collapsed && item.label}
    </Link>
  );
}

function NavGroupSection({
  group,
  isExpanded,
  onToggle,
  pathname,
  collapsed,
}: {
  group: NavGroup;
  isExpanded: boolean;
  onToggle: () => void;
  pathname: string;
  collapsed?: boolean;
}) {
  const hasActiveItem = group.items.some((item) => pathname === item.path);

  if (collapsed) {
    return (
      <div className="border-t border-border pt-2 space-y-0.5">
        {group.items.map((item) => (
          <NavLink key={item.path} item={item} isActive={pathname === item.path} collapsed />
        ))}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted hover:text-text-secondary transition-colors"
      >
        <ChevronRight
          size={12}
          className={`transition-transform duration-200 ${isExpanded || hasActiveItem ? 'rotate-90' : ''}`}
        />
        {group.group}
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          isExpanded || hasActiveItem ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink key={item.path} item={item} isActive={pathname === item.path} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SidebarLayout({ children, navItems, title, fullHeight }: SidebarLayoutProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const isMobile = useMobile();
  const { isOpen, isCollapsed, open, close, toggleCollapse } = useSidebarStore();

  const groupNames = useMemo(
    () => navItems.filter(isNavGroup).map((g) => g.group),
    [navItems],
  );

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groupNames.map((name) => [name, false])),
  );

  // Sync expanded state when group names change (role switch)
  useEffect(() => {
    setExpandedGroups((prev) => {
      const next: Record<string, boolean> = {};
      for (const name of groupNames) {
        next[name] = prev[name] ?? false;
      }
      return next;
    });
  }, [groupNames]);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    if (isMobile) close();
  }, [location.pathname, isMobile, close]);

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const renderSidebarContent = (collapsed: boolean, showToggle: boolean) => (
    <>
      {/* Header com brand gradient */}
      <div className={`flex h-14 items-center brand-gradient ${collapsed ? 'flex-col justify-center px-2' : 'justify-between px-5'}`}>
        {collapsed ? (
          <img
            src="/favicon.png"
            alt={title}
            className="h-6 w-6 object-contain brand-logo-shadow"
          />
        ) : (
          <>
            <img
              src="/cloup-one-brand.svg"
              alt={title}
              className="h-7 w-auto brand-logo-shadow"
            />
            {showToggle && (
              <button
                onClick={toggleCollapse}
                title="Colapsar menu"
                className="flex items-center justify-center rounded-lg p-1.5 text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <PanelLeftClose size={16} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Botao expandir (colapsado, abaixo do header) */}
      {collapsed && showToggle && (
        <div className="flex justify-center py-2">
          <button
            onClick={toggleCollapse}
            title="Expandir menu"
            className="flex items-center justify-center rounded-lg p-2 text-text-muted hover:bg-surface-3 hover:text-text-secondary transition-colors"
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
      )}

      <nav className={`flex-1 overflow-y-auto py-3 space-y-2 ${collapsed ? 'px-1.5' : 'px-3'}`}>
        {navItems.map((entry) => {
          if (isNavGroup(entry)) {
            return (
              <NavGroupSection
                key={entry.group}
                group={entry}
                isExpanded={expandedGroups[entry.group] ?? false}
                onToggle={() => toggleGroup(entry.group)}
                pathname={location.pathname}
                collapsed={collapsed}
              />
            );
          }
          return (
            <NavLink
              key={entry.path}
              item={entry}
              isActive={location.pathname === entry.path}
              collapsed={collapsed}
            />
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => void logout()}
              title="Sair"
              className="flex items-center justify-center rounded-lg p-2 text-text-muted hover:bg-surface-3 hover:text-text-secondary transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <>
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
          </>
        )}
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
              {renderSidebarContent(false, false)}
            </aside>
          </div>
        )}

        {/* Desktop sidebar */}
        <aside className={`hidden lg:flex ${isCollapsed ? 'w-16' : 'w-60'} flex-col border-r border-border glass transition-[width] duration-200`}>
          {renderSidebarContent(isCollapsed, true)}
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
