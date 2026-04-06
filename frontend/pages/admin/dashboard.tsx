import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../src/components/AdminLayout';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import axios from 'axios';
import { useRouter } from 'next/router';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    axios.get('/api/v1/admin/stats', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => setStats(res.data))
    .catch(err => console.error(err));
  }, []);

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayout title="Dashboard | Admin Control Center">
        <div className="space-y-8 animate-in fade-in duration-500">
          
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-white font-bold text-2xl tracking-tight">System Dashboard</h2>
              <p className="text-slate-400 text-sm mt-1">Overview of platform metrics across all clinics.</p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="material-icons text-red-500 text-sm">group</span> Total Patients
              </span>
              <span className="text-3xl font-bold text-white">{stats ? stats.total_patients : '...'}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="material-icons text-orange-500 text-sm">badge</span> Active Clinicians
              </span>
              <span className="text-3xl font-bold text-white">{stats ? stats.active_clinicians : '...'}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="material-icons text-cyan-500 text-sm">videocam</span> Total Scans
              </span>
              <span className="text-3xl font-bold text-white">{stats ? stats.total_scans : '...'}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className="material-icons text-emerald-500 text-sm">dns</span> System Uptime
              </span>
              <span className="text-3xl font-bold text-white">{stats ? `${stats.system_uptime}%` : '...'}</span>
            </div>
          </div>

          {/* Chart & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-white font-bold mb-6">API Requests (Last 7 Days)</h3>
              <div className="h-64 w-full">
                {stats?.chart_data ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.chart_data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="day" stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                      <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8', fontSize: 12}} axisLine={false} tickLine={false} />
                      <Tooltip 
                         contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                         itemStyle={{ color: '#ef4444' }}
                      />
                      <Line type="monotone" dataKey="requests" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#0f172a', stroke: '#ef4444', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#ef4444' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col gap-3">
               <h3 className="text-white font-bold mb-3">Quick Actions</h3>
               
               <button className="bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl p-4 flex items-center gap-3 shadow-lg shadow-red-500/20 transform transition-transform active:scale-95 text-left">
                  <div className="bg-white/20 w-8 h-8 rounded-full flex items-center justify-center shrink-0">
                    <span className="material-icons text-sm">person_add</span>
                  </div>
                  <span>Add New Clinician</span>
               </button>

               <button 
                onClick={() => router.push('/admin/patients/new')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl p-4 flex items-center gap-3 transition-colors text-left border border-slate-700"
               >
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center shrink-0 text-slate-400">
                    <span className="material-icons text-sm">group_add</span>
                  </div>
                  <span>Add New Patient</span>
               </button>

               <button 
                onClick={() => router.push('/admin/consultations')}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl p-4 flex items-center gap-3 transition-colors text-left border border-slate-700"
               >
                  <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center shrink-0 text-slate-400">
                    <span className="material-icons text-sm">calendar_month</span>
                  </div>
                  <span>View Consultations</span>
               </button>
            </div>
            
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
