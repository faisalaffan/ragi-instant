'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Hapus',
  variant = 'danger',
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Esc key closure
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !loading) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, loading, onOpenChange]);

  // Lock scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      
      {/* Dark backdrop blur */}
      <div 
        onClick={() => !loading && onOpenChange(false)}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
      />

      {/* Modal Dialog Content */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className={cn(
          "relative w-full max-w-md rounded-2xl glass-panel p-6 shadow-2xl border border-card-border/80 flex flex-col space-y-4 animate-scale-in z-10",
          variant === 'danger' && "border-danger/10"
        )}
      >
        <div className="flex items-start space-x-3.5">
          {variant === 'danger' ? (
            <div className="w-10 h-10 rounded-lg bg-danger/10 text-danger border border-danger/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary border border-primary/15 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          )}
          
          <div className="flex flex-col space-y-1">
            <h2 id="confirm-title" className="text-base md:text-lg font-bold text-foreground">
              {title}
            </h2>
            <p id="confirm-desc" className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="px-4 py-2 text-xs md:text-sm font-semibold rounded-lg border border-card-border hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-all duration-200 disabled:opacity-50"
          >
            Batal
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "px-4 py-2 text-xs md:text-sm font-semibold rounded-lg text-white shadow-md flex items-center justify-center transition-all duration-200 active:scale-[0.98] disabled:opacity-50",
              variant === 'danger' 
                ? "bg-danger hover:bg-danger/90 shadow-danger/25" 
                : "bg-primary hover:bg-primary/90 shadow-primary/25",
              loading && "pl-3"
            )}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
