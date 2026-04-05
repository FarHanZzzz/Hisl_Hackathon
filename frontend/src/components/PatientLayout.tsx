import { ReactNode } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { LanguageToggle } from './LanguageToggle';

interface PatientLayoutProps {
  children: ReactNode;
  title?: string;
  hideNav?: boolean;
}

export function PatientLayout({ children, title = 'Pedi-Growth', hideNav = false }: PatientLayoutProps) {
  const router = useRouter();
  const { t } = useTranslation('common');

  const navItems = [
    { name: t('nav_home', 'Home'), path: '/patient/home', icon: 'home' },
    { name: t('nav_record', 'Record'), path: '/patient/capture', icon: 'videocam' },
    { name: t('nav_results', 'Results'), path: '/patient/results', icon: 'insert_chart' },
    { name: t('nav_profile', 'Profile'), path: '/patient/profile', icon: 'person' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans">
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
      </Head>

      <LanguageToggle />

      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950"></div>
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Desktop Top Nav (hidden on mobile) */}
      {!hideNav && (
        <nav className="relative z-10 hidden md:flex items-center justify-between px-8 py-4 bg-slate-900/50 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push('/patient/home')}>
            <div className="bg-cyan-500 text-slate-950 p-1.5 rounded-lg">
              <span className="material-icons text-xl block">monitor_heart</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>Pedi-Growth</span>
          </div>
          <div className="flex items-center gap-6 pr-24">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  router.pathname.startsWith(item.path) || (item.path === '/patient/results' && router.pathname.startsWith('/patient/results'))
                    ? 'text-cyan-400' 
                    : 'text-slate-400 hover:text-white'
                }`}>
                  <span className="material-icons text-[18px]">{item.icon}</span>
                  {item.name}
                </span>
              </Link>
            ))}
            <button className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 ml-4 hover:border-cyan-500/50 transition-colors">
              <span className="material-icons text-sm">notifications</span>
            </button>
          </div>
        </nav>
      )}

      {/* Main Content Area */}
      <main className="relative z-10 flex-grow pb-24 md:pb-12 pt-4 px-4 sm:px-6 md:px-8 max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Nav (hidden on desktop) */}
      {!hideNav && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-center h-16 px-2">
            {navItems.map((item) => {
              const isActive = router.pathname.startsWith(item.path) || 
                               (item.path === '/patient/results' && router.pathname.startsWith('/patient/results'));
              
              // Special styling for the Record button
              if (item.name === t('nav_record', 'Record')) {
                return (
                  <button 
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className="flex flex-col items-center justify-center w-14 group relative -top-5"
                  >
                    <div className="w-14 h-14 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30 transform transition-transform group-active:scale-95">
                      <span className="material-icons text-slate-950 text-2xl">videocam</span>
                    </div>
                  </button>
                );
              }

              return (
                <button 
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className="flex flex-col items-center justify-center w-16 h-full space-y-1"
                >
                  <span className={`material-icons text-2xl transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {isActive && item.name === t('nav_home', 'Home') ? 'home' : 
                     isActive && item.name === t('nav_results', 'Results') ? 'insights' : 
                     isActive && item.name === t('nav_profile', 'Profile') ? 'person' : 
                     item.icon}
                  </span>
                  <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
