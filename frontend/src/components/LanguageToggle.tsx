import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export function LanguageToggle() {
  const router = useRouter();
  const { pathname, asPath, query, locale } = router;
  
  // To avoid hydration mismatch, make sure to mount before rendering language toggle
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleLanguage = async () => {
    const nextLocale = locale === 'en' ? 'bn' : 'en';

    // Store preference in localStorage and NEXT_LOCALE cookie
    if (typeof window !== 'undefined') {
      localStorage.setItem('pedigrowth-lang', nextLocale);
      document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000`; // 1 year
    }

    // Attempt to update profile if authenticated (fire and forget)
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (token) {
        fetch('/api/v1/me', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ language: nextLocale })
        });
      }
    } catch (err) {
      console.error(err);
    }

    // Use router to switch locale natively in Next.js
    router.push({ pathname, query }, asPath, { locale: nextLocale });
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleLanguage}
      className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all shadow-lg border ${
        locale === 'en'
          ? 'bg-slate-900/60 border-slate-700 hover:border-cyan-500 text-cyan-400'
          : 'bg-emerald-900/60 border-emerald-700 hover:border-emerald-500 text-emerald-400 font-display'
      }`}
      style={locale === 'en' ? { fontFamily: "'Noto Sans Bengali', sans-serif" } : {}}
      title={locale === 'en' ? 'Switch to Bengali' : 'Switch to English'}
    >
      <span className="material-icons text-[14px]">translate</span>
      {locale === 'en' ? 'বাংলায় দেখুন' : 'View in English'}
    </button>
  );
}
