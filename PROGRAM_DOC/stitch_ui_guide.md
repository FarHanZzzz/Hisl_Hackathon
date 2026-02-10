# Stitch MCP — UI Design Guide for Pedi-Growth

> **Purpose**: Use the Stitch MCP server to generate premium UI screens for Pedi-Growth.
> Each section contains an exact prompt to feed into `generate_screen_from_text`.
> After generation, adapt the output into `frontend/src/components/`.

---

## Setup

1. Create a Stitch project:
   - Call `mcp_stitch_create_project` with title: `"Pedi-Growth Gait Analysis"`
   - Save the returned `projectId` for all subsequent calls

2. Generate screens using `mcp_stitch_generate_screen_from_text`
   - Use `deviceType: "DESKTOP"` for main app views
   - Use `deviceType: "MOBILE"` to validate responsive design

---

## Screen 1: Home Page (Upload + Patient Form)

**Prompt for Stitch**:
```
Design a medical web application home page for "Pedi-Growth — Pediatric Gait Analysis".

Header: Clean top bar with app name "Pedi-Growth" on the left with a medical cross icon, and a subtle tagline "Clinical Gait Analysis Tool" underneath. Use a modern sans-serif font.

Layout: Two-column layout on desktop (sidebar left 35%, content right 65%).

Left column - Patient Info Form:
- Title: "New Analysis" with a step indicator (Step 1 of 2)
- Input field: "Patient ID" (required, with asterisk)
- Input field: "Patient Name" (optional)
- Number input: "Age (years)" with range 0-18
- Textarea: "Clinical Notes" (optional, 2 rows)
- Drag-and-drop upload zone: Large dashed border area with an upload cloud icon, text "Drop your gait video here", supporting text "MP4, MOV, AVI — Max 100MB — 5-60 seconds"
- File info display after upload: filename, size, thumbnail if possible
- Primary action button: "Start Analysis" (full width, gradient blue-to-purple, disabled if no patient ID or video)

Right column - Empty State:
- Centered illustration area with a subtle walking silhouette
- Text: "Upload a gait video to begin analysis"
- Subtext: "Results will appear here after processing"

Below both columns:
- Section title: "Recent Analyses" with a clock icon
- Table with columns: Date, Patient ID, Status (badge: green "Completed", yellow "Processing", gray "Queued"), Symmetry Index, Action (view button)
- Show 3 sample rows

Color scheme: White background, subtle gray borders (#E5E7EB), primary blue (#3B82F6), medical green (#10B981). Dark text (#111827). Very clean, clinical, trustworthy feel.

Footer: Small text "For screening purposes only — not a replacement for professional diagnosis"
```

---

## Screen 2: Processing State (Modal/Inline)

**Prompt for Stitch**:
```
Design a processing state overlay for a medical gait analysis app.

This appears over the home page when a video is being analyzed.

Center card (max 500px wide, white background, rounded corners, shadow):
- Top: Animated medical scanning icon or brain/wave icon
- Title: "Analyzing Gait Pattern..."
- Subtitle: "Patient: P001 — John Doe"
- Progress bar: Rounded, gradient from blue to green, currently at 65%
- Below progress: "Processing frame 156 of 240"
- Estimated time: "~15 seconds remaining"
- Status steps (vertical timeline, with checkmarks for completed, spinner for current):
  ✅ Video uploaded successfully
  ✅ Pose detection initialized
  🔄 Extracting joint angles (frame 156/240)
  ⬜ Computing symmetry metrics
  ⬜ Generating report

- Small text at bottom: "Do not close this page"

Background: Semi-transparent dark overlay (#00000080)
Overall feel: Clean, medical, reassuring, modern
```

---

## Screen 3: Results Dashboard (Normal Result)

