import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <style>{`
          @keyframes gauge-sweep {
            from { stroke-dasharray: 0, 100; }
          }
          @keyframes bounce-in {
            0% { transform: translateX(-50%) translateY(20px); opacity: 0; }
            60% { transform: translateX(-50%) translateY(-5px); opacity: 1; }
            100% { transform: translateX(-50%) translateY(0); opacity: 1; }
          }
          .animate-bounce-in { animation: bounce-in 0.4s ease-out; }
          @media print {
            nav, footer, .no-print, button { display: none !important; }
            body { background: white !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .dark\\:bg-gray-900, .dark\\:bg-gray-800, .dark\\:bg-background-dark { background: white !important; }
            .dark\\:text-white, .dark\\:text-gray-300, .dark\\:text-gray-200 { color: #1a1a1a !important; }
            * { box-shadow: none !important; }
          }
        `}</style>
      </Head>
      <body className="bg-background-light dark:bg-background-dark min-h-screen font-display">
        {/*
          Blocking script: sets the correct theme class on <html> BEFORE
          React hydrates, eliminating any visible flash.
          - Landing page (/) → always dark
          - Dashboard (/dashboard) → check localStorage, default to light
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var d = document.documentElement;
                var path = window.location.pathname;
                if (path === '/') {
                  d.classList.add('dark');
                } else {
                  var theme = null;
                  try { theme = localStorage.getItem('pedigrowth-theme'); } catch(e) {}
                  if (theme === 'dark') {
                    d.classList.add('dark');
                  } else {
                    d.classList.remove('dark');
                  }
                }
              })();
            `,
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
