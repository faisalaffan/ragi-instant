'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getDocuments, 
  getDocument, 
  getDocumentChunks, 
  deleteDocument,
  uploadDocument 
} from '@/lib/api';
import { toast } from 'sonner';

// Query Key Factory for document queries
export const documentKeys = {
  all: ['documents'] as const,
  lists: () => [...documentKeys.all, 'list'] as const,
  list: (filters: any) => [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  chunks: (id: string) => [...documentKeys.all, 'chunks', id] as const,
};

/**
 * Hook to retrieve paginated and filtered documents list
 */
export function useDocuments(params?: { limit?: number; offset?: number; status?: string; search?: string }) {
  return useQuery({
    queryKey: documentKeys.list(params),
    queryFn: () => getDocuments(params),
    placeholderData: (previousData) => previousData, // smooth pagination transitions
    
    // Auto-polling when some documents are in processing state
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (!data?.documents) return false;
      
      const hasUnfinishedDocs = data.documents.some((doc: any) => 
        ['pending', 'parsing', 'chunking', 'indexing'].includes(doc.status)
      );
      
      return hasUnfinishedDocs ? 5000 : false; // Poll every 5s if there is active pipeline work
    }
  });
}

/**
 * Hook to retrieve a single document details
 */
export function useDocument(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: documentKeys.detail(id),
    queryFn: () => getDocument(id),
    enabled: !!id && (options?.enabled !== false),
    
    // Poll single document if it is in process
    refetchInterval: (query) => {
      const doc = query.state.data as any;
      if (!doc) return false;
      return ['pending', 'parsing', 'chunking', 'indexing'].includes(doc.status) ? 3000 : false;
    }
  });
}

/**
 * Hook to retrieve a document's parsed chunks
 */
export function useDocumentChunks(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: documentKeys.chunks(id),
    queryFn: () => getDocumentChunks(id),
    enabled: !!id && (options?.enabled !== false),
  });
}

/**
 * Mutation hook to delete a document
 */
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDocument(id),
    onSuccess: (_, id) => {
      // Invalidate both lists and detail query caches
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(id) });
      toast.success('Dokumen berhasil dihapus');
    },
    onError: (err: any) => {
      toast.error(`Gagal menghapus dokumen: ${err.message || 'Error tidak dikenal'}`);
    }
  });
}

/**
 * Mutation hook to upload a new document
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) => uploadDocument(file, title),
    onSuccess: (newDoc) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
      toast.success(`Berhasil mengunggah: ${newDoc.title}`);
    },
    onError: (err: any) => {
      toast.error(`Gagal mengunggah dokumen: ${err.message || 'Error tidak dikenal'}`);
    }
  });
}
