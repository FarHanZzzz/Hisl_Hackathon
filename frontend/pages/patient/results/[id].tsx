import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { PatientLayout } from '../../../src/components/PatientLayout';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';

export default function PatientResultDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { t } = useTranslation('patient');
  
  // Mock fetch based on ID for demo purposes
  const [loading, setLoading] = useState(true);
  
  // Decide state based on dummy IDs for UI mock
  const isHealthy = id === 'res-1'; 
  
  useEffect(() => {
    if (id) {
      setTimeout(() => setLoading(false), 800); // simulate load
    }
  }, [id]);

  if (loading) {
    return (
      <PatientLayout title={`${t('loading_results')} | Pedi-Growth`}>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500/30 border-t-cyan-500" />
            <p className="text-slate-400">{t('loading_results')}</p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout title={`${t('result_summary')} | Pedi-Growth`} hideNav={true}>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white border border-slate-800"
          >
            <span className="material-icons">arrow_back</span>
          </button>
          <span className="text-slate-400 font-medium">{t('result_summary')}</span>
        </div>

        {/* Top Big Badge */}
        <div className={`p-6 rounded-2xl border mb-8 flex flex-col items-center text-center ${
          isHealthy 
            ? 'bg-emerald-500/10 border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]' 
            : 'bg-amber-500/10 border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.1)]'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
            isHealthy ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40' : 'bg-amber-500 text-white shadow-lg shadow-amber-500/40'
          }`}>
            <span className="material-icons text-3xl">{isHealthy ? 'check' : 'priority_high'}</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "'Noto Sans Bengali', 'Outfit', sans-serif" }}>
            {isHealthy ? t('looks_healthy') : t('some_areas_attention')}
          </h1>
          <p className="text-slate-300 text-sm max-w-sm">
            {isHealthy ? t('healthy_desc') : t('attention_desc')}
          </p>
        </div>

        {/* Doctor CTA (if not healthy) */}
        {!isHealthy && (
          <div className="mb-8">
            <button 
              onClick={() => router.push(`/patient/book-consultation/${id}`)}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 p-1 rounded-2xl shadow-xl shadow-cyan-500/20 transform transition-transform active:scale-95 group"
            >
              <div className="bg-slate-950 rounded-xl p-4 flex items-center gap-4 group-hover:bg-opacity-80 transition-all">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-2xl">👨‍⚕️</span>
                </div>
                <div className="text-left flex-1">
                  <h3 className="text-white font-bold text-lg">{t('consult_cta')}</h3>
                  <p className="text-cyan-400 text-xs font-medium">{t('schedule_free')}</p>
                </div>
                <span className="material-icons text-cyan-500">arrow_forward</span>
              </div>
            </button>
          </div>
        )}

        {/* Key Insights */}
        <h2 className="text-lg font-bold text-white mb-4 px-1" style={{ fontFamily: "'Noto Sans Bengali', 'Outfit', sans-serif" }}>{t('key_insights')}</h2>
        <div className="space-y-4">
          
          {/* Insight 1 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex gap-4 items-start">
            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isHealthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-ambient-500/20 text-emerald-400'}`}>
              <span className="material-icons text-sm">{isHealthy ? 'thumb_up' : 'thumb_up'}</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">{t('balance_symmetry')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isHealthy ? t('balance_healthy') : t('balance_attention')}
              </p>
            </div>
          </div>

          {/* Insight 2 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex gap-4 items-start">
            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isHealthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
              <span className="material-icons text-sm">{isHealthy ? 'straighten' : 'warning'}</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">{t('knee_alignment')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {isHealthy ? t('knee_healthy') : t('knee_attention')}
              </p>
            </div>
          </div>

          {/* Insight 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex gap-4 items-start">
            <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isHealthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              <span className="material-icons text-sm">directions_walk</span>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">{t('foot_position')}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {t('foot_desc')}
              </p>
            </div>
          </div>

        </div>

      </div>
    </PatientLayout>
  );
}

export async function getServerSideProps({ locale }: { locale: string }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'patient'])),
    },
  };
}
