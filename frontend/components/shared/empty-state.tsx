'use client';

import React from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: { label: string; href: string };
  className?: string;
}

export function EmptyState({
  icon: Icon = HelpCircle,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      "glass-panel rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-6 border border-card-border/80 shadow-md",
      className
    )}>
      {/* Icon Area */}
      <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-6 shadow-inner animate-pulse-slow">
        <Icon className="w-8 h-8" />
      </div>

      {/* Texts */}
      <h3 className="text-lg md:text-xl font-bold tracking-tight mb-2 text-foreground">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {/* Optional CTA Action Button */}
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
