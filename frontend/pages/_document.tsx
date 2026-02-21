import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="light">
      <Head>
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
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
      <body className="bg-background-light dark:bg-background-dark min-h-screen font-display transition-colors duration-200">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
