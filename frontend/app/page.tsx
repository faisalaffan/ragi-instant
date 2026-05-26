'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Layers, 
  CheckCircle2, 
  UploadCloud, 
  MessageSquare, 
  Columns, 
  BarChart3, 
  ArrowRight,
  TrendingUp,
  History,
  Activity,
  ChevronRight,
  Database
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { StatsCard } from '@/components/shared/stats-card';
import { EmptyState } from '@/components/shared/empty-state';
import { useDocuments } from '@/hooks/use-documents';
import { useQueryHistoryStore } from '@/stores/query-history-store';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  // Fetch latest documents to compute aggregated stats
  const { data, isLoading, isError, refetch } = useDocuments({ limit: 10 });
  const queryHistory = useQueryHistoryStore((state) => state.history);

  const documents = data?.documents || [];
  const totalDocs = data?.total || 0;

  // Calculate aggregated stats
  const totalChunks = documents.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0);
  const readyDocs = documents.filter(doc => doc.status === 'ready').length;
  const processingDocs = documents.filter(doc => 
    ['pending', 'parsing', 'chunking', 'indexing'].includes(doc.status)
  ).length;

  const recentDocs = documents.slice(0, 5);
  const recentQueries = queryHistory.slice(0, 4);

  // Quick Action Configuration
  const quickActions = [
    {
      label: 'Upload Dokumen',
      desc: 'Tambahkan berkas peraturan POJK/PBI baru',
      href: '/upload',
      icon: UploadCloud,
      color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/20 text-blue-500',
    },
    {
      label: 'Tanya Regulasi',
      desc: 'Ajukan pertanyaan kepatuhan hukum ke AI',
      href: '/query',
      icon: MessageSquare,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/20 text-emerald-500',
    },
    {
      label: 'Bandingkan Dokumen',
      desc: 'Analisis perbedaan isi draf side-by-side',
      href: '/compare',
      icon: Columns,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/20 text-amber-500',
    },
  ];

  return (
    <PageShell
      title="Ragi Instant Intelligence"
      description="Regulatory & Compliance Intelligence Platform untuk memantau, menganalisis, dan menanyakan dokumen regulasi keuangan Indonesia."
    >
      
      {/* 1. Aggregated Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 select-none">
        <StatsCard
          label="Total Dokumen Terindeks"
          value={isLoading ? null : totalDocs}
          subtitle="Undang-undang, POJK, SEOJK, & PBI"
          trend={totalDocs > 0 ? { direction: 'up', value: '3 baru' } : undefined}
          icon={FileText}
          loading={isLoading}
        />
        
        <StatsCard
          label="Jumlah Potongan Chunks"
          value={isLoading ? null : totalChunks}
          subtitle="Teks terfragmentasi di index vektor"
          icon={Layers}
          loading={isLoading}
        />

        <StatsCard
          label="Status Pipeline AI"
          value={isLoading ? null : `${readyDocs} Ready`}
          subtitle={processingDocs > 0 ? `Sedang memproses ${processingDocs} dokumen` : 'Seluruh sistem tersinkronisasi'}
          variant={processingDocs > 0 ? 'warning' : 'success'}
          icon={CheckCircle2}
          loading={isLoading}
        />
      </div>

      {/* 2. Quick Actions Panels */}
      <div className="space-y-3.5 pt-2 select-none">
        <h3 className="text-xs md:text-sm font-extrabold text-muted-foreground uppercase tracking-wider flex items-center">
          <Activity className="w-4 h-4 text-primary mr-1.5" />
          Aksi Cepat Fitur Utama
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link 
                key={idx} 
                href={action.href}
                className={cn(
                  "glass-panel border p-5 rounded-2xl flex items-start space-x-4 bg-gradient-to-br transition-all duration-300 hover:scale-[1.01] hover:shadow-lg active:scale-95",
                  action.color
                )}
              >
                <div className="p-3 bg-background rounded-xl border border-card-border/60 shadow-inner">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm md:text-base text-foreground">
                    {action.label}
                  </span>
                  <span className="text-[11px] md:text-xs text-muted-foreground mt-0.5 leading-relaxed font-semibold">
                    {action.desc}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. Columns: Recent Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        
        {/* Left Column: Recent documents */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between select-none">
            <h3 className="text-xs md:text-sm font-extrabold text-muted-foreground uppercase tracking-wider flex items-center">
              <Database className="w-4 h-4 text-primary mr-1.5" />
              Dokumen Regulasi Terbaru
            </h3>
            
            {totalDocs > 0 && (
              <Link 
                href="/documents"
                className="text-[10px] md:text-xs font-bold text-primary hover:underline flex items-center"
              >
                Lihat Semua
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            )}
          </div>

          <div className="glass-panel border border-card-border rounded-2xl p-4.5 space-y-3.5 min-h-[250px] shadow-sm">
            {isLoading ? (
              <div className="space-y-3 animate-pulse">
                {[...Array(3)].map((_, idx) => (
                  <div key={idx} className="h-14 bg-muted rounded-xl w-full" />
                ))}
              </div>
            ) : totalDocs === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <FileText className="w-8 h-8 text-muted-foreground/60 mb-2" />
                <span className="text-xs text-muted-foreground font-semibold">Belum ada dokumen diunggah</span>
              </div>
            ) : (
              recentDocs.map((doc) => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/10 border border-transparent hover:border-card-border/50 transition-all duration-200 select-none"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-4">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/15 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <Link
                        href={`/documents/${doc.id}`}
                        className="font-bold text-xs md:text-sm truncate hover:text-primary transition-colors text-foreground"
                        title={doc.title}
                      >
                        {doc.title}
                      </Link>
                      <span className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                        {doc.chunk_count || 0} chunks • {formatDate(doc.created_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center flex-shrink-0">
                    <StatusBadge status={doc.status} size="sm" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Queries history */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between select-none">
            <h3 className="text-xs md:text-sm font-extrabold text-muted-foreground uppercase tracking-wider flex items-center">
              <History className="w-4 h-4 text-primary mr-1.5" />
              Pertanyaan RAG Terakhir
            </h3>
            
            {queryHistory.length > 0 && (
              <Link 
                href="/query"
                className="text-[10px] md:text-xs font-bold text-primary hover:underline flex items-center"
              >
                Tanya Lagi
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>
            )}
          </div>

          <div className="glass-panel border border-card-border rounded-2xl p-4.5 space-y-3.5 min-h-[250px] shadow-sm">
            {queryHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <MessageSquare className="w-8 h-8 text-muted-foreground/60 mb-2" />
                <span className="text-xs text-muted-foreground font-semibold">Belum ada riwayat pencarian AI</span>
              </div>
            ) : (
              recentQueries.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/10 border border-transparent hover:border-card-border/50 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-4">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary border border-primary/15 flex items-center justify-center flex-shrink-0 select-none">
                      <MessageSquare className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <Link
                        href="/query"
                        className="font-bold text-xs md:text-sm truncate hover:text-primary transition-colors text-foreground"
                        title={item.question}
                      >
                        {item.question}
                      </Link>
                      <span className="text-[10px] text-muted-foreground mt-0.5 font-semibold select-none">
                        Confidence: <span className={cn(
                          "font-bold",
                          item.confidence >= 0.7 ? 'text-success' : item.confidence >= 0.5 ? 'text-warning' : 'text-danger'
                        )}>{Math.round(item.confidence * 100)}%</span>
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/query"
                    className="p-1 rounded-lg border border-card-border/60 hover:border-primary/20 text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all flex-shrink-0 select-none"
                    title="Tanya lagi"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </PageShell>
  );
}
