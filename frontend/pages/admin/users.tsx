import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../src/components/AdminLayout';
import { ProtectedRoute } from '../../src/components/ProtectedRoute';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email_or_phone: string;
  role: 'admin' | 'clinician' | 'patient';
  status: 'Active' | 'Disabled';
  last_login: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  // Custom dropdown state handling per row
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    // Click outside to close dropdowns
    const handleClick = () => setOpenDropdown(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/v1/admin/users', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => setUsers(res.data))
    .catch(err => console.error(err))
    .finally(() => setLoading(false));
  }, []);

  const filteredUsers = users.filter(usr => {
    if (roleFilter !== 'All' && usr.role.toLowerCase() !== roleFilter.toLowerCase()) return false;
    if (search && !usr.name.toLowerCase().includes(search.toLowerCase()) && !usr.email_or_phone.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayout title="Manage Users | Admin Portal">
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-white font-bold text-2xl tracking-tight">Manage Users</h2>
              <p className="text-slate-400 text-sm mt-1">View and manage roles across the platform.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
               <div className="relative">
                  <span className="material-icons absolute left-3 top-2.5 text-slate-500 text-sm">search</span>
                  <input 
                    type="text" 
                    placeholder="Search name or ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm focus:border-red-500 outline-none transition-colors w-full sm:w-64"
                  />
               </div>
               <select 
                 value={roleFilter}
                 onChange={e => setRoleFilter(e.target.value)}
                 className="px-4 py-2 bg-slate-900 border border-slate-700 text-white rounded-lg text-sm focus:border-red-500 outline-none appearance-none pr-8 relative w-full sm:w-auto"
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: "right 0.5rem center", backgroundRepeat: "no-repeat"}}
               >
                 <option value="All">All Roles</option>
                 <option value="clinician">Clinicians</option>
                 <option value="patient">Patients</option>
                 <option value="admin">Admins</option>
               </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50">
                  <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">User</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800 hidden sm:table-cell">Contact</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800">Role</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800 hidden md:table-cell">Status</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800 hidden lg:table-cell">Last Login</th>
                  <th className="py-4 px-6 text-xs uppercase tracking-wider font-semibold text-slate-400 border-b border-slate-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                       <div className="flex justify-center items-center gap-2">
                         <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /> 
                         Loading...
                       </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">No users found.</td>
                  </tr>
                ) : (
                  filteredUsers.map(usr => (
                    <tr key={usr.id} className="hover:bg-slate-800/50 transition-colors group">
                      <td className="py-4 px-6 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            usr.role === 'admin' ? 'bg-red-500/20 text-red-500' :
                            usr.role === 'clinician' ? 'bg-orange-500/20 text-orange-500' :
                            'bg-cyan-500/20 text-cyan-500'
                          }`}>
                            {usr.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                             <p className="text-white font-semibold text-sm">{usr.name}</p>
                             <p className="text-slate-500 text-xs sm:hidden">{usr.email_or_phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 border-b border-slate-800 text-slate-400 text-sm hidden sm:table-cell">
                        {usr.email_or_phone}
                      </td>
                      <td className="py-4 px-6 border-b border-slate-800">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                           usr.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                           usr.role === 'clinician' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                           'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 border-b border-slate-800 hidden md:table-cell">
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${usr.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`}></div>
                           <span className="text-slate-300 text-sm">{usr.status}</span>
                         </div>
                      </td>
                      <td className="py-4 px-6 border-b border-slate-800 text-slate-500 text-sm hidden lg:table-cell">
                         {usr.last_login}
                      </td>
                      <td className="py-4 px-6 border-b border-slate-800 text-right relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdown(openDropdown === usr.id ? null : usr.id);
                          }}
                          className="w-8 h-8 rounded-full hover:bg-slate-700 flex items-center justify-center text-slate-400 transition-colors ml-auto"
                        >
                          <span className="material-icons text-sm">more_vert</span>
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openDropdown === usr.id && (
                          <div 
                            className="absolute right-6 top-10 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2">
                              <span className="material-icons text-sm">person</span> View Profile
                            </button>
                            {usr.role !== 'admin' && (
                              <button className="w-full text-left px-4 py-2.5 text-sm text-orange-400 hover:bg-slate-700 hover:text-orange-300 flex items-center gap-2 border-t border-slate-700/50">
                                <span className="material-icons text-sm">upgrade</span> Elevate to Admin
                              </button>
                            )}
                            <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 border-t border-slate-700/50">
                              <span className="material-icons text-sm">key</span> Reset Password
                            </button>
                            <button className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 hover:text-red-300 flex items-center gap-2 border-t border-slate-700/50 font-medium">
                              <span className="material-icons text-sm">block</span> Disable Account
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
