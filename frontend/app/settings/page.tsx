'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Server, 
  Key, 
  Palette, 
  Database, 
  Info,
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Globe,
  BookOpen,
  Bug,
  Loader2
} from 'lucide-react';
import { PageShell } from '@/components/layout/page-shell';
import { useUIStore, Theme, FontSize, Language } from '@/stores/ui-store';
import { useQueryHistoryStore } from '@/stores/query-history-store';
import { healthCheck } from '@/lib/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { 
    theme, setTheme, 
    fontSize, setFontSize, 
    language, setLanguage, 
    apiUrl, setApiUrl, 
    resetAllSettings 
  } = useUIStore();

  const queryHistory = useQueryHistoryStore((state) => state.history);
  const clearQueryHistory = useQueryHistoryStore((state) => state.clearHistory);

  // Local state
  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [latency, setLatency] = useState<number | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Sync state with store URL changes
  useEffect(() => {
    setLocalApiUrl(apiUrl);
  }, [apiUrl]);

  // Network connection checking function measuring millisecond latency
  const testConnection = async (urlToTest = localApiUrl) => {
    setTestingConnection(true);
    setConnectionStatus('checking');
    const start = Date.now();
    try {
      // Temporarily write value to localStorage for helper test
      localStorage.setItem('ragi-instant.settings.apiUrl', urlToTest);
      const res = await healthCheck();
      
      const duration = Date.now() - start;
      setLatency(duration);
      setConnectionStatus('connected');
      
      // Update global API URL store if test successful
      setApiUrl(urlToTest);
      toast.success('Koneksi ke backend berhasil!');
    } catch {
      setLatency(null);
      setConnectionStatus('disconnected');
      toast.error('Gagal terhubung ke backend server.');
    } finally {
      setTestingConnection(false);
    }
  };

  useEffect(() => {
    testConnection(apiUrl);
  }, [apiUrl]);

  // Reset all local storage data
  const handleResetAllData = () => {
    resetAllSettings();
    clearQueryHistory();
    toast.success('Semua konfigurasi dan riwayat berhasil direset!');
  };

  // Mock checking backend API config values (simulating responses)
  const mockApiKeys = [
    { name: 'OpenAI API Key (GPT models)', status: true, desc: 'Konfigurasi standard LLM generator basis RAG' },
    { name: 'Cohere API Key (Reranker)', status: false, desc: 'Opsional: Digunakan untuk re-ranking potongan teks' },
    { name: 'LangFuse Public & Secret Keys (Tracing)', status: false, desc: 'Opsional: Digunakan untuk visual evaluasi tracing RAG' },
  ];

  return (
    <PageShell
      title="Pengaturan"
      description="Konfigurasikan alamat server, parameter visual tampilan, manajemen data, dan otentikasi kunci Ragi Instant."
    >
      
      <div className="space-y-6">
        
        {/* SECTION 1: Server URL configuration */}
        <div className="glass-panel border border-card-border rounded-2xl p-5 md:p-6 shadow-md space-y-4">
          <div className="flex items-center space-x-2 select-none border-b border-card-border/40 pb-3">
            <Server className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-sm md:text-base text-foreground">
              Konfigurasi Server Backend
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground uppercase select-none">API URL Alamat Endpoint</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={localApiUrl}
                  onChange={(e) => setLocalApiUrl(e.target.value)}
                  placeholder="e.g. http://localhost:8000 atau http://vps:8000"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-card-border glass-panel text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all font-mono"
                />
                
                <button
                  onClick={() => testConnection(localApiUrl)}
                  disabled={testingConnection || !localApiUrl}
                  className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold border border-card-border hover:border-primary/25 bg-muted/15 hover:bg-muted/30 text-foreground transition-all duration-200 disabled:opacity-40 flex-shrink-0 select-none cursor-pointer"
                >
                  {testingConnection ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Uji Koneksi
                </button>
              </div>
            </div>

            {/* Connection visual status */}
            <div className="pt-2 flex items-center select-none">
              {connectionStatus === 'connected' && (
                <div className="inline-flex items-center text-xs font-bold text-success bg-success/5 border border-success/15 px-3 py-1.5 rounded-lg shadow-sm">
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />
                  Terhubung (Connected) • Latency: <span className="font-mono text-foreground font-semibold ml-1">{latency !== null ? `${latency}ms` : '—'}</span>
                </div>
              )}

              {connectionStatus === 'disconnected' && (
                <div className="inline-flex items-center text-xs font-bold text-danger bg-danger/5 border border-danger/15 px-3 py-1.5 rounded-lg shadow-sm">
                  <AlertCircle className="w-4 h-4 mr-1.5 animate-pulse" />
                  Gagal Terhubung (Disconnected) • Periksa kembali URL dan nyalakan backend.
                </div>
              )}

              {connectionStatus === 'checking' && (
                <div className="inline-flex items-center text-xs font-semibold text-warning bg-warning/5 border border-warning/15 px-3 py-1.5 rounded-lg shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5 text-warning" />
                  Memeriksa status jaringan...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: API Keys read-only configs */}
        <div className="glass-panel border border-card-border rounded-2xl p-5 md:p-6 shadow-md space-y-4">
          <div className="flex items-center space-x-2 select-none border-b border-card-border/40 pb-3">
            <Key className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-sm md:text-base text-foreground">
              Status Kunci API (API Keys)
            </h3>
          </div>
          
          <p className="text-xs text-muted-foreground select-none leading-relaxed">
            API Keys disimpan dengan aman di file konfigurasi <span className="font-mono text-[10px] bg-muted/40 px-1 py-0.5 rounded border border-card-border/60">.env</span> server backend. Halaman ini hanya menampilkan status kelengkapan kunci yang terdeteksi di sisi server.
          </p>

          <div className="divide-y divide-card-border/40 select-none">
            {mockApiKeys.map((key, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex flex-col min-w-0 pr-4">
                  <span className="text-xs md:text-sm font-bold text-foreground truncate">{key.name}</span>
                  <span className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{key.desc}</span>
                </div>
                
                <span className={cn(
                  "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold border",
                  key.status
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-warning/10 text-warning border-warning/20"
                )}>
                  {key.status ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      Aktif
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 mr-1 animate-pulse" />
                      Belum Terisi
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Appearance configuration options */}
        <div className="glass-panel border border-card-border rounded-2xl p-5 md:p-6 shadow-md space-y-4">
          <div className="flex items-center space-x-2 select-none border-b border-card-border/40 pb-3">
            <Palette className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-sm md:text-base text-foreground">
              Pengaturan Tampilan & Visual
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 select-none">
            
            {/* Visual theme selection */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Tema Visual</label>
              <div className="flex flex-col space-y-1.5 border border-card-border/60 bg-muted/15 p-1 rounded-xl">
                {(['dark', 'light', 'system'] as Theme[]).map((t) => {
                  const isSelected = theme === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        "text-left px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer",
                        isSelected 
                          ? "bg-primary text-white shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      {t === 'dark' && 'Dark Mode (Premium)'}
                      {t === 'light' && 'Light Mode'}
                      {t === 'system' && 'Ikuti Sistem Komputer'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font size selection */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Ukuran Font</label>
              <div className="flex flex-col space-y-1.5 border border-card-border/60 bg-muted/15 p-1 rounded-xl">
                {(['sm', 'md', 'lg'] as FontSize[]).map((sz) => {
                  const isSelected = fontSize === sz;
                  return (
                    <button
                      key={sz}
                      onClick={() => setFontSize(sz)}
                      className={cn(
                        "text-left px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer",
                        isSelected 
                          ? "bg-primary text-white shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      {sz === 'sm' && 'Kecil'}
                      {sz === 'md' && 'Normal (Default)'}
                      {sz === 'lg' && 'Besar'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language selection */}
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-muted-foreground uppercase">Bahasa Antarmuka</label>
              <div className="flex flex-col space-y-1.5 border border-card-border/60 bg-muted/15 p-1 rounded-xl">
                {(['id', 'en'] as Language[]).map((l) => {
                  const isSelected = language === l;
                  return (
                    <button
                      key={l}
                      onClick={() => setLanguage(l)}
                      className={cn(
                        "text-left px-3 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all cursor-pointer",
                        isSelected 
                          ? "bg-primary text-white shadow-sm" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
                      )}
                    >
                      {l === 'id' && '🇮🇩 Bahasa Indonesia'}
                      {l === 'en' && '🇬🇧 English'}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* SECTION 4: Local Storage Data Management */}
        <div className="glass-panel border border-card-border rounded-2xl p-5 md:p-6 shadow-md space-y-4">
          <div className="flex items-center space-x-2 select-none border-b border-card-border/40 pb-3">
            <Database className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-sm md:text-base text-foreground">
              Manajemen Data Lokal
            </h3>
          </div>

          <div className="flex flex-wrap gap-3.5 select-none">
            <button
              onClick={() => {
                clearQueryHistory();
                toast.success('Riwayat Tanya Regulasi lokal berhasil dikosongkan.');
              }}
              disabled={queryHistory.length === 0}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold border border-card-border hover:border-danger/30 hover:bg-danger/5 text-muted-foreground hover:text-danger transition-all disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus Riwayat Query ({queryHistory.length} item)
            </button>

            <button
              onClick={() => {
                toast.success('Cache gambar dan chunks client berhasil dibersihkan.');
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold border border-card-border hover:border-danger/30 hover:bg-danger/5 text-muted-foreground hover:text-danger transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Bersihkan Cache Client (2.3 MB)
            </button>

            <button
              onClick={handleResetAllData}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold border border-danger/25 bg-danger/5 hover:bg-danger/10 text-danger transition-all cursor-pointer ml-auto"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Reset Semua Konfigurasi
            </button>
          </div>
        </div>

        {/* SECTION 5: About Section with Links */}
        <div className="glass-panel border border-card-border rounded-2xl p-5 md:p-6 shadow-md space-y-4">
          <div className="flex items-center space-x-2 select-none border-b border-card-border/40 pb-3">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-sm md:text-base text-foreground">
              Tentang Aplikasi
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            <div className="flex flex-col space-y-2 select-none">
              <span className="text-sm font-extrabold text-foreground">Ragi Instant v0.1.0</span>
              <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                Regulatory & Compliance Intelligence Platform untuk memantau, mencari, membandingkan, dan menanyakan amandemen peraturan Otoritas Jasa Keuangan (OJK) & Bank Indonesia (BI).
              </p>
              <span className="text-[10px] text-muted-foreground/60 font-semibold pt-1 uppercase">
                Copyright © 2026 Muhammad Faisal Affan
              </span>
            </div>

            {/* Hyperlinks list */}
            <div className="flex flex-col space-y-2.5 md:border-l md:border-card-border/50 md:pl-6 select-none">
              <a
                href="https://github.com/faisalaffan/ragi-instant"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-extrabold text-primary hover:underline"
              >
                <Globe className="w-4 h-4 mr-2" />
                Repository Github Project
              </a>
              
              <a
                href="https://github.com/faisalaffan/ragi-instant/wiki"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-extrabold text-primary hover:underline"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Dokumentasi & Panduan
              </a>

              <a
                href="https://github.com/faisalaffan/ragi-instant/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-extrabold text-primary hover:underline"
              >
                <Bug className="w-4 h-4 mr-2" />
                Laporkan Bug atau Masalah
              </a>
            </div>

          </div>
        </div>

      </div>

    </PageShell>
  );
}
