'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { APP_SHORT_NAME, APP_TAGLINE } from '@/lib/branding';
import {
  LayoutDashboard,
  BarChart3,
  ArrowLeftRight,
  Bell,
  History,
  Settings,
  FileSpreadsheet,
  Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MarketStatusBadge } from './market-status';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: '/markets', label: 'Marches', icon: <BarChart3 className="h-4 w-4" /> },
  { href: '/arbitrage', label: 'Arbitrage', icon: <ArrowLeftRight className="h-4 w-4" /> },
  { href: '/signals', label: 'Signaux', icon: <Bell className="h-4 w-4" /> },
  { href: '/history', label: 'Historique', icon: <History className="h-4 w-4" /> },
  { href: '/export', label: 'Export', icon: <FileSpreadsheet className="h-4 w-4" /> },
  { href: '/settings', label: 'Parametres', icon: <Settings className="h-4 w-4" /> },
];

interface TerminalLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
      )}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

function Sidebar() {
  const pathname = usePathname();
  
  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-gold to-gold/60 flex items-center justify-center">
            <span className="text-black font-bold text-sm">{APP_SHORT_NAME}</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm text-sidebar-foreground">{APP_SHORT_NAME}</span>
            <span className="text-[10px] text-muted-foreground">{APP_TAGLINE}</span>
          </div>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
          />
        ))}
      </nav>
      
      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <MarketStatusBadge />
      </div>
    </div>
  );
}

function MobileNav() {
  const pathname = usePathname();
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0 bg-sidebar">
        <Sidebar />
      </SheetContent>
    </Sheet>
  );
}

export function TerminalLayout({ children, title, subtitle, actions }: TerminalLayoutProps) {
  const pathname = usePathname();
  
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-56 shrink-0">
        <Sidebar />
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-surface-1 shrink-0">
          <div className="flex items-center gap-3">
            <MobileNav />
            {title && (
              <div>
                <h1 className="text-lg font-semibold">{title}</h1>
                {subtitle && (
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <MarketStatusBadge />
            </div>
            {actions}
          </div>
        </header>
        
        {/* Content Area */}
        <div className="flex-1 overflow-auto terminal-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}

interface PanelGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PanelGrid({ children, cols = 2, gap = 'md', className }: PanelGridProps) {
  const colsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };
  
  const gapClass = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  };
  
  return (
    <div className={cn('grid', colsClass[cols], gapClass[gap], className)}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  className?: string;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeLabel,
  icon,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <div className={cn('terminal-panel p-4', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className={cn('text-2xl font-bold font-mono tabular-nums mt-1', valueClassName)}>
            {value}
          </p>
          {change !== undefined && (
            <p
              className={cn(
                'text-xs font-mono mt-1',
                change > 0 && 'text-[var(--positive)]',
                change < 0 && 'text-[var(--negative)]',
                change === 0 && 'text-muted-foreground'
              )}
            >
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
              {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-md bg-surface-2 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}


