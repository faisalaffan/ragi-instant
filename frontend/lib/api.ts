import { Document, Chunk, AnswerResponse, ChangeReport } from '@/types';

const BASE_URL = () => {
  if (typeof window === 'undefined') {
    return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  }
  return localStorage.getItem('ragi-instant.settings.apiUrl') || 'http://localhost:8000';
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL()}${path}`;
  
  // Format headers based on whether we are uploading files or sending JSON
  const headers: Record<string, string> = {};
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options?.headers,
    },
  };

  try {
    const res = await fetch(url, mergedOptions);
    
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status, 
        body.detail || body.message || `API Error: ${res.statusText} (${res.status})`
      );
    }

    return res.json() as Promise<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network / offline error
    throw new Error(error instanceof Error ? error.message : 'Koneksi ke server gagal. Periksa jaringan Anda.');
  }
}

// Documents
export const getDocuments = (params?: { limit?: number; offset?: number; status?: string; search?: string }) => {
  const queryParams = new URLSearchParams();
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());
  if (params?.status && params.status !== 'all') queryParams.append('status', params.status);
  if (params?.search) queryParams.append('search', params.search);

  const queryString = queryParams.toString();
  return request<{ documents: Document[]; total: number }>(
    `/api/ingest/documents${queryString ? `?${queryString}` : ''}`
  );
};

export const getDocument = (id: string) =>
  request<Document>(`/api/ingest/documents/${id}`);

export const getDocumentChunks = (id: string) =>
  request<Chunk[]>(`/api/ingest/documents/${id}/chunks`);

export const uploadDocument = (file: File, title?: string) => {
  const form = new FormData();
  form.append('file', file);
  if (title) {
    form.append('title', title);
  }
  return request<Document>('/api/ingest/documents', {
    method: 'POST',
    body: form,
  });
};

export const deleteDocument = (id: string) =>
  request<{ status: string }>(`/api/ingest/documents/${id}`, {
    method: 'DELETE',
  });

// Query
export const askQuestion = (question: string, compress = false) =>
  request<AnswerResponse>('/api/query', {
    method: 'POST',
    body: JSON.stringify({ question, compress }),
  });

// Compare
export const compareDocuments = (oldId: string, newId: string) =>
  request<ChangeReport>('/api/analysis/compare', {
    method: 'POST',
    body: JSON.stringify({ old_document_id: oldId, new_document_id: newId }),
  });

// Health check
export const healthCheck = () =>
  request<{ status: string }>('/health').catch(() => ({ status: 'unhealthy' }));
