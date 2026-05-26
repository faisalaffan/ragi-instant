'use client';

import { useMutation } from '@tanstack/react-query';
import { compareDocuments } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Hook to compare two versions of a regulation document
 */
export function useCompareMutation() {
  return useMutation({
    mutationFn: ({ oldId, newId }: { oldId: string; newId: string }) => 
      compareDocuments(oldId, newId),
      
    onSuccess: () => {
      toast.success('Analisis perbandingan regulasi selesai!');
    },
    
    onError: (err: any) => {
      toast.error(`Perbandingan gagal: ${err.message || 'Error pada API server'}`);
    }
  });
}
