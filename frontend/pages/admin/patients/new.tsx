import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AdminLayout } from '../../../src/components/AdminLayout';
import { ProtectedRoute } from '../../../src/components/ProtectedRoute';
import axios from 'axios';

interface Clinician {
  id: string;
  display_name: string;
}

export default function NewPatient() {
  const router = useRouter();
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    clinician_id: '',
    notes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch clinicians to populate the dropdown
    axios.get('/api/v1/scheduling/clinicians')
      .then(res => {
        setClinicians(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!formData.name || !formData.phone || !formData.clinician_id) {
       setErrorMsg("Please fill in all required fields.");
       return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('/api/v1/admin/patients', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuccess(true);
      // Optional: Redirect after success or allow uploading
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Failed to create patient.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminLayout title="Global Patient Registry | Admin Portal">
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
          
          <div>
             <button 
                onClick={() => router.back()}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 text-sm font-medium"
             >
                <span className="material-icons text-sm">arrow_back</span> Back
             </button>
             <h2 className="text-white font-bold text-2xl tracking-tight flex items-center gap-3">
               <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center">
                 <span className="material-icons">person_add</span>
               </div>
               Register New Patient
             </h2>
             <p className="text-slate-400 text-sm mt-2 ml-14">
               Create a centralized patient record and assign them to a clinician.
             </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-2xl">
            {success ? (
               <div className="text-center py-10 animate-in zoom-in-95 duration-300">
                  <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-icons text-4xl">check_circle</span>
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">Patient Registered!</h3>
                  <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                    The patient profile for <strong className="text-white">{formData.name}</strong> has been created and assigned.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                     <button 
                      onClick={() => setSuccess(false)}
                      className="px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition"
                     >
                       Register Another
                     </button>
                     <button 
                      onClick={() => router.push('/upload')} // Assuming /upload is available for admins to trigger upload
                      className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition shadow-lg shadow-red-500/20 flex items-center gap-2"
                     >
                       <span className="material-icons text-sm">upload_file</span> Trigger Analysis
                     </button>
                  </div>
               </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {errorMsg && (
                   <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm flex gap-2 items-center">
                     <span className="material-icons text-sm">error</span> {errorMsg}
                   </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-slate-300 text-sm font-semibold ml-1">Patient Full Name *</label>
                    <input 
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Liam Smith"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-slate-600"
                    />
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="text-slate-300 text-sm font-semibold ml-1">Parent Phone Number *</label>
                    <input 
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Clinician Assignment */}
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-semibold ml-1">Assign to Clinician *</label>
                  <select
                    name="clinician_id"
                    value={formData.clinician_id}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all appearance-none"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundPosition: "right 1rem center", backgroundRepeat: "no-repeat"}}
                  >
                    <option value="" disabled>-- Select a Clinician --</option>
                    {clinicians.map(c => (
                      <option key={c.id} value={c.id}>Dr. {c.display_name}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <label className="text-slate-300 text-sm font-semibold ml-1">Initial Clinical Notes</label>
                  <textarea 
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any pre-existing conditions, referral notes, etc."
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-slate-600 resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800">
                   <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-14 bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transform transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                     {isSubmitting ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...
                        </>
                     ) : (
                        <>
                           <span className="material-icons">person_add</span> Create Patient Record
                        </>
                     )}
                   </button>
                   <p className="text-center text-slate-500 text-xs mt-4">
                     Creating this record will automatically generate a secure patient portal link.
                   </p>
                </div>

              </form>
            )}
          </div>

        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
