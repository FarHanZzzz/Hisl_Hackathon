/**
 * ReportTabs — Top-level tab navigation for the clinical report.
 * 
 * 4 tabs: Executive Summary, Kinematic Playback, Orthopedic, Neuromuscular
 * Features: URL hash sync, keyboard navigation, smooth transitions.
 */
import { useState, useEffect, useCallback, type ReactNode } from 'react';

export type TabId = 'summary' | 'kinematic' | 'orthopedic' | 'neuromuscular';

interface Tab {
  id: TabId;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'summary', label: 'Executive Summary', icon: '★' },
  { id: 'kinematic', label: 'Kinematic Playback', icon: '▶' },
  { id: 'orthopedic', label: 'Orthopedic', icon: '🦴' },
  { id: 'neuromuscular', label: 'Neuromuscular', icon: '🧠' },
];

interface ReportTabsProps {
  children: Record<TabId, ReactNode>;
  defaultTab?: TabId;
  onTabChange?: (tab: TabId) => void;
}

export function ReportTabs({ children, defaultTab = 'summary', onTabChange }: ReportTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);

  // Sync from URL hash on mount and hashchange
  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash.replace('#', '') as TabId;
      if (TABS.some(t => t.id === hash)) {
        setActiveTab(hash);
      }
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);

  const switchTab = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    window.history.replaceState(null, '', `#${tabId}`);
    onTabChange?.(tabId);
  }, [onTabChange]);

  // Keyboard arrow navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const idx = TABS.findIndex(t => t.id === activeTab);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = TABS[(idx + 1) % TABS.length];
      switchTab(next.id);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = TABS[(idx - 1 + TABS.length) % TABS.length];
      switchTab(prev.id);
    }
  }, [activeTab, switchTab]);

  return (
    <div>
      {/* Tab Bar */}
      <div
        className="flex overflow-x-auto border-b border-slate-700/50 mb-6 -mx-1"
        role="tablist"
        onKeyDown={handleKeyDown}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => switchTab(tab.id)}
            className={`
              relative flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap
              transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50
              ${activeTab === tab.id
                ? 'text-cyan-400 bg-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }
            `}
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
            {/* Active indicator */}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="relative">
        {TABS.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            aria-hidden={activeTab !== tab.id}
            className={`
              transition-all duration-300 ease-in-out
              ${activeTab === tab.id
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 absolute inset-0 pointer-events-none -translate-y-2'
              }
            `}
          >
            {activeTab === tab.id && children[tab.id]}
          </div>
        ))}
      </div>
    </div>
  );
}
