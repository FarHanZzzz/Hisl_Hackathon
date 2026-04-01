# Phase 1B: Tabbed Clinical Report

## Goal
Replace the infinite-scroll results page with a segmented, tab-based clinical report. Clinicians can navigate directly to the section they need instead of scrolling through 1,000+ lines of content.

## Dependencies
- Phase 1A (components must be extracted into separate files first)

## The Problem (Before)
```
/results/[jobId]
│
├── DiagnosisBanner
├── Symmetry Score Ring
├── Patient Info Bar
├── ParentInsightsPanel
├── 5 Metric Cards
├── Educational Note
├── Video Player                    ← Scroll...
├── Knee Flexion Chart             ← Keep scrolling...
├── Body Diagram + Bilateral       ← More scrolling...
├── OrthopedicSummaryCard          ← Even more...
├── OrthopedicGraphArea            ← Still going...
├── NeuromuscularSummaryCard       ← Almost there...
├── NeuromuscularGraphArea         ← Finally...
└── AI Clinical Summary            ← At the bottom of a very long page
```

## The Solution (After)

```
/clinician/reports/[jobId]
│
├── Header (Back button, Print, Export, Share)
├── DiagnosisBanner + Symmetry Ring (always visible)
├── Patient Info Bar (always visible)
│
├── ┌──────────────────┬────────────────────┬──────────────────────┬──────────────────────────┐
│   │ ★ Summary        │ ▶ Kinematic        │ 🦴 Orthopedic        │ 🧠 Neuromuscular         │
│   └──────────────────┴────────────────────┴──────────────────────┴──────────────────────────┘
│
│   [Tab content renders here — only ONE tab at a time]
│
└── (end of page)
```

---

## What Gets Created

### File 1: `src/components/clinical/ReportTabs.tsx`
The tab container component.

```
Props:
├── activeTab: 'summary' | 'kinematic' | 'orthopedic' | 'neuromuscular'
├── onTabChange: (tab) => void
└── children: ReactNode (the active tab's content)

Features:
├── Tab bar with 4 buttons (icon + label)
├── Active tab has underline/highlight indicator
├── Smooth transition between tabs
├── URL hash sync (#summary, #kinematic, etc.) for shareable deep links
└── Keyboard navigation (arrow keys)
```

### File 2: `src/components/clinical/ExecutiveSummary.tsx`
Tab 1 content — the "at a glance" view.

| Section | Source |
|---------|--------|
| ParentInsightsPanel (collapsible) | Extracted in Phase 1A |
| 5 Metric Cards (SI, ROM, Max Flexion, Asymmetry, Data Quality) | From current [id].tsx L730-804 |
| Educational Note (high-risk only) | From current [id].tsx L807-820 |
| AI Clinical Summary Card | Extracted in Phase 1A |

### File 3: `src/components/clinical/KinematicPlayback.tsx`
Tab 2 content — video and bilateral knee analysis.

| Section | Source |
|---------|--------|
| Processed Video Player | From current [id].tsx L822-855 |
| Knee Flexion/Extension Chart (Left vs Right) | From current [id].tsx L857-915 |
| Visual Localization Body Diagram | From current VisualLocalization component |
| Bilateral Comparison (Left/Right leg detail cards) | From current [id].tsx L918-974 |

### File 4: `src/components/clinical/OrthopedicDiagnostics.tsx`
Tab 3 content — orthopedic disease screening.

| Section | Source |
|---------|--------|
| OrthopedicSummaryCard (3 badges) | Extracted in Phase 1A |
| OrthopedicGraphArea (3-line chart) | Extracted in Phase 1A |
| Clinical Interpretation Note | New: explanation of thresholds |

### File 5: `src/components/clinical/NeuromuscularDiagnostics.tsx`
Tab 4 content — neuromuscular disease screening.

| Section | Source |
|---------|--------|
| NeuromuscularSummaryCard (3 badges) | Extracted in Phase 1A |
| NeuromuscularGraphArea (3-line chart) | Extracted in Phase 1A |
| Clinical Interpretation Note | New: explanation of thresholds |

---

### File 6: `pages/clinician/reports/[jobId].tsx`
The new report page — replaces `pages/results/[id].tsx`.

```tsx
export default function ClinicalReport() {
  const [activeTab, setActiveTab] = useState<'summary' | 'kinematic' | 'orthopedic' | 'neuromuscular'>('summary');

  return (
    <ProtectedRoute allowedRoles={['clinician']}>
      <Layout>
        {/* Always visible */}
        <HeaderActions />
        <DiagnosisBanner ... />
        <PatientInfoBar ... />

        {/* Tabbed content */}
        <ReportTabs activeTab={activeTab} onTabChange={setActiveTab}>
          {activeTab === 'summary' && <ExecutiveSummary result={result} />}
          {activeTab === 'kinematic' && <KinematicPlayback result={result} chartData={chartData} />}
          {activeTab === 'orthopedic' && <OrthopedicDiagnostics result={result} chartData={chartData} />}
          {activeTab === 'neuromuscular' && <NeuromuscularDiagnostics result={result} chartData={chartData} />}
        </ReportTabs>
      </Layout>
    </ProtectedRoute>
  );
}
```

---

## Tab Design (Visual)

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ★ Executive Summary │ ▶ Kinematic Playback │ 🦴 Orthopedic │ 🧠 Neuromuscular │
├────────────────────────────────────────────────────────────────────────────┤
│ ████████████████████                                                       │
│ (active indicator)                                                         │
└────────────────────────────────────────────────────────────────────────────┘

Active tab:   bg-cyan-500/10, text-cyan-400, border-bottom: 2px solid cyan-500
Inactive tab: text-slate-400, hover:text-slate-200
```

---

## Verification
- [ ] All 4 tabs render correctly
- [ ] Tab switching is smooth (no full page reload)
- [ ] URL hash updates when switching tabs (#summary, #kinematic, etc.)
- [ ] Direct URL with hash loads the correct tab
- [ ] Print functionality still works (prints all sections)
- [ ] No data is lost compared to the old infinite scroll page

## Exit Criteria
The report page is fully segmented into 4 tabs. Clinicians can jump directly to any section. The old `results/[id].tsx` can be retired.
