'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PageShellProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className
}: PageShellProps) {
  return (
    <div className={cn("flex flex-col flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6 animate-fade-in", className)}>
      
      {/* Page Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 pb-4 border-b border-card-border/50">
        <div className="flex flex-col space-y-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-muted-foreground font-medium max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center space-x-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Page Content Body */}
      <main className="flex-1 w-full flex flex-col min-h-0">
        {children}
      </main>
    </div>
  );
}
