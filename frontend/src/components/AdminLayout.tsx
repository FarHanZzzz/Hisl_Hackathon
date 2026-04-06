import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function AdminLayout({ children, title = 'Admin Portal | Pedi-Growth' }: AdminLayoutProps) {
  const router = useRouter();

  const navItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/admin/dashboard' },
    { label: 'Manage Users', icon: 'people', path: '/admin/users' },
    { label: 'Patient Registry', icon: 'local_hospital', path: '/admin/patients' },
    { label: 'All Consultations', icon: 'calendar_month', path: '/admin/consultations' },
  ];

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row font-sans">
        
        {/* Sidebar for Desktop */}
        <div className="hidden md:flex w-64 bg-slate-950 border-r border-slate-800 flex-col">
          <div className="p-6 border-b border-slate-800">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
                 <span className="material-icons text-sm">admin_panel_settings</span>
               </div>
               <div>
                  <h1 className="text-white font-bold tracking-tight">Pedi-Growth</h1>
                  <p className="text-red-400 text-xs font-semibold uppercase tracking-wider">Control Center</p>
               </div>
             </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => {
              const isActive = router.pathname.startsWith(item.path);
              return (
                <button
                  key={item.label}
                  onClick={() => router.push(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-red-500 text-white shadow-md shadow-red-500/20' 
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  <span className="material-icons text-[20px]">{item.icon}</span>
                  <span className="font-semibold text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
          
          <div className="p-4 border-t border-slate-800">
             <button onClick={() => {
                localStorage.removeItem('token');
                router.push('/');
             }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors">
               <span className="material-icons text-[20px]">logout</span>
               <span className="font-semibold text-sm">Sign Out</span>
             </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden bg-slate-950 border-b border-slate-800 p-4 shrink-0 px-6 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center">
               <span className="material-icons text-sm">admin_panel_settings</span>
            </div>
            <div>
               <h1 className="text-white font-bold text-lg leading-tight">Pedi-Growth</h1>
               <p className="text-red-400 text-[10px] font-semibold uppercase tracking-wider">Control Center</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-x-hidden flex flex-col h-full">
           <main className="p-6 md:p-10 flex-1">
             {children}
           </main>
           
           {/* Mobile Bottom Navigation */}
           <div className="md:hidden pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-2 px-6 bg-slate-950/80 backdrop-blur-md border-t border-slate-800 sticky bottom-0 z-50">
              <nav className="flex justify-between">
                {navItems.map(item => {
                  const isActive = router.pathname.startsWith(item.path);
                  return (
                    <button
                      key={item.label}
                      onClick={() => router.push(item.path)}
                      className={`flex flex-col items-center gap-1 p-2 ${
                        isActive ? 'text-red-500' : 'text-slate-500'
                      }`}
                    >
                      <span className="material-icons text-2xl">{item.icon}</span>
                      <span className="text-[10px] font-bold">{item.label.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </nav>
           </div>
        </div>
        
      </div>
    </>
  );
}