**Prompt for Stitch**:
```
Design a results dashboard for a pediatric gait analysis app showing a NORMAL result.

Top banner (full width, light green background #ECFDF5, green left border):
- Large checkmark icon (green)
- Title: "NORMAL" in bold green text
- Subtitle: "Gait symmetry within normal clinical limits (SI = 1.02)"
- Right aligned: "Confidence: 90%" in a subtle badge

Patient info bar: "Patient: P001 — John Doe — Age: 5 years — Analyzed: Feb 10, 2026"

Metrics grid (4 cards in a row):
- Card 1: "Left Max Flexion" → "130.2°" (large number, subtle body icon)
- Card 2: "Right Max Flexion" → "128.1°" (large number, subtle body icon)
- Card 3: "Asymmetry" → "1.6%" (green text, highlighted border)
- Card 4: "Detection Rate" → "95%" (with small progress circle)

Below metrics - Chart section:
- Title: "Knee Flexion Angle — Left vs Right"
- Line chart with two lines (green for Left, red for Right) over ~240 data points
- X-axis: "Frame", Y-axis: "Angle (°)"
- Legend at top right
- Grid lines dashed and subtle

Additional stats row (2 columns):
- Left: "Left ROM: 10.2° | Right ROM: 9.8°"
- Right: "Frames Processed: 240 | Frames Detected: 228"

Action buttons at bottom:
- "New Analysis" (outline button)
- "Download Report" (primary button, blue)
- "View History" (text link)

Overall aesthetic: Clean medical UI, white background, cards with subtle shadows, professional but modern
```

---

## Screen 4: Results Dashboard (HIGH RISK)

**Prompt for Stitch**:
```
Design the same results dashboard but for a HIGH RISK result.

Top banner (full width, light red background #FEF2F2, red left border):
- Large warning triangle icon (red)
- Title: "HIGH RISK" in bold red text
- Subtitle: "Significant gait asymmetry detected (left-dominant, SI = 1.32, asymmetry = 32%). Specialist evaluation recommended."
- Right aligned: "Confidence: 87%" in a badge

(Rest of the layout same as the normal result card, but the Asymmetry card has a red highlight border and red text showing "32%")

Add an alert box below the chart:
- Yellow/amber background
- Icon: Info circle
- Text: "This result indicates significant asymmetry. Please refer the patient for specialist evaluation. This tool is for screening only."
```

---

## Screen 5: Mobile View

**Prompt for Stitch** (use `deviceType: "MOBILE"`):
```
Design the mobile version of the pediatric gait analysis home page.

Single column layout on a phone screen (375px width):
- Header: "Pedi-Growth" with hamburger menu
- Patient form fields stacked vertically
- Upload zone: Tap to select video (camera icon + file icon)
- Start Analysis button (full width)
- Recent analyses as a vertical card list (not table)

Clean, touch-friendly design. Large tap targets (min 44px). Medical color scheme.
```

---

## How to Use Generated Stitch Output

After each screen is generated:

1. **Get the screen**: Call `mcp_stitch_get_screen` with the projectId and screenId
2. **Extract the code**: The response includes HTML/CSS/React code
3. **Adapt to Next.js**: Convert the generated code into your components:
   - Color values → `tailwind.config.js` theme
   - Layout → Tailwind utility classes
   - Components → Individual `.tsx` files in `frontend/src/components/`
4. **Preserve the design tokens**: Colors, spacing, typography from Stitch
5. **Add interactivity**: Wire up the static components to your hooks (`useJob`, `useUpload`)

---

## Design Tokens to Extract

After generating, standardize these across your app:

```
Colors:
  primary:      #3B82F6  (blue)
  success:      #10B981  (green)
  danger:       #EF4444  (red)
  warning:      #F59E0B  (amber)
  background:   #FFFFFF
  surface:      #F9FAFB
  border:       #E5E7EB
  text:         #111827
  text-muted:   #6B7280

Typography:
  font-family:  'Inter', sans-serif
  heading:      font-weight 700
  body:         font-weight 400
  small:        text-xs, text-gray-500

Spacing:
  card-padding: 1.5rem
  section-gap:  2rem
  border-radius: 0.75rem
```
