'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  UploadCloud, 
  MessageSquare, 
  Columns, 
  BarChart3, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import { useUIStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Dokumen Regulasi', href: '/documents', icon: FileText },
  { label: 'Upload Dokumen', href: '/upload', icon: UploadCloud },
  { label: 'Tanya Regulasi', href: '/query', icon: MessageSquare },
  { label: 'Bandingkan Regulasi', href: '/compare', icon: Columns },
  { label: 'Evaluasi RAGAS', href: '/eval', icon: BarChart3 },
  { label: 'Pengaturan', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarExpanded, toggleSidebar } = useUIStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Sidebar Trigger (Header overlay button) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg glass-panel hover:bg-primary/10 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5 text-foreground" />
      </button>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={cn(
          "md:hidden fixed top-0 bottom-0 left-0 z-50 w-64 glass-panel border-r border-card-border p-4 transition-transform duration-300 ease-in-out flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-info flex items-center justify-center font-bold text-white shadow-md shadow-primary/20">
              R
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Ragi Instant
            </span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg hover:bg-card-border text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  Active
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        
        <div className="pt-4 border-t border-card-border text-center text-xs text-muted-foreground">
          v0.1.0 • Ready
        </div>
      </aside>

      {/* Desktop Sidebar (Collapsible) */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 border-r border-card-border glass-panel transition-all duration-300 ease-in-out z-30 select-none",
          sidebarExpanded ? "w-64 p-5" : "w-16 p-3 items-center"
        )}
      >
        {/* Sidebar Brand Logo */}
        <div className={cn(
          "flex items-center mb-8 w-full transition-all duration-300",
          sidebarExpanded ? "justify-between" : "justify-center"
        )}>
          {sidebarExpanded ? (
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-primary to-info flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
                R
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  Ragi Instant
                </span>
                <span className="text-[10px] text-primary font-semibold tracking-wider uppercase">
                  Regulatory AI
                </span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-primary to-info flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20">
              R
            </div>
          )}

          {sidebarExpanded && (
            <button
              onClick={toggleSidebar}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-card-border transition-colors hidden lg:block"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sidebar Expand Button (when collapsed) */}
        {!sidebarExpanded && (
          <button
            onClick={toggleSidebar}
            className="mb-8 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-card-border transition-colors hidden lg:block"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </button>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 w-full space-y-1">
          {navItems.map((item) => {
            const Active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  sidebarExpanded 
                    ? "space-x-3 px-3 py-2.5" 
                    : "p-2.5 justify-center mb-1.5",
                  Active
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                )}
                title={!sidebarExpanded ? item.label : undefined}
              >
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-200",
                  !Active && "group-hover:scale-105"
                )} />
                {sidebarExpanded && <span>{item.label}</span>}
                
                {/* Tooltip for collapsed sidebar */}
                {!sidebarExpanded && (
                  <span className="absolute left-14 scale-0 group-hover:scale-100 transition-all duration-200 bg-background text-foreground text-xs py-1.5 px-3 rounded-md shadow-lg border border-card-border whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer info */}
        {sidebarExpanded && (
          <div className="pt-4 border-t border-card-border flex flex-col space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Status Server:</span>
              <span className="inline-flex items-center text-success font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-success mr-1 animate-pulse" />
                Online
              </span>
            </div>
            <div className="text-[10px] text-center text-muted-foreground/60">
              Ragi Instant Dashboard v0.1.0
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
