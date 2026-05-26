'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  ShieldAlert,
  Sparkles,
  Loader2,
  FileJson
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RagasMetric {
  name: string;
  score: number;
  target: number;
  description: string;
  status: 'PASS' | 'FAIL' | 'NEUTRAL';
}

interface QuestionResult {
  id: string;
  question: string;
  confidence: number;
  citationsCount: number;
  latency: string;
  groundTruth: string;
  answer: string;
  citations: string[];
}

export default function EvalPage() {
  // Ragas Metrics State
  const [metrics, setMetrics] = useState<RagasMetric[]>([
    { name: 'Faithfulness (Kebenaran Faktual)', score: 0.89, target: 0.85, status: 'PASS', description: 'Menilai apakah jawaban AI didukung sepenuhnya oleh dokumen referensi yang diekstrak.' },
    { name: 'Answer Relevancy (Relevansi Jawaban)', score: 0.83, target: 0.80, status: 'PASS', description: 'Menilai seberapa langsung dan relevan jawaban AI terhadap pertanyaan pengguna.' },
    { name: 'Context Precision (Presisi Konteks)', score: 0.76, target: 0.75, status: 'PASS', description: 'Menilai seberapa presisi potongan teks (chunks) yang diambil oleh RAG terhadap kebutuhan jawaban.' },
  ]);

  // Questions Mock Results State
  const [results, setResults] = useState<QuestionResult[]>([
    {
      id: 'q1',
      question: 'Berapa batas maksimum bunga harian pinjaman online menurut OJK terbaru?',
      confidence: 0.89,
      citationsCount: 3,
      latency: '1.1s',
      groundTruth: 'Batas maksimum bunga harian atau manfaat ekonomi pinjaman online adalah 0,4% per hari dari nilai pendanaan sesuai POJK No. 10/PT. LKM/2022.',
      answer: 'Berdasarkan ketentuan regulasi POJK No. 10/PT. LKM/2022 tentang Layanan Pendanaan Bersama Berbasis Teknologi Informasi, batas maksimum manfaat ekonomi (termasuk di dalamnya bunga pinjaman online) ditetapkan sebesar 0,4% per hari dari nilai pendanaan yang tertulis dalam perjanjian.',
      citations: ['POJK No. 10/PT. LKM/2022 Pasal 5 Ayat 2 - hal 12', 'SEOJK No. 19/SEOJK.06/2023 - hal 5']
    },
    {
      id: 'q2',
      question: 'Berapa CAR (Capital Adequacy Ratio) minimum bagi bank umum konvensional?',
      confidence: 0.76,
      citationsCount: 2,
      latency: '1.3s',
      groundTruth: 'Penyelenggara bank umum konvensional wajib memelihara modal minimum CAR sebesar 8% hingga 14% disesuaikan dengan peringkat profil risiko bank.',
      answer: 'Bank umum konvensional diwajibkan untuk memelihara penyediaan modal minimum (CAR) paling sedikit sebesar 8% dari Aset Tertimbang Menurut Risiko (ATMR) untuk bank profil risiko tingkat 1, dan dapat meningkat hingga 14% disesuaikan dengan peringkat profil risiko masing-masing bank.',
      citations: ['POJK No. 22/POJK.03/2023 Pasal 3 - hal 14', 'PBI No. 19/12/PBI/2017 - hal 8']
    },
    {
      id: 'q3',
      question: 'Apa saja sanksi administratif jika penyelenggara peer-to-peer lending melanggar ketentuan batas ekonomi?',
      confidence: 0.91,
      citationsCount: 4,
      latency: '1.4s',
      groundTruth: 'Sanksi berupa peringatan tertulis, denda administratif maksimal Rp 100.000.000, pembatasan kegiatan usaha, hingga pencabutan izin usaha.',
      answer: 'Pelanggaran atas ketentuan batas maksimum manfaat ekonomi akan dikenakan sanksi administratif secara bertahap meliputi: 1) Peringatan tertulis, 2) Denda administratif maksimal Rp 100.000.000, 3) Pembatasan kegiatan usaha sebagian atau seluruhnya, dan 4) Pencabutan izin usaha oleh OJK.',
      citations: ['POJK No. 10/PT. LKM/2022 Pasal 47 - hal 25', 'SEOJK No. 19/SEOJK.06/2023 - hal 18']
    }
  ]);

  // Local State
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});
  const [evaluating, setEvaluating] = useState(false);
  const [evalProgress, setEvalProgress] = useState(0);

  // Toggle item detail
  const handleToggleExpand = (id: string) => {
    setExpandedResults(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Re-run evaluation simulator
  const handleRunEvaluation = () => {
    if (evaluating) return;
    setEvaluating(true);
    setEvalProgress(1);
    toast.info('Evaluasi ulang metrik RAGAS dimulai...');

    const duration = 5000; // 5s run
    const intervalTime = 500;
    const steps = duration / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const percent = Math.min(Math.round((currentStep / steps) * 100), 100);
      setEvalProgress(percent);

      if (currentStep >= steps) {
        clearInterval(interval);
        setEvaluating(false);
        setEvalProgress(0);

        // Slightly update scores to simulate recalculations
        setMetrics(prev => prev.map(m => {
          const delta = (Math.random() - 0.4) * 0.04; // small change
          const newScore = Math.min(Math.max(parseFloat((m.score + delta).toFixed(2)), 0), 1);
          return {
            ...m,
            score: newScore,
            status: newScore >= m.target ? 'PASS' : 'FAIL'
          };
        }));
        
        toast.success('Metrik RAGAS berhasil diperbarui!');
      }
    }, intervalTime);
  };

  // Download results JSON
  const handleDownloadResults = () => {
    const exportData = {
      evaluated_at: new Date().toISOString(),
      dataset_size: 30,
      metrics: metrics,
      detailed_results: results
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ragas_evaluasi_${Date.now()}.json`;
    a.click();
    toast.success('Laporan RAGAS JSON diunduh');
  };

  return (
    <PageShell
      title="Evaluasi RAGAS"
      description="Pantau performa kebenaran faktual, presisi konteks, dan relevansi jawaban AI menggunakan kerangka kerja evaluasi RAGAS (RAG Assessment)."
    >
      
      <div className="space-y-6">
        
        {/* Run Evaluation Simulator Progress Overlay */}
        {evaluating && (
          <div className="glass-panel border-warning/25 bg-warning/5 rounded-2xl p-5 md:p-6 shadow-md select-none animate-pulse-slow">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm font-bold text-warning flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Mengevaluasi RAGAS Pipeline ({evalProgress}%)...
                </span>
                <span className="text-[10px] md:text-xs text-muted-foreground font-semibold">
                  Memproses Q{Math.ceil((evalProgress / 100) * 30)}/30 Pasang Pertanyaan
                </span>
              </div>
              <div className="w-full bg-muted/40 h-2.5 rounded-full overflow-hidden border border-card-border/50">
                <div 
                  className="h-full bg-warning transition-all duration-300 rounded-full"
                  style={{ width: `${evalProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 1: Metrics display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 select-none">
          {metrics.map((m, idx) => {
            const isPass = m.status === 'PASS';
            return (
              <div 
                key={idx}
                className={cn(
                  "glass-panel rounded-2xl p-5 border flex flex-col justify-between h-36 transition-all duration-200 shadow-sm",
                  isPass ? "border-success/15 bg-success/5" : "border-danger/15 bg-danger/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs md:text-sm font-medium text-muted-foreground truncate pr-2">
                    {m.name.split(' (')[0]}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold border px-1.5 py-0.5 rounded-md shadow-inner",
                    isPass ? "bg-success/10 text-success border-success/10" : "bg-danger/10 text-danger border-danger/10"
                  )}>
                    {isPass ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <div className="flex flex-col">
                    <span className="text-3xl font-extrabold tracking-tight">
                      {m.score.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                      Target: &gt;{m.target.toFixed(2)}
                    </span>
                  </div>
                  
                  {isPass ? (
                    <CheckCircle2 className="w-8 h-8 text-success/20 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-danger/20 flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION 2: Benchmark Table */}
        <div className="glass-panel border border-card-border rounded-2xl overflow-hidden shadow-md select-none">
          <div className="p-5 border-b border-card-border/40 bg-muted/10 font-extrabold text-sm md:text-base text-foreground flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <span>Tabel Tolok Ukur (Benchmark Table)</span>
            </div>
            
            <span className="text-[10px] md:text-xs text-muted-foreground font-semibold">
              Terakhir Dijalankan: 26 Mei 2026, 10:30 WIB
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-card-border/40 text-xs md:text-sm text-left">
              <thead className="bg-muted/5 font-bold text-muted-foreground uppercase text-[10px] md:text-xs">
                <tr>
                  <th className="px-5 py-3.5">Metrik Evaluasi</th>
                  <th className="px-5 py-3.5 text-center">Skor Sekarang</th>
                  <th className="px-5 py-3.5 text-center">Batas Target</th>
                  <th className="px-5 py-3.5 text-right">Hasil Evaluasi</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-card-border/30 font-medium">
                {metrics.map((m, idx) => {
                  const isPass = m.status === 'PASS';
                  return (
                    <tr key={idx} className="hover:bg-muted/5 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground">{m.name}</span>
                          <span className="text-[10px] md:text-xs text-muted-foreground mt-0.5 font-normal leading-relaxed max-w-xl">
                            {m.description}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center font-extrabold text-sm">
                        {m.score.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-center text-muted-foreground font-semibold">
                        &gt;{m.target.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border shadow-inner",
                          isPass ? "bg-success/5 text-success border-success/15" : "bg-danger/5 text-danger border-danger/15"
                        )}>
                          {isPass ? '✓ Lulus Target' : '✗ Dibawah Target'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-muted/10 border-t border-card-border/40 text-[10px] md:text-xs text-muted-foreground font-semibold text-center leading-relaxed">
            Metrik di atas diuji pada dataset patokan berisi <span className="text-foreground font-extrabold">30 Q&A pairs</span> dari dokumen POJK & PBI menggunakan model GPT-4o sebagai evaluator.
          </div>
        </div>

        {/* SECTION 3: Detailed Questions Results list */}
        <div className="space-y-4">
          <div className="flex items-center justify-between select-none">
            <h3 className="text-sm md:text-base font-extrabold flex items-center">
              <ShieldAlert className="w-4.5 h-4.5 text-primary mr-1.5" />
              Detail Per-Pertanyaan Evaluasi (3)
            </h3>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadResults}
                className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold border border-card-border hover:border-primary/20 bg-card-bg text-muted-foreground hover:text-primary transition-all duration-200 cursor-pointer"
              >
                <FileJson className="w-3.5 h-3.5 mr-1" />
                Download JSON
              </button>

              <button
                onClick={handleRunEvaluation}
                disabled={evaluating}
                className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white shadow-sm hover:shadow-md disabled:opacity-40 transition-all cursor-pointer"
              >
                {evaluating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                    Menghitung...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 mr-1" />
                    Evaluasi Ulang
                  </>
                )}
              </button>
            </div>
          </div>

          {/* List display */}
          <div className="space-y-3.5">
            {results.map((res, rIdx) => {
              const isExpanded = expandedResults[res.id] || false;
              
              return (
                <div 
                  key={res.id}
                  className="glass-panel border border-card-border rounded-2xl p-4.5 shadow-sm space-y-3 transition-all duration-200 hover:border-primary/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start space-x-3.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 select-none">
                        Q{rIdx + 1}
                      </span>
                      
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs md:text-sm text-foreground leading-relaxed break-words">
                          {res.question}
                        </span>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[9px] md:text-[10px] text-muted-foreground font-semibold select-none">
                          <span>CONFIDENCE: <span className="text-success">{Math.round(res.confidence * 100)}%</span></span>
                          <span>• CITATIONS: {res.citationsCount}</span>
                          <span>• LATENCY: {res.latency}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleExpand(res.id)}
                      className="p-1 rounded-lg border border-card-border hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-all flex-shrink-0 select-none cursor-pointer"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded comparative block */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-card-border/40 space-y-4 animate-fade-in text-xs md:text-sm font-medium leading-relaxed">
                      
                      {/* Ground truth */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-[9px] text-primary/80 font-extrabold uppercase select-none">Ground Truth (Kebenaran Patokan)</span>
                        <div className="bg-primary/5 border-l-2 border-primary p-3 rounded-r-lg text-foreground/80">
                          {res.groundTruth}
                        </div>
                      </div>

                      {/* AI answer */}
                      <div className="flex flex-col space-y-1">
                        <span className="text-[9px] text-success/80 font-extrabold uppercase select-none">AI Answer (Jawaban AI)</span>
                        <div className="bg-success/5 border-l-2 border-success p-3 rounded-r-lg text-foreground/80">
                          {res.answer}
                        </div>
                      </div>

                      {/* Citation sources */}
                      <div className="flex flex-col space-y-1 select-none">
                        <span className="text-[9px] text-muted-foreground font-extrabold uppercase">Sumber Referensi Kutipan</span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {res.citations.map((cite, cIdx) => (
                            <span 
                              key={cIdx}
                              className="text-[9px] md:text-[10px] font-bold bg-muted text-muted-foreground border border-card-border/60 px-2 py-0.5 rounded-md"
                            >
                              {cite}
                            </span>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </PageShell>
  );
}
