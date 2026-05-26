'use client';

import React, { useState } from 'react';
import { 
  Columns, 
  ArrowRight, 
  ArrowLeftRight, 
  AlertCircle, 
  Plus, 
  Minus, 
  HelpCircle,
  Download,
  Copy,
  ChevronDown,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { useDocuments } from '@/hooks/use-documents';
import { useCompareMutation } from '@/hooks/use-compare';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function ComparePage() {
  // Load only 'ready' documents for comparison dropdowns
  const { data: docData, isLoading: docsLoading } = useDocuments({ limit: 100, status: 'ready' });
  const compareMutation = useCompareMutation();

  // Local state
  const [oldDocId, setOldDocId] = useState<string>('');
  const [newDocId, setNewDocId] = useState<string>('');
  const [copiedSummary, setCopiedSummary] = useState(false);

  const readyDocs = docData?.documents || [];

  // Swap old and new selections
  const handleSwap = () => {
    const temp = oldDocId;
    setOldDocId(newDocId);
    setNewDocId(temp);
  };

  // Submit compare analysis
  const handleCompare = async () => {
    if (!oldDocId || !newDocId) {
      toast.warning('Silakan pilih kedua dokumen yang ingin dibandingkan');
      return;
    }
    if (oldDocId === newDocId) {
      toast.warning('Dokumen yang dibandingkan harus berbeda');
      return;
    }

    await compareMutation.mutateAsync({
      oldId: oldDocId,
      newId: newDocId
    });
  };

  // Export report
  const handleExportReport = () => {
    const report = compareMutation.data;
    if (!report) return;

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_perbandingan_${Date.now()}.json`;
    a.click();
    toast.success('Laporan perbandingan berhasil diunduh');
  };

  // Copy Summary
  const handleCopySummary = async () => {
    const summary = compareMutation.data?.summary;
    if (!summary) return;

    try {
      await navigator.clipboard.writeText(summary);
      setCopiedSummary(true);
      toast.success('Ringkasan disalin ke clipboard');
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      toast.error('Gagal menyalin ringkasan');
    }
  };

  // Helper mapping category labels
  const getCategoryDetails = (cat: string) => {
    const maps: Record<string, { label: string; bg: string; text: string }> = {
      new_addition: { label: 'Penambahan Baru', bg: 'bg-success/10 text-success border-success/20', text: 'text-success' },
      modification: { label: 'Perubahan / Modifikasi', bg: 'bg-warning/10 text-warning border-warning/20', text: 'text-warning' },
      removal: { label: 'Penghapusan / Pencabutan', bg: 'bg-danger/10 text-danger border-danger/20', text: 'text-danger' },
      renumbering: { label: 'Penomoran Ulang', bg: 'bg-info/10 text-info border-info/20', text: 'text-info' },
    };
    return maps[cat] || { label: 'Amandemen', bg: 'bg-muted text-muted-foreground', text: 'text-muted-foreground' };
  };

  // Segment changes by impact level
  const report = compareMutation.data;
  const changes = report?.changes || [];
  
  const highImpactChanges = changes.filter(c => c.impact === 'HIGH');
  const mediumImpactChanges = changes.filter(c => c.impact === 'MEDIUM');
  const lowImpactChanges = changes.filter(c => c.impact === 'LOW');

  // If there are less than 2 ready documents, show advisory empty state
  if (!docsLoading && readyDocs.length < 2) {
    return (
      <PageShell title="Bandingkan Regulasi">
        <EmptyState
          title="Dokumen Kurang"
          description={`Anda memerlukan minimal 2 dokumen dengan status "Ready" untuk melakukan analisis perbandingan. Saat ini Anda baru memiliki ${readyDocs.length} dokumen ready.`}
          icon={Columns}
          action={{
            label: 'Upload Dokumen Baru',
            href: '/upload'
          }}
        />
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Bandingkan Regulasi"
      description="Lakukan analisis perbandingan versi (side-by-side diff) antar dokumen regulasi keuangan dan deteksi tingkat dampaknya."
    >
      
      {/* Pickers Panel */}
      <div className="glass-panel border border-card-border rounded-2xl p-5 md:p-6 shadow-md select-none">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Old Selector */}
          <div className="flex flex-col space-y-1.5 w-full">
            <label className="text-xs font-bold text-muted-foreground uppercase">Versi Lama (Base)</label>
            <select
              value={oldDocId}
              onChange={(e) => setOldDocId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-card-border glass-panel text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="">Pilih dokumen lama...</option>
              {readyDocs
                .filter(d => d.id !== newDocId)
                .map(d => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.chunk_count} Chunks)
                  </option>
                ))}
            </select>
          </div>

          {/* Swap Trigger Button */}
          <button
            onClick={handleSwap}
            className="p-2.5 rounded-xl border border-card-border glass-panel text-muted-foreground hover:text-foreground hover:bg-muted/30 active:scale-95 transition-all md:mt-5 flex-shrink-0 cursor-pointer"
            title="Tukar Pilihan"
          >
            <ArrowLeftRight className="w-4.5 h-4.5" />
          </button>

          {/* New Selector */}
          <div className="flex flex-col space-y-1.5 w-full">
            <label className="text-xs font-bold text-muted-foreground uppercase">Versi Baru (Amended)</label>
            <select
              value={newDocId}
              onChange={(e) => setNewDocId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-card-border glass-panel text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
            >
              <option value="">Pilih dokumen baru...</option>
              {readyDocs
                .filter(d => d.id !== oldDocId)
                .map(d => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.chunk_count} Chunks)
                  </option>
                ))}
            </select>
          </div>

          {/* Compare Button */}
          <button
            onClick={handleCompare}
            disabled={!oldDocId || !newDocId || compareMutation.isPending}
            className="w-full md:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-sm font-semibold bg-primary text-white shadow-md disabled:opacity-40 shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all md:mt-5 cursor-pointer flex-shrink-0"
          >
            {compareMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Menganalisis...
              </>
            ) : (
              <>
                <Columns className="w-4 h-4 mr-2" />
                Bandingkan
              </>
            )}
          </button>

        </div>
      </div>

      {/* Loading Skeletal State */}
      {compareMutation.isPending && (
        <div className="glass-panel border border-card-border rounded-2xl p-5 md:p-6 space-y-6 mt-6 shadow-md animate-pulse">
          <div className="h-6 bg-muted rounded w-32" />
          <div className="h-24 bg-muted rounded-xl w-full" />
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-40 bg-muted rounded-xl w-full" />
          </div>
        </div>
      )}

      {/* Compare Report Result Panel */}
      {compareMutation.isSuccess && report && (
        <div className="space-y-6 mt-6 animate-scale-in">
          
          {/* Summary Block */}
          <div className="glass-panel border border-card-border rounded-2xl p-5 md:p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col space-y-3.5">
              <div className="flex items-center space-x-2 select-none">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-extrabold text-sm md:text-base text-foreground">
                  Ringkasan Analisis Perubahan
                </h3>
              </div>
              
              <p className="text-xs md:text-sm font-medium text-foreground/90 leading-relaxed select-text">
                {report.summary}
              </p>

              <div className="flex items-center gap-2 select-none pt-2 border-t border-card-border/40">
                <button
                  onClick={handleCopySummary}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border border-card-border hover:border-primary/20 bg-card-bg text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                >
                  {copiedSummary ? (
                    <Check className="w-3 text-success mr-1.5" />
                  ) : (
                    <Copy className="w-3 mr-1.5" />
                  )}
                  Salin Ringkasan
                </button>
                
                <button
                  onClick={handleExportReport}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold border border-card-border hover:border-primary/20 bg-card-bg text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Unduh Laporan Lengkap
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Changes by Impact Groups */}
          <div className="space-y-6">
            
            {/* 1. HIGH IMPACT CHANGES */}
            {highImpactChanges.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm md:text-base font-extrabold text-danger flex items-center select-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-danger mr-2 animate-pulse" />
                  🔴 Perubahan Berdampak Tinggi (HIGH Impact) — {highImpactChanges.length}
                </h3>

                <div className="space-y-4">
                  {highImpactChanges.map((change, idx) => (
                    <ChangeItemCard key={idx} change={change} getCategoryDetails={getCategoryDetails} />
                  ))}
                </div>
              </div>
            )}

            {/* 2. MEDIUM IMPACT CHANGES */}
            {mediumImpactChanges.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm md:text-base font-extrabold text-warning flex items-center select-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning mr-2" />
                  🟡 Perubahan Berdampak Sedang (MEDIUM Impact) — {mediumImpactChanges.length}
                </h3>

                <div className="space-y-4">
                  {mediumImpactChanges.map((change, idx) => (
                    <ChangeItemCard key={idx} change={change} getCategoryDetails={getCategoryDetails} />
                  ))}
                </div>
              </div>
            )}

            {/* 3. LOW IMPACT CHANGES */}
            {lowImpactChanges.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm md:text-base font-extrabold text-success flex items-center select-none">
                  <span className="w-2.5 h-2.5 rounded-full bg-success mr-2" />
                  🟢 Perubahan Berdampak Rendah (LOW Impact) — {lowImpactChanges.length}
                </h3>

                <div className="space-y-4">
                  {lowImpactChanges.map((change, idx) => (
                    <ChangeItemCard key={idx} change={change} getCategoryDetails={getCategoryDetails} />
                  ))}
                </div>
              </div>
            )}

            {/* Zero Changes Warning */}
            {changes.length === 0 && (
              <EmptyState
                title="Tidak Ada Perubahan"
                description="AI pembanding tidak mendeteksi adanya amandemen hukum atau perbedaan materiil antara kedua versi dokumen ini."
                icon={HelpCircle}
              />
            )}

            {/* Core Unchanged Section */}
            {report.unchanged_core && (
              <div className="glass-panel border border-card-border rounded-2xl p-5 md:p-6 shadow-sm select-none">
                <h4 className="text-xs md:text-sm font-bold text-foreground mb-2 flex items-center">
                  <Layers className="w-4 h-4 text-primary mr-2" />
                  Ketentuan Utama yang Tidak Berubah (Core Unchanged):
                </h4>
                <p className="text-xs md:text-sm text-muted-foreground leading-relaxed italic">
                  {report.unchanged_core}
                </p>
              </div>
            )}

          </div>

        </div>
      )}

    </PageShell>
  );
}

// Inner subcomponent card for each comparative change item
function ChangeItemCard({ 
  change, 
  getCategoryDetails 
}: { 
  change: any; 
  getCategoryDetails: (cat: string) => { label: string; bg: string; text: string } 
}) {
  const cat = getCategoryDetails(change.category);
  
  return (
    <div className="glass-panel border border-card-border rounded-xl p-4 md:p-5 shadow-sm space-y-3.5">
      
      {/* Change Item Subheader */}
      <div className="flex flex-wrap items-center justify-between gap-2 select-none">
        <div className="flex items-center space-x-2">
          <span className={cn("text-[10px] md:text-xs font-extrabold border px-2 py-0.5 rounded-md shadow-sm uppercase", cat.bg)}>
            {cat.label}
          </span>
          {change.affected_sections && change.affected_sections.length > 0 && (
            <span className="text-[10px] md:text-xs font-bold text-foreground bg-muted border border-card-border/60 px-2 py-0.5 rounded-md">
              {change.affected_sections.join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Description Summary */}
      <p className="text-xs md:text-sm font-bold text-foreground leading-relaxed select-text">
        {change.summary}
      </p>

      {/* Custom premium text diff visualizer block */}
      {(change.old_text || change.new_text) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 border-t border-card-border/40 pt-3 select-text">
          {/* Old Text deletion */}
          {change.old_text ? (
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] text-danger/80 font-extrabold uppercase flex items-center select-none">
                <Minus className="w-3 h-3 mr-0.5" />
                Ketentuan Lama
              </span>
              <div className="bg-danger/5 border-l-2 border-danger text-xs md:text-sm font-medium p-3 rounded-r-lg text-danger/90 leading-relaxed font-mono break-all md:break-words whitespace-pre-wrap shadow-inner min-h-[50px]">
                {change.old_text}
              </div>
            </div>
          ) : (
            <div className="hidden md:block flex-col space-y-1 text-center items-center justify-center bg-muted/10 rounded-lg p-5 border border-dashed border-card-border/30">
              <span className="text-xs text-muted-foreground/50 font-semibold italic">Tidak ada referensi teks sebelumnya</span>
            </div>
          )}

          {/* New Text addition */}
          {change.new_text && (
            <div className="flex flex-col space-y-1">
              <span className="text-[9px] text-success/80 font-extrabold uppercase flex items-center select-none">
                <Plus className="w-3 h-3 mr-0.5" />
                Ketentuan Baru
              </span>
              <div className="bg-success/5 border-l-2 border-success text-xs md:text-sm font-medium p-3 rounded-r-lg text-success/90 leading-relaxed font-mono break-all md:break-words whitespace-pre-wrap shadow-inner min-h-[50px]">
                {change.new_text}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// Check icon stub
function Check(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
