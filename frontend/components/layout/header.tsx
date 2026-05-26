'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { useUIStore, Theme } from '@/stores/ui-store';
import { healthCheck } from '@/lib/api';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme, apiUrl } = useUIStore();
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    try {
      const res = await healthCheck();
      if (res.status === 'healthy' || res.status === 'ok' || res.status) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [apiUrl]);

  // Generate breadcrumbs from pathname
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', href: '/' }];
    
    let currentHref = '';
    segments.forEach((segment, index) => {
      currentHref += `/${segment}`;
      
      // Capitalize first letter or use map for cleaner display
      let label = segment.charAt(0).toUpperCase() + segment.slice(1);
      
      if (segment === 'documents') label = 'Dokumen';
      if (segment === 'upload') label = 'Upload';
      if (segment === 'query') label = 'Tanya Regulasi';
      if (segment === 'compare') label = 'Bandingkan';
      if (segment === 'eval') label = 'Evaluasi RAGAS';
      if (segment === 'settings') label = 'Pengaturan';

      // Handle document details id
      if (index > 0 && segments[index - 1] === 'documents') {
        label = `Detail: ${segment.substring(0, 8)}...`;
      }

      breadcrumbs.push({ label, href: currentHref });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();
  const currentPageLabel = breadcrumbs[breadcrumbs.length - 1].label;

  return (
    <header className="h-16 border-b border-card-border glass-panel flex items-center justify-between px-6 sticky top-0 z-20 w-full select-none">
      
      {/* Breadcrumbs (collapses in mobile) */}
      <div className="flex items-center space-x-1 text-sm text-muted-foreground ml-10 md:ml-0 overflow-hidden">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.href}>
              {idx > 0 && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
              {isLast ? (
                <span className="font-semibold text-foreground truncate max-w-[120px] md:max-w-[300px]">
                  {crumb.label}
                </span>
              ) : (
                <Link 
                  href={crumb.href}
                  className="hover:text-foreground transition-colors truncate hidden sm:inline-block"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Header Actions */}
      <div className="flex items-center space-x-4">
        {/* Connection status dot */}
        <div 
          onClick={checkConnection}
          className={cn(
            "flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border glass-panel transition-all duration-300 cursor-pointer select-none",
            serverStatus === 'online' && "border-success/20 text-success bg-success/5 hover:bg-success/10",
            serverStatus === 'offline' && "border-danger/20 text-danger bg-danger/5 hover:bg-danger/10",
            serverStatus === 'checking' && "border-warning/20 text-warning bg-warning/5"
          )}
          title={`Backend URL: ${apiUrl}`}
        >
          {serverStatus === 'online' ? (
            <Wifi className="w-3.5 h-3.5" />
          ) : (
            <WifiOff className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">
            {serverStatus === 'online' && 'Connected'}
            {serverStatus === 'offline' && 'Disconnected'}
            {serverStatus === 'checking' && 'Checking...'}
          </span>
          {checking && <RefreshCw className="w-3 h-3 animate-spin ml-0.5" />}
        </div>

        {/* Theme Toggler Buttons */}
        <div className="flex items-center space-x-0.5 border border-card-border bg-muted/30 p-0.5 rounded-lg">
          {(['light', 'dark', 'system'] as Theme[]).map((t) => {
            const Active = theme === t;
            return (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "p-1.5 rounded-md text-muted-foreground hover:text-foreground transition-all duration-200",
                  Active && "bg-primary text-white shadow-sm"
                )}
                title={`Theme: ${t}`}
              >
                {t === 'light' && <Sun className="w-4 h-4" />}
                {t === 'dark' && <Moon className="w-4 h-4" />}
                {t === 'system' && <Monitor className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
