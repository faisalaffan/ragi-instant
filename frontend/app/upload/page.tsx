'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  UploadCloud, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight,
  Clock, 
  Trash2,
  Play,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { useUploadDocument } from '@/hooks/use-documents';
import { getDocument } from '@/lib/api';
import { formatDate, formatBytes } from '@/lib/utils';
import { Document } from '@/types';
import { toast } from 'sonner';
import Link from 'next/link';

interface QueueItem {
  id: string; // unique local id or backend id if uploaded
  file: File;
  title: string;
  status: 'idle' | 'uploading' | 'pending' | 'parsing' | 'chunking' | 'indexing' | 'ready' | 'error';
  progress: number;
  errorMessage: string | null;
  backendId?: string;
  chunkCount?: number;
}

export default function UploadPage() {
  const uploadMutation = useUploadDocument();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [history, setHistory] = useState<Document[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Drag and drop zone callback
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newItems = acceptedFiles.map(file => {
      // Default title is filename without extension
      const title = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      return {
        id: Math.random().toString(36).substring(2, 11),
        file,
        title,
        status: 'idle' as const,
        progress: 0,
        errorMessage: null
      };
    });
    setQueue(prev => [...prev, ...newItems]);
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md']
    }
  });

  // Display dropzone validation errors
  useEffect(() => {
    if (fileRejections.length > 0) {
      fileRejections.forEach(rejection => {
        const errors = rejection.errors.map(e => {
          if (e.code === 'file-too-large') return 'File terlalu besar. Maksimal 50 MB.';
          if (e.code === 'file-invalid-type') return 'Format tidak didukung. Gunakan PDF, DOCX, TXT, atau MD.';
          return e.message;
        });
        toast.error(`Gagal menambahkan ${rejection.file.name}: ${errors.join(', ')}`);
      });
    }
  }, [fileRejections]);

  // Fetch upload history log
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      // Fetch latest 10 documents
      const fetch = await import('@/lib/api').then(m => m.getDocuments({ limit: 10 }));
      setHistory(fetch.documents);
    } catch {
      // fallback silent
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Poll individual active queue items
  useEffect(() => {
    const pollingItems = queue.filter(item => 
      item.backendId && ['pending', 'parsing', 'chunking', 'indexing'].includes(item.status)
    );

    if (pollingItems.length === 0) return;

    const interval = setInterval(async () => {
      const updatedQueue = [...queue];
      let hasChanges = false;

      for (const item of pollingItems) {
        if (!item.backendId) continue;
        
        try {
          const doc = await getDocument(item.backendId);
          const queueIndex = updatedQueue.findIndex(q => q.id === item.id);
          
          if (queueIndex !== -1 && updatedQueue[queueIndex].status !== doc.status) {
            updatedQueue[queueIndex].status = doc.status;
            updatedQueue[queueIndex].chunkCount = doc.chunk_count;
            updatedQueue[queueIndex].errorMessage = doc.error_message;
            hasChanges = true;

            // Trigger history refresh if completed
            if (doc.status === 'ready' || doc.status === 'error') {
              fetchHistory();
              if (doc.status === 'ready') {
                toast.success(`Pipeline ${doc.title} selesai!`);
              } else {
                toast.error(`Pipeline ${doc.title} gagal: ${doc.error_message}`);
              }
            }
          }
        } catch {
          // ignore network error during poll
        }
      }

      if (hasChanges) {
        setQueue(updatedQueue);
      }
    }, 3000); // poll every 3s

    return () => clearInterval(interval);
  }, [queue]);

  // Handle single item upload pipeline trigger
  const processQueueItem = async (itemId: string) => {
    const item = queue.find(q => q.id === itemId);
    if (!item || item.status !== 'idle') return;

    // Update state to uploading
    setQueue(prev => prev.map(q => q.id === itemId ? { ...q, status: 'uploading', progress: 30 } : q));

    try {
      const response = await uploadMutation.mutateAsync({
        file: item.file,
        title: item.title
      });

      // Update state to ingestion status returned by backend
      setQueue(prev => prev.map(q => q.id === itemId ? { 
        ...q, 
        status: response.status, 
        backendId: response.id,
        chunkCount: response.chunk_count,
        progress: 100 
      } : q));

      fetchHistory();
    } catch (err: any) {
      setQueue(prev => prev.map(q => q.id === itemId ? { 
        ...q, 
        status: 'error', 
        errorMessage: err.message || 'Koneksi gagal' 
      } : q));
    }
  };

  // Process all queue items in sequential order
  const processAll = async () => {
    const idleItems = queue.filter(item => item.status === 'idle');
    for (const item of idleItems) {
      await processQueueItem(item.id);
    }
  };

  const removeItem = (itemId: string) => {
    setQueue(prev => prev.filter(q => q.id !== itemId));
  };

  const clearCompleted = () => {
    setQueue(prev => prev.filter(q => !['ready', 'error'].includes(q.status)));
  };

  const updateItemTitle = (itemId: string, newTitle: string) => {
    setQueue(prev => prev.map(q => q.id === itemId ? { ...q, title: newTitle } : q));
  };

  // Pipeline helper styles
  const getPipelineClass = (currentStatus: string, step: string) => {
    const order = ['pending', 'parsing', 'chunking', 'indexing', 'ready'];
    const currentIdx = order.indexOf(currentStatus);
    const stepIdx = order.indexOf(step);

    if (currentStatus === 'error') {
      return 'text-danger bg-danger/10 border-danger/30';
    }

    if (currentIdx >= stepIdx) {
      if (step === 'ready' && currentStatus === 'ready') return 'text-success bg-success/15 border-success/30 font-bold';
      return 'text-primary bg-primary/10 border-primary/20 font-bold';
    }

    return 'text-muted-foreground bg-muted border-card-border/50';
  };

  return (
    <PageShell
      title="Upload Dokumen Regulasi"
      description="Unggah dokumen POJK, SEOJK, atau PBI untuk diindeks. Pipeline AI akan mengekstrak teks, membuat chunks, dan menyimpan index vektor."
    >
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Form column (2 cols wide) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Dropzone container */}
          <div 
            {...getRootProps()}
            className={`glass-panel border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all select-none ${
              isDragActive 
                ? 'border-primary bg-primary/5 scale-[1.01]' 
                : 'border-card-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary border border-primary/15 flex items-center justify-center mb-4 shadow-inner">
              <UploadCloud className="w-7 h-7" />
            </div>
            
            <h3 className="text-sm md:text-base font-bold mb-1">
              {isDragActive ? 'Lepaskan file di sini...' : 'Drop dokumen regulasi Anda di sini'}
            </h3>
            <p className="text-xs text-muted-foreground font-semibold mb-3">
              atau klik untuk mencari dari folder komputer Anda
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-[10px] md:text-xs text-muted-foreground font-semibold bg-muted/40 px-3 py-1.5 rounded-lg border border-card-border/50">
              <span>PDF</span> • <span>DOCX</span> • <span>TXT</span> • <span>MD</span> • <span>Maks 50 MB</span>
            </div>
          </div>

          {/* Queue List Panel */}
          {queue.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between select-none">
                <h3 className="text-sm md:text-base font-extrabold flex items-center">
                  Antrean Unggahan ({queue.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={processAll}
                    disabled={!queue.some(q => q.status === 'idle')}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white shadow-sm hover:shadow-md disabled:opacity-40 transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 mr-1" />
                    Proses Semua
                  </button>
                  <button
                    onClick={clearCompleted}
                    className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold border border-card-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    Bersihkan Selesai
                  </button>
                </div>
              </div>

              {/* Items Card List */}
              <div className="space-y-3">
                {queue.map((item) => {
                  const isProcessing = ['uploading', 'pending', 'parsing', 'chunking', 'indexing'].includes(item.status);
                  
                  return (
                    <div 
                      key={item.id}
                      className="glass-panel border border-card-border rounded-xl p-4 flex flex-col space-y-4 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
                        {/* Title & File detail */}
                        <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          
                          <div className="flex flex-col min-w-0 flex-1">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateItemTitle(item.id, e.target.value)}
                              disabled={item.status !== 'idle'}
                              placeholder="Masukkan judul kustom dokumen..."
                              className="font-bold text-sm bg-transparent border-b border-transparent hover:border-card-border focus:border-primary focus:outline-none py-0.5 truncate text-foreground"
                            />
                            <span className="text-[10px] md:text-xs text-muted-foreground mt-0.5 font-semibold">
                              FILE: {item.file.name} ({formatBytes(item.file.size)})
                            </span>
                          </div>
                        </div>

                        {/* Item actions & badges */}
                        <div className="flex items-center space-x-2 self-end sm:self-center select-none flex-shrink-0">
                          {item.status === 'idle' && (
                            <>
                              <button
                                onClick={() => processQueueItem(item.id)}
                                className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white transition-all cursor-pointer"
                              >
                                Upload
                              </button>
                              <button
                                onClick={() => removeItem(item.id)}
                                className="p-1.5 rounded-lg border border-card-border hover:border-danger/20 hover:bg-danger/5 text-muted-foreground hover:text-danger transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {item.status === 'uploading' && (
                            <span className="inline-flex items-center text-xs font-semibold text-primary">
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              Mengunggah...
                            </span>
                          )}

                          {item.status === 'ready' && (
                            <span className="inline-flex items-center text-xs font-bold text-success">
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Selesai
                            </span>
                          )}

                          {item.status === 'error' && (
                            <span className="inline-flex items-center text-xs font-bold text-danger" title={item.errorMessage || ''}>
                              <AlertCircle className="w-4 h-4 mr-1 animate-pulse" />
                              Gagal
                            </span>
                          )}

                          {isProcessing && item.status !== 'uploading' && (
                            <span className="inline-flex items-center text-xs font-semibold text-warning">
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                              Memproses...
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Error details */}
                      {item.status === 'error' && item.errorMessage && (
                        <div className="text-xs text-danger font-medium bg-danger/5 border border-danger/20 px-3 py-2 rounded-lg leading-relaxed">
                          {item.errorMessage}
                        </div>
                      )}

                      {/* Pipeline steps animation visualizer */}
                      {isProcessing && item.status !== 'uploading' && (
                        <div className="flex flex-col space-y-2 pt-2 border-t border-card-border/40 select-none">
                          <span className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wide">
                            Pipeline AI Steps:
                          </span>
                          <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] md:text-[10px]">
                            {['pending', 'parsing', 'chunking', 'indexing', 'ready'].map((step, sIdx) => {
                              const badgeClass = getPipelineClass(item.status, step);
                              const isStepActive = item.status === step;
                              
                              let stepLabel = 'Pending';
                              if (step === 'parsing') stepLabel = 'Parsing';
                              if (step === 'chunking') stepLabel = 'Chunking';
                              if (step === 'indexing') stepLabel = 'Indexing';
                              if (step === 'ready') stepLabel = 'Ready';

                              return (
                                <div 
                                  key={step}
                                  className={`py-1 px-1.5 rounded border transition-all duration-300 font-semibold truncate ${badgeClass}`}
                                >
                                  <div className="flex items-center justify-center gap-1">
                                    {isStepActive && <span className="w-1.5 h-1.5 rounded-full bg-warning animate-ping flex-shrink-0" />}
                                    <span>{stepLabel}</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Link to detail once ready */}
                      {item.status === 'ready' && item.backendId && (
                        <div className="pt-2 border-t border-card-border/40 flex justify-end select-none">
                          <Link
                            href={`/documents/${item.backendId}`}
                            className="inline-flex items-center text-xs font-extrabold text-primary hover:underline"
                          >
                            Buka Detail Dokumen
                            <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right side history log (1 col wide) */}
        <div className="space-y-4 select-none">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-extrabold flex items-center">
              <Clock className="w-4 h-4 text-primary mr-1.5" />
              Riwayat Unggahan Terbaru
            </h3>
            
            <button
              onClick={fetchHistory}
              disabled={loadingHistory}
              className="p-1.5 rounded-lg border border-card-border hover:bg-muted text-muted-foreground transition-all"
              title="Refresh Riwayat"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="glass-panel border border-card-border rounded-2xl p-4 space-y-3 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar shadow-inner">
            {loadingHistory && history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">Memuat riwayat...</span>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                <Clock className="w-8 h-8 text-muted-foreground/60 mb-2" />
                <span className="text-xs text-muted-foreground font-semibold">Belum ada riwayat unggahan</span>
              </div>
            ) : (
              history.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex flex-col space-y-1.5 p-3 rounded-xl hover:bg-muted/20 border border-transparent hover:border-card-border transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <Link
                      href={`/documents/${doc.id}`}
                      className="font-bold text-xs md:text-sm truncate hover:text-primary transition-colors text-foreground flex-1"
                      title={doc.title}
                    >
                      {doc.title}
                    </Link>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex-shrink-0">
                      {doc.source_type || 'PDF'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                    <span className="font-semibold">
                      {doc.chunk_count || 0} Chunks
                    </span>
                    <span className="inline-flex items-center">
                      <span className={`w-1 h-1 rounded-full mr-1 ${
                        doc.status === 'ready' ? 'bg-success' : doc.status === 'error' ? 'bg-danger' : 'bg-warning animate-pulse'
                      }`} />
                      {doc.status}
                    </span>
                  </div>
                  
                  <span className="text-[9px] text-muted-foreground/80 tracking-tight text-right block pt-0.5">
                    {formatDate(doc.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </PageShell>
  );
}
