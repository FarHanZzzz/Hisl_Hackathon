# Phase 1A: Component Extraction

## Goal
Extract the 5 inline components currently embedded inside the 1,128-line `results/[id].tsx` file into standalone, reusable files. This is a **pure refactor** — no new features, no behavior changes. The page must look and work exactly the same after extraction.

## Dependencies
- Phase 0C (auth must exist so we can scope pages, but technically this can happen in parallel)

## The Problem
The file `pages/results/[id].tsx` contains 5 component definitions that should not be inline:

| Component | Lines | Purpose |
|-----------|-------|---------|
| `ParentInsightsPanel` | 15–214 | Plain-language parent summary cards |
| `OrthopedicSummaryCard` | 217–274 | 3 orthopedic status badges |
| `OrthopedicGraphArea` | 276–332 | Valgus + Pelvic + Dorsiflexion chart |
| `NeuromuscularSummaryCard` | 335–401 | 3 neuromuscular status badges |
| `NeuromuscularGraphArea` | 403–460 | Trunk Sway + Shoulder Tilt chart |

Additionally, the **AI Summary Card** (lines 988–1112) should be extracted.

---

## What Gets Created

### New Directory: `src/components/clinical/`

```
src/components/clinical/
├── ParentInsightsPanel.tsx       ← Lines 15–214 from [id].tsx
├── OrthopedicSummaryCard.tsx     ← Lines 217–274
├── OrthopedicGraphArea.tsx       ← Lines 276–332
├── NeuromuscularSummaryCard.tsx   ← Lines 335–401
├── NeuromuscularGraphArea.tsx     ← Lines 403–460
└── AISummaryCard.tsx             ← Lines 988–1112
```

### Extraction Rules

1. **Move, don't copy.** The inline code is deleted from `[id].tsx` and placed in the new file.
2. **Props interface.** Each component gets an explicit TypeScript `Props` interface.
3. **Import from types.** All components import `Result` from `../../types`.
4. **No logic changes.** The calculations (trunk sway variance, shoulder divergence, etc.) stay exactly as they are.

### Example: `ParentInsightsPanel.tsx`

```typescript
import { useMemo, useState } from 'react';
import type { Result } from '../../types';

interface Props {
  result: Result;
}

export function ParentInsightsPanel({ result }: Props) {
  // ... exact same code from lines 15-214 of current [id].tsx
}
```

### After: `pages/results/[id].tsx` (simplified)

```typescript
// Before: 1,128 lines with inline components
// After: ~700 lines with clean imports

import { ParentInsightsPanel } from '../../src/components/clinical/ParentInsightsPanel';
import { OrthopedicSummaryCard } from '../../src/components/clinical/OrthopedicSummaryCard';
import { OrthopedicGraphArea } from '../../src/components/clinical/OrthopedicGraphArea';
import { NeuromuscularSummaryCard } from '../../src/components/clinical/NeuromuscularSummaryCard';
import { NeuromuscularGraphArea } from '../../src/components/clinical/NeuromuscularGraphArea';
import { AISummaryCard } from '../../src/components/clinical/AISummaryCard';

// ... rest of the page uses these as <ParentInsightsPanel result={result} />
```

---

## What Gets Modified

| File | Change |
|------|--------|
| `pages/results/[id].tsx` | Remove inline components, add imports, reduce from ~1128 to ~700 lines |

## What Gets Created

| File | Lines | Source |
|------|-------|--------|
| `src/components/clinical/ParentInsightsPanel.tsx` | ~200 | [id].tsx L15-214 |
| `src/components/clinical/OrthopedicSummaryCard.tsx` | ~60 | [id].tsx L217-274 |
| `src/components/clinical/OrthopedicGraphArea.tsx` | ~60 | [id].tsx L276-332 |
| `src/components/clinical/NeuromuscularSummaryCard.tsx` | ~70 | [id].tsx L335-401 |
| `src/components/clinical/NeuromuscularGraphArea.tsx` | ~60 | [id].tsx L403-460 |
| `src/components/clinical/AISummaryCard.tsx` | ~130 | [id].tsx L988-1112 |

---

## Verification
- [ ] `npm run dev` compiles without errors
- [ ] Results page renders identically to before (visual diff)
- [ ] All 6 extracted components render correctly
- [ ] No TypeScript type errors
- [ ] `[id].tsx` is now ~700 lines instead of 1,128

## Exit Criteria
Components are extracted. The results page works exactly as before but the code is modular and ready for Phase 1B (tabbed view).
