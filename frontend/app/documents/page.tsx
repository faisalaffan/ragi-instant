'use client';

import React, { useState, useEffect, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Trash2,
  Eye,
  Plus,
  RefreshCw,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Database,
  Loader2
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { useDocuments, useDeleteDocument } from '@/hooks/use-documents';
import { formatDate, cn } from '@/lib/utils';
import { StatusFilter } from '@/types';

const ITEMS_PER_PAGE = 10;

function DocumentListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Read URL query parameters
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const statusParam = (searchParams.get('status') || 'all') as StatusFilter;
  const searchParam = searchParams.get('search') || '';

  // Local state to bind input value instantly
  const [searchInput, setSearchInput] = useState(searchParam);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Sync search input if URL changes
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

  // Calculations for API query
  const offset = (pageParam - 1) * ITEMS_PER_PAGE;

  // React Query Fetch
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useDocuments({
    limit: ITEMS_PER_PAGE,
    offset,
    status: statusParam,
    search: searchParam
  });

  const deleteMutation = useDeleteDocument();

  // Helper to update URL query params
  const updateParams = (newParams: Record<string, string | number | null>) => {
    const nextParams = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, val.toString());
      }
    });

    startTransition(() => {
      router.push(`/documents?${nextParams.toString()}`);
    });
  };

  // Debounced search submit handler
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchInput !== searchParam) {
        updateParams({ search: searchInput, page: 1 });
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput]);

  const handleStatusChange = (status: StatusFilter) => {
    updateParams({ status: status === 'all' ? null : status, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    updateParams({ page: newPage });
  };

  const handleDeleteConfirm = async () => {
    if (confirmDeleteId) {
      await deleteMutation.mutateAsync(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  // Calculations
  const documents = data?.documents || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  // Quick Action component for PageShell
  const pageActions = (
    <Link
      href="/upload"
      className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white shadow-md shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
    >
      <Plus className="w-4 h-4 mr-2" />
      Upload Dokumen
    </Link>
  );

  return (
    <PageShell
      title={`Dokumen Regulasi (${totalItems})`}
      description="Kelola, unggah, dan pantau status dokumen regulasi yang telah diekstraksi ke dalam database RAG."
      actions={pageActions}
    >

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-6">
        <div className="relative w-full md:max-w-md select-none">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari judul dokumen regulasi... (Ctrl+K)"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-card-border glass-panel focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm transition-all"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-1.5 py-0.5 rounded hover:bg-muted/40 text-muted-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto select-none justify-end">
          <span className="text-xs md:text-sm font-semibold text-muted-foreground hidden sm:inline">
            Status:
          </span>
          <select
            value={statusParam}
            onChange={(e) => handleStatusChange(e.target.value as StatusFilter)}
            className="px-3.5 py-2.5 rounded-xl border border-card-border glass-panel text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer transition-all"
          >
            <option value="all">Semua Status</option>
            <option value="ready">Ready</option>
            <option value="indexing">Indexing / Memproses</option>
            <option value="pending">Pending</option>
            <option value="error">Error</option>
          </select>

          <button
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
            className="p-2.5 rounded-xl border border-card-border glass-panel text-muted-foreground hover:text-foreground hover:bg-muted/20 disabled:opacity-40 transition-all select-none"
            title="Refresh Data"
          >
            <RefreshCw className={cn("w-4.5 h-4.5", isFetching && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="flex-1 w-full min-h-[300px]">
        {isLoading ? (
          /* Loading Skeltons */
          <div className="glass-panel border-card-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-card-border/50 hidden md:grid grid-cols-12 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <div className="col-span-6">Nama Dokumen</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1 text-center">Chunks</div>
              <div className="col-span-2 text-right">Tanggal Unggah</div>
              <div className="col-span-1 text-right">Aksi</div>
            </div>
            <div className="divide-y divide-card-border/50 animate-pulse">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="p-5 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 md:col-span-6 flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-muted flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                  <div className="col-span-6 md:col-span-2">
                    <div className="h-6 bg-muted rounded-full w-20" />
                  </div>
                  <div className="col-span-6 md:col-span-1 flex justify-center">
                    <div className="h-4 bg-muted rounded w-8" />
                  </div>
                  <div className="col-span-6 md:col-span-2 flex md:justify-end">
                    <div className="h-4 bg-muted rounded w-24" />
                  </div>
                  <div className="col-span-6 md:col-span-1 flex justify-end">
                    <div className="h-8 bg-muted rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat daftar dokumen.'}
            onRetry={refetch}
          />
        ) : documents.length === 0 ? (
          searchParam || statusParam !== 'all' ? (
            <EmptyState
              title="Tidak ada dokumen"
              description="Tidak ada dokumen regulasi yang cocok dengan kriteria pencarian atau filter Anda."
              action={{
                label: 'Bersihkan Filter',
                href: '/documents'
              }}
            />
          ) : (
            <EmptyState
              title="Belum ada dokumen"
              description="Silakan unggah dokumen regulasi keuangan pertama Anda (PDF, DOCX, TXT, MD) untuk diproses ke dalam sistem intelligence."
              icon={Database}
              action={{
                label: 'Upload Dokumen Sekarang',
                href: '/upload'
              }}
            />
          )
        ) : (
          /* Real Data Table */
          <div className="flex flex-col justify-between h-full">
            <div className="glass-panel border border-card-border rounded-2xl overflow-hidden shadow-lg mb-6">

              {/* Desktop Header */}
              <div className="p-5 border-b border-card-border/50 hidden md:grid grid-cols-12 text-xs font-bold text-muted-foreground uppercase tracking-wider bg-muted/10 select-none">
                <div className="col-span-6">Nama Dokumen</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1 text-center">Chunks</div>
                <div className="col-span-2 text-right">Tanggal Unggah</div>
                <div className="col-span-1 text-right">Aksi</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-card-border/40">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 md:p-5 grid grid-cols-12 gap-3 items-center hover:bg-muted/10 transition-colors duration-150"
                  >
                    {/* Title */}
                    <div className="col-span-12 md:col-span-6 flex items-center space-x-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 text-primary shadow-sm">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/documents/${doc.id}`}
                          className="font-bold text-sm md:text-base text-foreground hover:text-primary transition-colors truncate block"
                          title={doc.title}
                        >
                          {doc.title}
                        </Link>
                        <span className="text-[10px] md:text-xs text-muted-foreground font-semibold mt-0.5 tracking-wide">
                          FORMAT: <span className="uppercase text-foreground">{doc.source_type || 'PDF'}</span> • PATH: <span className="font-mono text-[9px] bg-muted/30 px-1 py-0.5 rounded">{doc.source_path}</span>
                        </span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="col-span-6 md:col-span-2 flex items-center">
                      <StatusBadge status={doc.status} />
                      {doc.status === 'error' && doc.error_message && (
                        <div
                          className="ml-2 text-danger hover:text-danger/80 cursor-help"
                          title={doc.error_message}
                        >
                          <AlertCircle className="w-4.5 h-4.5" />
                        </div>
                      )}
                    </div>

                    {/* Chunk Count */}
                    <div className="col-span-6 md:col-span-1 text-left md:text-center">
                      <span className="text-xs font-semibold text-muted-foreground md:hidden mr-1">
                        Chunks:
                      </span>
                      <span className="text-sm font-bold text-foreground">
                        {doc.chunk_count || 0}
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className="col-span-12 md:col-span-2 text-left md:text-right text-xs text-muted-foreground font-medium select-none">
                      <span className="md:hidden font-semibold mr-1">Diupload:</span>
                      {formatDate(doc.created_at)}
                    </div>

                    {/* Actions */}
                    <div className="col-span-12 md:col-span-1 flex justify-end space-x-1.5 md:space-x-1 select-none">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="p-2 rounded-lg border border-card-border/60 hover:border-primary/20 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                        title="Lihat Detail"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => setConfirmDeleteId(doc.id)}
                        disabled={deleteMutation.isPending}
                        className="p-2 rounded-lg border border-card-border/60 hover:border-danger/20 text-muted-foreground hover:text-danger hover:bg-danger/5 transition-all cursor-pointer"
                        title="Hapus Dokumen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-1 select-none">
                <span className="text-xs md:text-sm text-muted-foreground font-medium">
                  Menampilkan <span className="font-bold text-foreground">{offset + 1}</span> - <span className="font-bold text-foreground">{Math.min(offset + ITEMS_PER_PAGE, totalItems)}</span> dari <span className="font-bold text-foreground">{totalItems}</span> dokumen
                </span>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pageParam - 1)}
                    disabled={pageParam === 1}
                    className="p-2 rounded-xl border border-card-border glass-panel hover:bg-muted/10 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    const isSelected = pageParam === pageNumber;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={cn(
                          "w-9 h-9 rounded-xl font-bold text-xs md:text-sm transition-all border",
                          isSelected
                            ? "bg-primary text-white border-primary shadow-sm shadow-primary/25"
                            : "glass-panel border-card-border text-muted-foreground hover:text-foreground hover:bg-muted/10"
                        )}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => handlePageChange(pageParam + 1)}
                    disabled={pageParam === totalPages}
                    className="p-2 rounded-xl border border-card-border glass-panel hover:bg-muted/10 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog Modal */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
        title="Hapus Dokumen Regulasi?"
        description="Langkah ini tidak dapat dibatalkan. Menghapus dokumen ini juga akan menghapus semua potongan teks (chunks) dan index vektor yang terkait di database."
        confirmLabel="Ya, Hapus"
        onConfirm={handleDeleteConfirm}
        loading={deleteMutation.isPending}
      />
    </PageShell>
  );
}

export default function DocumentListPage() {
  return (
    <Suspense fallback={
      <PageShell title="Dokumen Regulasi" description="Memuat daftar dokumen regulasi...">
        <div className="flex flex-col items-center justify-center h-64 space-y-3 text-muted-foreground select-none">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-xs font-semibold">Menghubungkan ke database...</span>
        </div>
      </PageShell>
    }>
      <DocumentListContent />
    </Suspense>
  );
}
