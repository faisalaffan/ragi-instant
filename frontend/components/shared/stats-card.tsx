'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: number | string | null;
  subtitle?: string;
  trend?: { direction: 'up' | 'down'; value: string };
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  href?: string;
  loading?: boolean;
}

export function StatsCard({
  label,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = 'default',
  href,
  loading = false,
}: StatsCardProps) {
  
  const content = (
    <div className={cn(
      "glass-panel rounded-xl p-5 select-none relative overflow-hidden flex flex-col justify-between h-32 transition-all duration-300",
      href && "glass-panel-hover cursor-pointer active:scale-[0.98]",
      variant === 'success' && "border-success/15 bg-success/5",
      variant === 'warning' && "border-warning/15 bg-warning/5",
      variant === 'danger' && "border-danger/15 bg-danger/5"
    )}>
      
      {/* Loading Skeleton Mode */}
      {loading ? (
        <div className="space-y-3 animate-pulse h-full flex flex-col justify-between">
          <div className="flex items-center justify-between w-full">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-8 w-8 bg-muted rounded-lg" />
          </div>
          <div className="h-8 w-16 bg-muted rounded" />
        </div>
      ) : (
        <>
          {/* Card Top Label & Icon */}
          <div className="flex items-center justify-between">
            <span className="text-xs md:text-sm font-medium text-muted-foreground truncate pr-2">
              {label}
            </span>
            {Icon && (
              <div className={cn(
                "p-2 rounded-lg border border-card-border/60 text-muted-foreground",
                variant === 'success' && "text-success border-success/10 bg-success/5",
                variant === 'warning' && "text-warning border-warning/10 bg-warning/5",
                variant === 'danger' && "text-danger border-danger/10 bg-danger/5"
              )}>
                <Icon className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Card Bottom Value & Trends */}
          <div className="flex items-baseline justify-between mt-2">
            <div className="flex flex-col">
              <span className="text-2xl md:text-3xl font-extrabold tracking-tight">
                {value !== null && value !== undefined ? value : '—'}
              </span>
              {subtitle && (
                <span className="text-[10px] md:text-xs text-muted-foreground font-medium mt-0.5">
                  {subtitle}
                </span>
              )}
            </div>

            {/* Trend Indicator */}
            {trend && (
              <span className={cn(
                "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md border",
                trend.direction === 'up' 
                  ? "text-success bg-success/5 border-success/15" 
                  : "text-danger bg-danger/5 border-danger/15"
              )}>
                {trend.direction === 'up' ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                )}
                {trend.value}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (href && !loading) {
    return (
      <Link href={href} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
