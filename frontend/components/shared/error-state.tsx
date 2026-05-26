'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Gagal memuat data',
  message,
  onRetry,
  className
}: ErrorStateProps) {
  return (
    <div className={cn(
      "glass-panel border-danger/25 bg-danger/5 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto my-6 shadow-md",
      className
    )}>
      {/* Icon Area */}
      <div className="w-16 h-16 rounded-2xl bg-danger/10 text-danger border border-danger/20 flex items-center justify-center mb-6 shadow-inner">
        <AlertCircle className="w-8 h-8" />
      </div>

      {/* Texts */}
      <h3 className="text-lg md:text-xl font-bold tracking-tight mb-2 text-danger">
        {title}
      </h3>
      <p className="text-xs md:text-sm text-muted-foreground font-medium max-w-sm mb-6 leading-relaxed">
        {message || 'Terjadi kesalahan internal. Hubungi administrator atau coba lagi nanti.'}
      </p>

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold border border-danger/25 text-danger bg-danger/5 hover:bg-danger/10 active:scale-[0.98] transition-all duration-200"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Coba Lagi
        </button>
      )}
    </div>
  );
}
