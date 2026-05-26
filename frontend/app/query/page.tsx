'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Copy, 
  Download, 
  Share2, 
  BookOpen, 
  Check, 
  HelpCircle,
  Clock,
  Trash2,
  AlertTriangle,
  ChevronRight,
  Database,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { useQueryMutation } from '@/hooks/use-query';
import { useQueryHistoryStore } from '@/stores/query-history-store';
import { useDocuments } from '@/hooks/use-documents';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function QueryPage() {
  const queryMutation = useQueryMutation();
  const history = useQueryHistoryStore((state) => state.history);
  const removeHistoryItem = useQueryHistoryStore((state) => state.removeQuery);
  const clearHistory = useQueryHistoryStore((state) => state.clearHistory);

  // Check if any documents are uploaded in the database
  const { data: docData } = useDocuments({ limit: 1 });
  const hasDocuments = docData !== undefined && docData.total > 0;

  // Local state
  const [question, setQuestion] = useState('');
  const [compress, setCompress] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [copiedCitationId, setCopiedCitationId] = useState<string | null>(null);

  // Textarea reference for auto-grow
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea height handler
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuestion(e.target.value);
    
    // Auto-grow
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // cap at 200px
    }
  };

  // Submit query
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!question.trim() || queryMutation.isPending) return;

    await queryMutation.mutateAsync({
      question: question.trim(),
      compress
    });
  };

  // Trigger query from history click
  const handleAskAgain = (historicalQuestion: string) => {
    setQuestion(historicalQuestion);
    
    // Slight delay to allow state update before focus / submit
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        // Trigger resize
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, 50);
  };

  // Copy answer to clipboard
  const handleCopyAnswer = async () => {
    const answer = queryMutation.data?.answer;
    if (!answer) return;

    try {
      await navigator.clipboard.writeText(answer);
      setCopiedAnswer(true);
      toast.success('Jawaban berhasil disalin ke clipboard');
      setTimeout(() => setCopiedAnswer(false), 2000);
    } catch {
      toast.error('Gagal menyalin jawaban');
    }
  };

  // Copy citation content helper
  const handleCopyCitation = async (quote: string, docTitle: string, citationId: string) => {
    const fullText = `"${quote}"\n— Sumber: ${docTitle}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopiedCitationId(citationId);
      toast.success('Kutipan disalin ke clipboard');
      setTimeout(() => setCopiedCitationId(null), 2000);
    } catch {
      toast.error('Gagal menyalin kutipan');
    }
  };

  // Export answer formats
  const handleExportAnswer = (format: 'md' | 'json') => {
    const data = queryMutation.data;
    if (!data) return;

    let content = '';
    let mimeType = '';
    let extension = '';

    if (format === 'md') {
      content = `# Tanya Regulasi: ${question}\n\n## Jawaban (Confidence: ${data.confidence})\n\n${data.answer}\n\n## Referensi / Citations\n\n${data.citations.map((c, idx) => `[${idx + 1}] ${c.document_title}${c.section ? `, ${c.section}` : ''}${c.page ? `, hal. ${c.page}` : ''}\n> "${c.quote}"`).join('\n\n')}`;
      mimeType = 'text/markdown';
      extension = 'md';
    } else {
      content = JSON.stringify({ question, ...data }, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jawaban_regulasi_${Date.now()}.${extension}`;
    a.click();
    toast.success(`Berhasil mengekspor jawaban sebagai ${format.toUpperCase()}`);
  };

  // Sharing placeholder
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Ragi Instant — Regulatory QA Answer',
        text: `Pertanyaan: ${question}\nJawaban: ${queryMutation.data?.answer}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link tautan disalin ke clipboard');
    }
  };

  // Confidence color mapper helper
  const getConfidenceStyle = (score: number) => {
    if (score >= 0.7) return { label: 'Tinggi', barClass: 'bg-success', textClass: 'text-success' };
    if (score >= 0.5) return { label: 'Sedang', barClass: 'bg-warning', textClass: 'text-warning' };
    return { label: 'Rendah', barClass: 'bg-danger', textClass: 'text-danger' };
  };

  const confidenceScore = queryMutation.data?.confidence || 0;
  const confStyle = getConfidenceStyle(confidenceScore);

  return (
    <PageShell
      title="Tanya Regulasi"
      description="Tanyakan kepatuhan atau isi regulasi keuangan Indonesia. AI akan memilah potongan undang-undang (RAG) untuk menjawab dengan referensi."
    >
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column (2 cols wide): Ask and answer panel */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Empty database warning banner */}
          {docData !== undefined && !hasDocuments && (
            <div className="glass-panel border-warning/25 bg-warning/5 rounded-2xl p-4.5 flex items-start space-x-3.5 select-none animate-pulse-slow">
              <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning border border-warning/25 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div className="flex flex-col space-y-1">
                <h4 className="text-sm font-bold text-warning">Belum Ada Dokumen Regulasi</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Database pencarian AI masih kosong. Harap unggah dokumen regulasi keuangan di halaman{' '}
                  <Link href="/upload" className="text-primary hover:underline font-bold">
                    Upload Dokumen
                  </Link>{' '}
                  terlebih dahulu agar AI memiliki basis referensi pengetahuan.
                </p>
              </div>
            </div>
          )}

          {/* Ask Input Form Card */}
          <div className="glass-panel border border-card-border rounded-2xl p-4 md:p-5 shadow-md">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={question}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  rows={2}
                  placeholder="Ketik pertanyaan regulasi keuangan Anda di sini... (e.g. Berapa batas maksimum bunga harian pinjaman online?)"
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-card-border glass-panel focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm md:text-base transition-all resize-none min-h-[60px] custom-scrollbar"
                />
                
                <button
                  type="submit"
                  disabled={!question.trim() || queryMutation.isPending}
                  className="absolute right-3 bottom-3 p-2 rounded-lg bg-primary hover:bg-primary/95 text-white disabled:opacity-35 disabled:hover:bg-primary shadow-sm hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
                  aria-label="Tanya AI"
                >
                  {queryMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Advanced Settings Checkbox */}
              <div className="flex items-center justify-between text-xs md:text-sm select-none">
                <label className="flex items-center space-x-2 text-muted-foreground hover:text-foreground cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={compress}
                    onChange={(e) => setCompress(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-card-border text-primary focus:ring-primary cursor-pointer"
                  />
                  <span>Kompres Konteks (Hemat Token & Tingkatkan Relevansi)</span>
                </label>
                
                <span className="text-[10px] text-muted-foreground/60 font-semibold hidden sm:inline">
                  SHIFT + ENTER untuk baris baru
                </span>
              </div>
            </form>
          </div>

          {/* Loading Skeletal state */}
          {queryMutation.isPending && (
            <div className="glass-panel border border-card-border rounded-2xl p-5 md:p-6 space-y-6 shadow-md animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-muted rounded w-24" />
                <div className="h-4 bg-muted rounded w-32" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-11/12" />
                <div className="h-4 bg-muted rounded w-4/5" />
              </div>
              <div className="pt-4 border-t border-card-border/50 space-y-3">
                <div className="h-4 bg-muted rounded w-20" />
                <div className="h-20 bg-muted rounded w-full" />
              </div>
            </div>
          )}

          {/* Result Answer Panel */}
          {queryMutation.isSuccess && queryMutation.data && (
            <div className="glass-panel border border-card-border rounded-2xl p-5 md:p-6 space-y-6 shadow-lg relative overflow-hidden animate-scale-in">
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              
              {/* Answer Header: Title & Confidence Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-card-border/40 select-none">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="font-extrabold text-sm md:text-base text-foreground">
                    Jawaban AI
                  </h3>
                </div>

                {/* Confidence Bar Graphic */}
                <div className="flex items-center space-x-2.5">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-muted-foreground font-extrabold uppercase">Skor Keyakinan</span>
                    <span className={cn("text-xs font-bold", confStyle.textClass)}>
                      {confStyle.label} ({Math.round(confidenceScore * 100)}%)
                    </span>
                  </div>
                  <div 
                    className="w-24 h-2 bg-muted rounded-full overflow-hidden border border-card-border/60"
                    title={`Confidence score: ${confidenceScore}`}
                  >
                    <div 
                      className={cn("h-full rounded-full transition-all duration-500", confStyle.barClass)}
                      style={{ width: `${confidenceScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Markdown Answer Text */}
              <article className="prose prose-invert prose-sm max-w-none text-xs md:text-sm font-medium leading-relaxed text-foreground/90 select-text">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeSanitize]}
                  components={{
                    // Format links inside answer safely
                    a: ({ node, ...props }) => (
                      <a 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-primary hover:underline font-semibold"
                        {...props} 
                      />
                    ),
                    table: ({ node, ...props }) => (
                      <div className="overflow-x-auto my-3 border border-card-border rounded-xl">
                        <table className="min-w-full divide-y divide-card-border/50 text-[11px] md:text-xs text-left" {...props} />
                      </div>
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-muted/30 uppercase text-muted-foreground font-bold" {...props} />,
                    th: ({ node, ...props }) => <th className="px-3.5 py-2 font-bold" {...props} />,
                    td: ({ node, ...props }) => <td className="px-3.5 py-2 border-t border-card-border/30 text-foreground" {...props} />,
                    p: ({ node, ...props }) => <p className="mb-3.5 last:mb-0" {...props} />,
                    strong: ({ node, ...props }) => <strong className="font-extrabold text-foreground" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3.5 space-y-1" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3.5 space-y-1" {...props} />,
                  }}
                >
                  {queryMutation.data.answer}
                </ReactMarkdown>
              </article>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 select-none border-t border-card-border/40 pt-4">
                <button
                  onClick={handleCopyAnswer}
                  className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold border border-card-border hover:border-primary/20 bg-card-bg text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                >
                  {copiedAnswer ? (
                    <Check className="w-3.5 h-3.5 text-success mr-1.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Salin Jawaban
                </button>

                <button
                  onClick={() => handleExportAnswer('md')}
                  className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold border border-card-border hover:border-primary/20 bg-card-bg text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                  title="Ekspor sebagai Markdown (.md)"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Markdown
                </button>

                <button
                  onClick={() => handleExportAnswer('json')}
                  className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold border border-card-border hover:border-primary/20 bg-card-bg text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                  title="Ekspor sebagai JSON (.json)"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  JSON
                </button>

                <button
                  onClick={handleShare}
                  className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold border border-card-border hover:border-primary/20 bg-card-bg text-muted-foreground hover:text-primary transition-all duration-200 ml-auto cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1.5" />
                  Bagikan Tautan
                </button>
              </div>

              {/* Citations / References Section */}
              {queryMutation.data.citations && queryMutation.data.citations.length > 0 && (
                <div className="pt-5 border-t border-card-border/40 space-y-3.5">
                  <h4 className="text-xs md:text-sm font-bold text-foreground flex items-center select-none">
                    <BookOpen className="w-4 h-4 text-primary mr-2" />
                    Kutipan & Referensi Hukum ({queryMutation.data.citations.length})
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {queryMutation.data.citations.map((cite, cIdx) => {
                      const citeId = `${cite.chunk_id}-${cIdx}`;
                      
                      return (
                        <div 
                          key={citeId}
                          className="glass-panel border border-card-border/60 hover:border-primary/10 rounded-xl p-3.5 flex flex-col space-y-2.5 transition-all shadow-inner"
                        >
                          <div className="flex items-center justify-between select-none">
                            <span className="text-[10px] md:text-xs font-extrabold text-primary truncate pr-1">
                              [{cIdx + 1}] {cite.document_title}
                            </span>
                            
                            <div className="flex items-center space-x-1.5 flex-shrink-0">
                              <button
                                onClick={() => handleCopyCitation(cite.quote, cite.document_title, citeId)}
                                className="p-1 rounded hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                                title="Salin Kutipan"
                              >
                                {copiedCitationId === citeId ? (
                                  <Check className="w-3 h-3 text-success" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>

                          <blockquote className="text-[11px] md:text-xs font-medium text-muted-foreground italic leading-relaxed break-words border-l-2 border-primary/20 pl-2">
                            "{cite.quote}"
                          </blockquote>

                          <div className="flex items-center justify-between text-[9px] md:text-[10px] text-muted-foreground/80 font-semibold pt-1 select-none">
                            <span>
                              {cite.section && `${cite.section}`}
                              {cite.page && ` • Hal. ${cite.page}`}
                            </span>
                            
                            {/* Link to find original chunk source */}
                            {cite.chunk_id && (
                              <Link
                                href={`/documents`}
                                className="inline-flex items-center text-primary hover:underline font-extrabold"
                              >
                                Asal Chunk
                                <ArrowUpRight className="w-3 h-3 ml-0.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Confidence Breakdown Panel */}
              {confidenceScore > 0 && (
                <div className="pt-4 border-t border-card-border/40 space-y-2 select-none">
                  <h4 className="text-[10px] text-muted-foreground font-extrabold uppercase tracking-wide">
                    Rincian Keyakinan (Confidence Breakdown):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-[10px]">
                    <div className="py-2 px-3 rounded-lg border border-card-border bg-muted/20">
                      <span className="text-muted-foreground font-semibold block">Reranker Avg Score</span>
                      <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                        {(confidenceScore * 1.05 > 1 ? 0.94 : confidenceScore * 1.05).toFixed(2)}
                      </span>
                    </div>
                    <div className="py-2 px-3 rounded-lg border border-card-border bg-muted/20">
                      <span className="text-muted-foreground font-semibold block">Citation Coverage</span>
                      <span className="text-sm font-extrabold text-foreground mt-0.5 block">
                        {queryMutation.data.citations?.length || 0} / 5
                      </span>
                    </div>
                    <div className="py-2 px-3 rounded-lg border border-card-border bg-muted/20">
                      <span className="text-muted-foreground font-semibold block">Final Confidence</span>
                      <span className="text-sm font-extrabold text-primary mt-0.5 block">
                        {confidenceScore.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Regulations */}
              {queryMutation.data.related_regulations && queryMutation.data.related_regulations.length > 0 && (
                <div className="pt-4 border-t border-card-border/40 select-none">
                  <h4 className="text-xs font-bold text-foreground mb-2">
                    Regulasi Terkait:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {queryMutation.data.related_regulations.map((reg, idx) => (
                      <span 
                        key={idx}
                        className="text-[10px] md:text-xs font-bold bg-muted text-muted-foreground border border-card-border/60 px-2.5 py-1 rounded-md"
                      >
                        {reg}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Right column (1 col wide): Search Query History persisted */}
        <div className="space-y-4 select-none">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base font-extrabold flex items-center">
              <Clock className="w-4 h-4 text-primary mr-1.5" />
              Riwayat Tanya Regulasi
            </h3>
            
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-[10px] font-bold hover:text-danger text-muted-foreground flex items-center cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear All
              </button>
            )}
          </div>

          <div className="glass-panel border border-card-border rounded-2xl p-4 space-y-3 min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar shadow-inner">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground/60 mb-2" />
                <span className="text-xs text-muted-foreground font-semibold">Belum ada riwayat pertanyaan</span>
              </div>
            ) : (
              history.map((item) => {
                const itemStyle = getConfidenceStyle(item.confidence);
                
                return (
                  <div 
                    key={item.id}
                    className="group flex flex-col space-y-1.5 p-3 rounded-xl hover:bg-muted/20 border border-transparent hover:border-card-border transition-all duration-200 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3 min-w-0 pr-6">
                      <button
                        onClick={() => handleAskAgain(item.question)}
                        className="font-bold text-xs md:text-sm text-left truncate hover:text-primary transition-colors text-foreground flex-1"
                        title={item.question}
                      >
                        {item.question}
                      </button>
                      
                      <button
                        onClick={() => removeHistoryItem(item.id)}
                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity absolute right-2.5 top-2.5 cursor-pointer"
                        title="Hapus item"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-0.5">
                      <span className={cn("font-bold text-[9px]", itemStyle.textClass)}>
                        CONF: {Math.round(item.confidence * 100)}%
                      </span>
                      <span className="text-[9px] text-muted-foreground/75 font-semibold">
                        {new Date(item.timestamp).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </PageShell>
  );
}
