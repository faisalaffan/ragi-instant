'use client';

import React, { useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Trash2, 
  Download, 
  Copy, 
  Quote, 
  Search, 
  FileText,
  Calendar,
  Layers,
  FileCode,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/shared/status-badge';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { useDocument, useDocumentChunks, useDeleteDocument } from '@/hooks/use-documents';
import { formatDate, formatBytes } from '@/lib/utils';
import { toast } from 'sonner';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // React Query hooks
  const { data: doc, isLoading: docLoading, isError: docError, error: docErr, refetch: refetchDoc } = useDocument(id);
  const { data: chunks = [], isLoading: chunksLoading, isError: chunksError, refetch: refetchChunks } = useDocumentChunks(id);
  const deleteMutation = useDeleteDocument();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [chunkPage, setChunkPage] = useState(1);
  const CHUNKS_PER_PAGE = 10;

  // Loading combined state
  const isLoading = docLoading || chunksLoading;

  // Actions handlers
  const handleToggleExpand = (chunkId: string) => {
    setExpandedChunks(prev => ({
      ...prev,
      [chunkId]: !prev[chunkId]
    }));
  };

  const handleCopyText = async (text: string, chunkId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(chunkId);
      toast.success('Teks chunk berhasil disalin');
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Gagal menyalin teks');
    }
  };

  const handleCopyCitation = async (chunkContent: string, chunkSeq: number, page: number | null, section: string | null, docTitle: string, chunkId: string) => {
    const citationTag = `[${docTitle}${section ? `, ${section}` : ''}${page ? `, hal. ${page}` : ''} (Chunk #${chunkSeq})]`;
    const fullCitation = `${citationTag}\n"${chunkContent}"`;
    
    try {
      await navigator.clipboard.writeText(fullCitation);
      setCopiedQuoteId(chunkId);
      toast.success('Kutipan berformat disalin');
      setTimeout(() => setCopiedQuoteId(null), 2000);
    } catch {
      toast.error('Gagal menyalin kutipan');
    }
  };

  const handleDeleteConfirm = async () => {
    await deleteMutation.mutateAsync(id);
    setConfirmDeleteOpen(false);
    router.push('/documents');
  };

  // Export handlers
  const handleExportJson = () => {
    if (!doc) return;
    const exportData = {
      document: doc,
      chunks: chunks
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, '_')}_data.json`;
    a.click();
    toast.success('Data JSON berhasil diekspor');
  };

  const handleExportCsv = () => {
    if (!doc || chunks.length === 0) return;
    
    const headers = ['ID', 'Sequence', 'Content', 'Page', 'Section'];
    const rows = chunks.map(c => [
      c.id,
      c.sequence.toString(),
      `"${c.content.replace(/"/g, '""')}"`,
      c.page ? c.page.toString() : '—',
      c.section ? `"${c.section.replace(/"/g, '""')}"` : '—'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, '_')}_chunks.csv`;
    a.click();
    toast.success('Data CSV berhasil diekspor');
  };

  // Filter chunks based on client-side search term
  const filteredChunks = chunks.filter(chunk => 
    chunk.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chunk.section && chunk.section.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination for chunks
  const totalChunks = filteredChunks.length;
  const totalChunkPages = Math.ceil(totalChunks / CHUNKS_PER_PAGE) || 1;
  const chunkOffset = (chunkPage - 1) * CHUNKS_PER_PAGE;
  const paginatedChunks = filteredChunks.slice(chunkOffset, chunkOffset + CHUNKS_PER_PAGE);

  // Error boundary checks
  if (docError) {
    return (
      <PageShell title="Detail Dokumen">
        <ErrorState 
          title="Dokumen Tidak Ditemukan"
          message={docErr instanceof Error ? docErr.message : 'Gagal memuat detail dokumen regulasi.'}
          onRetry={refetchDoc}
        />
      </PageShell>
    );
  }

  // Shell actions (back to documents button)
  const pageActions = (
    <Link
      href="/documents"
      className="inline-flex items-center justify-center px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold border border-card-border glass-panel hover:bg-muted/20 text-muted-foreground hover:text-foreground transition-all duration-200 select-none"
    >
      <ArrowLeft className="w-4 h-4 mr-1.5" />
      Kembali ke Daftar
    </Link>
  );

  return (
    <PageShell
      title={isLoading ? "Memuat..." : doc?.title || "Detail Dokumen"}
      description="Analisis struktur hasil ekstraksi metadata dan chunking regulasi keuangan."
      actions={pageActions}
    >
      
      {isLoading ? (
        /* Page Loading Skeletons */
        <div className="space-y-6 animate-pulse">
          <div className="h-44 bg-muted rounded-2xl w-full" />
          <div className="h-10 w-48 bg-muted rounded-lg" />
          <div className="space-y-3">
            {[...Array(3)].map((_, idx) => (
              <div key={idx} className="h-28 bg-muted rounded-2xl w-full" />
            ))}
          </div>
        </div>
      ) : !doc ? (
        <ErrorState message="Dokumen tidak ditemukan." />
      ) : (
        <div className="space-y-6">
          
          {/* Metadata Grid Card */}
          <div className="glass-panel border border-card-border rounded-2xl p-5 md:p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 select-none">
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Status Indexing</span>
                  <div className="mt-0.5">
                    <StatusBadge status={doc.status} />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tipe / Format</span>
                  <span className="text-sm font-extrabold text-foreground mt-0.5 uppercase">
                    {doc.source_type || 'PDF'}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Jumlah Chunks</span>
                  <span className="text-sm font-extrabold text-foreground mt-0.5">
                    {doc.chunk_count || chunks.length} Chunks
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tanggal Diunggah</span>
                  <span className="text-sm font-extrabold text-foreground mt-0.5 truncate">
                    {formatDate(doc.created_at)}
                  </span>
                </div>
              </div>

            </div>

            {/* Document details details */}
            <div className="mt-6 pt-5 border-t border-card-border/50 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col space-y-1 select-all">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider select-none">Source Path / Lokasi File</span>
                <span className="text-xs md:text-sm font-mono text-foreground font-semibold bg-muted/40 px-2.5 py-1.5 rounded-lg border border-card-border/60">
                  {doc.source_path || '—'}
                </span>
              </div>

              {/* Action Buttons inside Metadata Grid */}
              <div className="flex items-center gap-2 select-none w-full md:w-auto justify-end">
                <button
                  onClick={handleExportJson}
                  className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-lg text-xs font-semibold border border-card-border hover:border-primary/20 bg-card-bg text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                  title="Unduh JSON"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  JSON
                </button>
                
                <button
                  onClick={handleExportCsv}
                  disabled={chunks.length === 0}
                  className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-lg text-xs font-semibold border border-card-border hover:border-primary/20 bg-card-bg text-muted-foreground hover:text-primary transition-all duration-200 disabled:opacity-45 cursor-pointer"
                  title="Unduh CSV Chunks"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  CSV Chunks
                </button>

                <button
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="inline-flex items-center justify-center px-3.5 py-2.5 rounded-lg text-xs font-semibold border border-danger/25 bg-danger/5 hover:bg-danger/10 text-danger transition-all duration-200 cursor-pointer"
                  title="Hapus Dokumen"
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Hapus
                </button>
              </div>
            </div>

          </div>

          {/* Chunks Section */}
          <div className="space-y-4">
            
            {/* Search and Filters Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between select-none">
              <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground flex items-center">
                <Layers className="w-5 h-5 text-primary mr-2" />
                Potongan Teks / Chunks 
                <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
                  {totalChunks} {totalChunks !== chunks.length && `dari ${chunks.length}`}
                </span>
              </h2>

              {/* Client search bar */}
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setChunkPage(1); // reset to page 1
                  }}
                  placeholder="Cari konten teks chunk..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-card-border glass-panel focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-xs md:text-sm transition-all"
                />
              </div>
            </div>

            {/* Chunk List Display */}
            <div className="space-y-3">
              {paginatedChunks.length === 0 ? (
                <EmptyState
                  title="Chunk tidak ditemukan"
                  description={searchTerm ? "Tidak ada chunk yang cocok dengan kata kunci pencarian Anda." : "Dokumen belum diekstraksi menjadi chunk teks."}
                />
              ) : (
                paginatedChunks.map((chunk) => {
                  const isExpanded = expandedChunks[chunk.id] || false;
                  
                  return (
                    <div
                      key={chunk.id}
                      className="glass-panel border border-card-border rounded-xl p-4.5 transition-all duration-300 hover:border-primary/20 flex flex-col space-y-3 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        {/* Chunk sequence & tags */}
                        <div className="flex flex-wrap items-center gap-1.5 select-none">
                          <span className="text-[10px] md:text-xs font-extrabold uppercase bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md shadow-sm">
                            Chunk #{chunk.sequence}
                          </span>
                          
                          {chunk.section && (
                            <span className="text-[10px] md:text-xs font-bold bg-muted text-muted-foreground border border-card-border/60 px-2 py-0.5 rounded-md truncate max-w-[150px] md:max-w-[280px]">
                              {chunk.section}
                            </span>
                          )}

                          {chunk.page && (
                            <span className="text-[10px] md:text-xs font-semibold bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md">
                              Halaman {chunk.page}
                            </span>
                          )}
                        </div>

                        {/* Chunk Actions */}
                        <div className="flex items-center space-x-1 select-none">
                          <button
                            onClick={() => handleCopyCitation(chunk.content, chunk.sequence, chunk.page, chunk.section, doc.title, chunk.id)}
                            className="p-1.5 rounded-lg border border-card-border hover:border-primary/20 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all cursor-pointer"
                            title="Salin sebagai Kutipan Berformat"
                          >
                            {copiedQuoteId === chunk.id ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Quote className="w-3.5 h-3.5" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleCopyText(chunk.content, chunk.id)}
                            className="p-1.5 rounded-lg border border-card-border hover:border-primary/20 hover:bg-primary/5 text-muted-foreground hover:text-primary transition-all cursor-pointer"
                            title="Salin Teks Mentah"
                          >
                            {copiedId === chunk.id ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleToggleExpand(chunk.id)}
                            className="p-1.5 rounded-lg border border-card-border hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                          >
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      {/* Chunk Content Text */}
                      <p className="text-xs md:text-sm text-foreground/90 font-medium leading-relaxed break-words">
                        {isExpanded 
                          ? chunk.content 
                          : `${chunk.content.substring(0, 240)}${chunk.content.length > 240 ? '...' : ''}`
                        }
                      </p>
                      
                      {!isExpanded && chunk.content.length > 240 && (
                        <button
                          onClick={() => handleToggleExpand(chunk.id)}
                          className="text-[10px] md:text-xs text-primary font-bold self-start hover:underline cursor-pointer select-none"
                        >
                          Baca Selengkapnya
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Chunk List Pagination */}
            {totalChunkPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-1 select-none">
                <span className="text-xs text-muted-foreground font-medium">
                  Menampilkan chunk <span className="font-bold text-foreground">{chunkOffset + 1}</span> - <span className="font-bold text-foreground">{Math.min(chunkOffset + CHUNKS_PER_PAGE, totalChunks)}</span> dari <span className="font-bold text-foreground">{totalChunks}</span> total
                </span>
                
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setChunkPage(prev => Math.max(prev - 1, 1))}
                    disabled={chunkPage === 1}
                    className="p-1.5 rounded-lg border border-card-border glass-panel hover:bg-muted/10 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-bold text-muted-foreground px-2">
                    Halaman <span className="text-foreground">{chunkPage}</span> dari <span className="text-foreground">{totalChunkPages}</span>
                  </span>

                  <button
                    onClick={() => setChunkPage(prev => Math.min(prev + 1, totalChunkPages))}
                    disabled={chunkPage === totalChunkPages}
                    className="p-1.5 rounded-lg border border-card-border glass-panel hover:bg-muted/10 text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Delete Dialog Modal */}
          <ConfirmDialog
            open={confirmDeleteOpen}
            onOpenChange={setConfirmDeleteOpen}
            title="Hapus Dokumen Regulasi?"
            description="Tindakan ini permanen. Dokumen ini, beserta metadata, semua chunk teks, dan indeks pencarian vektornya akan dihapus sepenuhnya dari database."
            confirmLabel="Ya, Hapus Permanen"
            onConfirm={handleDeleteConfirm}
            loading={deleteMutation.isPending}
          />

        </div>
      )}
    </PageShell>
  );
}
