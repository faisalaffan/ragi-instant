'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Document } from '@/types';

interface StatusBadgeProps {
  status: Document['status'];
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({
  status,
  showLabel = true,
  size = 'md',
  className
}: StatusBadgeProps) {
  
  // Custom styling, label, and colors mapping based on the document status
  const config = {
    pending: {
      label: 'Pending',
      bgClass: 'bg-muted text-muted-foreground border-muted-foreground/10',
      dotClass: 'bg-muted-foreground/60',
      pulse: false,
    },
    parsing: {
      label: 'Parsing',
      bgClass: 'bg-warning/10 text-warning border-warning/20',
      dotClass: 'bg-warning',
      pulse: true,
    },
    chunking: {
      label: 'Chunking',
      bgClass: 'bg-warning/10 text-warning border-warning/20',
      dotClass: 'bg-warning',
      pulse: true,
    },
    indexing: {
      label: 'Indexing',
      bgClass: 'bg-warning/10 text-warning border-warning/20',
      dotClass: 'bg-warning',
      pulse: true,
    },
    ready: {
      label: 'Ready',
      bgClass: 'bg-success/10 text-success border-success/20',
      dotClass: 'bg-success',
      pulse: false,
    },
    error: {
      label: 'Error',
      bgClass: 'bg-danger/10 text-danger border-danger/20',
      dotClass: 'bg-danger',
      pulse: false,
    },
  };

  const current = config[status] || config.pending;

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full border transition-all duration-200 select-none",
        size === 'sm' ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        current.bgClass,
        className
      )}
    >
      <span 
        className={cn(
          "rounded-full mr-1.5 flex-shrink-0",
          size === 'sm' ? "w-1.5 h-1.5" : "w-2 h-2",
          current.dotClass,
          current.pulse && "animate-pulse"
        )} 
      />
      {showLabel && <span>{current.label}</span>}
    </span>
  );
}
