import Head from 'next/head';
import { Activity } from 'lucide-react';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title = 'Pedi-Growth | Clinical Gait Analysis' }: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="AI-Powered Pediatric Gait Movement Tracking" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="bg-primary-500 rounded-xl p-2">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">Pedi-Growth</h1>
                <p className="text-xs text-gray-500 font-medium">Clinical Gait Analysis Tool</p>
              </div>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <p className="text-xs text-gray-400 text-center">
              <strong>Medical Disclaimer:</strong> This tool does not provide medical diagnoses.
              Pedi-Growth is a clinical support tool intended for use by qualified healthcare professionals.
              Analysis results are indicative and should be verified through clinical observation
              and professional medical judgment before treatment decisions.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
