'use client';

import { useMutation } from '@tanstack/react-query';
import { askQuestion } from '@/lib/api';
import { useQueryHistoryStore } from '@/stores/query-history-store';
import { toast } from 'sonner';

/**
 * Hook to submit a regulatory question to the AI retrieval pipeline
 */
export function useQueryMutation() {
  const addQuery = useQueryHistoryStore((state) => state.addQuery);

  return useMutation({
    mutationFn: ({ question, compress }: { question: string; compress?: boolean }) => 
      askQuestion(question, compress),
      
    onSuccess: (data, variables) => {
      // Opt-in: push to local history logs
      addQuery(variables.question, data.confidence || 0);
      toast.success('Jawaban regulasi berhasil dimuat!');
    },
    
    onError: (err: any) => {
      toast.error(`Pencarian gagal: ${err.message || 'Koneksi API error'}`);
    }
  });
}
