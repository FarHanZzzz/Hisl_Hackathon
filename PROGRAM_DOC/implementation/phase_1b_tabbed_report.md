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

### Sub-Phase 1B.1: Quick Summary Report Layout Redesign

**Problem:** The ParentInsightsPanel (Quick Summary) dumps all insights into a simple vertical list with no visual hierarchy, making it hard to scan and understand quickly.

**Fix:**
- [ ] Redesign the Quick Summary panel with a structured, card-based layout:
  - **Overview bar** at the top: severity indicator (🟢 Healthy / 🟡 Mild / 🔴 Concern), total areas flagged, one-sentence verdict.
  - **Insight cards** arranged in a 2-column grid (desktop) / stacked (mobile) — each card has:
    - Icon + title (e.g., "Knee Alignment")
    - Severity badge (color-coded)
    - Plain-English explanation (max 2-3 sentences visible, "Read More" expander for detail)
    - The specific metric value shown prominently
  - **Next Steps section** at the bottom: clear, actionable CTA ("Show this to your doctor", "Book a consultation")
- [ ] Ensure the summary is NOT collapsed by default — it should be the first thing a parent sees and understands.

---

### Sub-Phase 1B.2: Interactive Video with Clickable Problem Markers

**Problem:** The processed video plays passively — users cannot interact with it to understand what specific problems look like in real-time.

**Fix:**
- [ ] Overlay clickable **problem markers** (hotspots/annotations) on the processed video at frames where issues are detected:
  - Each marker appears as a pulsing colored dot/icon on the body part where the issue occurs (e.g., knee, ankle, trunk).
  - Markers are color-coded: 🟡 mild, 🔴 concern.
- [ ] When a user **clicks a marker**, a slide-out detail panel appears showing:
  - The name of the problem (e.g., "Knee Valgus Detected")
  - The measured angle vs. normal range
  - A plain-English explanation of what it means
  - Which gait cycle percentage it occurs at
- [ ] The video timeline shows colored segments/flags where problems were detected so users can scrub directly to problem areas.
- [ ] Markers are derived from the existing MediaPipe extraction data (angle arrays + thresholds already computed).

---

### Sub-Phase 1B.3: Premium Diagnostics Card UI

**Problem:** The current Orthopedic and Neuromuscular diagnostics sections use basic colored boxes with plain text. They don't match the premium clinical dashboard aesthetic expected (reference: dark cards with ALERT/SIGNIFICANT/NORMAL badges, large metric values, and "VIEW DETAIL" buttons).

**Fix:**
- [ ] Redesign each diagnostics section (Orthopedic & Neuromuscular) to match the reference UI:
  - **Dark card backgrounds** (`bg-slate-900/80`) with subtle borders.
  - **Status badge** in the top-right corner: `ALERT` (red), `SIGNIFICANT` (amber), `NORMAL` (green) — styled as pill badges.
  - **Icon** in the top-left: distinct icon per evaluation (⚠️ for alert, ⚡ for significant, ✅ for normal).
  - **Evaluation title** (e.g., "Rickets Eval", "LLD Eval", "Clubfoot Eval") with a subtitle description.
  - **Large metric value** displayed prominently (e.g., `168.6° VALGUS ANGLE`).
  - **"VIEW DETAIL >"** button at the bottom of each card that expands to show:
    - Full clinical interpretation
    - Normal range comparison
    - Threshold explanation
    - Recommended next steps
  - Cards displayed in a 3-column grid (desktop) / stacked (mobile).
- [ ] Below the cards: a **"Kinematics Over Gait Cycle"** chart with the same dark theme, showing all relevant lines (Knee Valgus, Pelvic Tilt, Dorsiflexion) with proper legends and gait phase labels (Stance Phase / Swing Phase).

---

### Sub-Phase 1B.4: Consistent Processed Video Loading

**Problem:** The processed video fails to load on some devices and is inconsistent across the report views. The video check uses `HEAD` requests that may be blocked by CORS or proxy issues.

**Fix:**
- [ ] Ensure the video element uses proper fallback chain: try MP4 first, then WebM, then show a meaningful error state.
- [ ] Add `playsInline` attribute for iOS Safari compatibility.
- [ ] Add explicit `crossOrigin="anonymous"` and ensure the Next.js API rewrite at `/api/results/` correctly proxies video files from the backend.
- [ ] Verify the video `Content-Type` header is correctly set (`video/mp4` or `video/webm`) by the backend serving the file.
- [ ] Add a retry mechanism: if the initial `HEAD` check fails, retry once after 2 seconds (the video may still be processing).
- [ ] Ensure the video player is responsive and maintains aspect ratio on all screen sizes (mobile, tablet, desktop).
- [ ] Test on Chrome, Firefox, Safari (iOS + macOS), and Edge.

---

## Verification
- [ ] All 4 tabs render correctly
- [ ] Tab switching is smooth (no full page reload)
- [ ] URL hash updates when switching tabs (#summary, #kinematic, etc.)
- [ ] Direct URL with hash loads the correct tab
- [ ] Print functionality still works (prints all sections)
- [ ] No data is lost compared to the old infinite scroll page
- [ ] Quick Summary panel is scannable and parent-friendly with card layout
- [ ] Video markers appear at detected problem frames and are clickable
- [ ] Diagnostics cards match premium dark-theme reference design
- [ ] Processed video loads consistently on all devices and browsers

## Exit Criteria
The report page is fully segmented into 4 tabs. Clinicians can jump directly to any section. The Quick Summary is parent-friendly with structured cards. The video is interactive with clickable problem markers. Diagnostics sections have a premium clinical dashboard UI. The processed video loads reliably on every device. The old `results/[id].tsx` can be retired.
