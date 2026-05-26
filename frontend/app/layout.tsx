import type { Metadata } from 'next';
import { Providers } from '@/components/providers';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Ragi Instant — Regulatory Intelligence',
    template: '%s | Ragi Instant',
  },
  description: 'Regulatory & Compliance Intelligence untuk regulasi keuangan Indonesia. Cari, bandingkan, dan tanya regulasi OJK, BI, POJK dengan AI.',
  keywords: ['regulasi', 'OJK', 'BI', 'POJK', 'PBI', 'SEOJK', 'compliance', 'fintech', 'RAG', 'AI'],
  authors: [{ name: 'Muhammad Faisal Affan' }],
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Ragi Instant',
    title: 'Ragi Instant — Regulatory Intelligence',
    description: 'Regulatory & Compliance Intelligence untuk regulasi keuangan Indonesia.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ragi Instant — Regulatory Intelligence',
    description: 'Regulatory & Compliance Intelligence untuk regulasi keuangan Indonesia.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head>
        {/* Anti-flash theme inline script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const settings = JSON.parse(localStorage.getItem('ragi-instant.ui-settings'));
                const theme = settings?.state?.theme || 'dark';
                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                if (theme === 'system') {
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  root.classList.add(systemTheme);
                } else {
                  root.classList.add(theme);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="h-full bg-background text-foreground transition-colors duration-300 font-sans antialiased overflow-hidden">
        <Providers>
          <div className="flex h-screen overflow-hidden w-full">
            {/* Navigasi Sidebar Kiri */}
            <Sidebar />

            {/* Konten Halaman Kanan */}
            <div className="flex flex-col flex-1 h-screen overflow-hidden min-w-0">
              <Header />
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
                {children}
              </div>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
