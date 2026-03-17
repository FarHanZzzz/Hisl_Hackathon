import { useLayoutEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import '@/styles/globals.css';
import { Home, LayoutDashboard, User } from 'lucide-react';
import { NavBar } from '@/src/components/ui/tubelight-navbar';

const navItems = [
  { name: 'Home', url: '/', icon: Home },
  { name: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { name: 'About', url: '/about', icon: User },
];

/**
 * Synchronise the `dark` class on <html> whenever the route changes.
 * - Landing page (/) → always dark
 * - Dashboard (/dashboard) → honour the user's stored preference (default: light)
 *
 * Uses useLayoutEffect so the class is set BEFORE the browser paints,
 * eliminating any visible flash between themes.
 */
function useRouteTheme() {
  const router = useRouter();

  useLayoutEffect(() => {
    const html = document.documentElement;

    document.body.style.transition = 'none';

    // Default to 'light' everywhere unless user prefers 'dark'
    const stored = localStorage.getItem('pedigrowth-theme');
    if (stored === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }

    void document.body.offsetHeight;
    document.body.style.transition = '';
  }, [router.pathname]);
}

export default function App({ Component, pageProps }: AppProps) {
  useRouteTheme();

  return (
    <>
      <NavBar items={navItems} />
      <Component {...pageProps} />
    </>
  );
}
