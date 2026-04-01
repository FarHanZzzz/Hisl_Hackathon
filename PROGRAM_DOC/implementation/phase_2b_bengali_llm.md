# Phase 2B: Bengali Localization + LLM Translation

## Goal
Enable the patient portal to work in Bengali (বাংলা). Static text is translated via i18n JSON files. Dynamic clinical content (AI summaries, insights) is translated by the LLM at generation time.

## Dependencies
- Phase 2A (patient portal UI exists)

---

## Two-Layer Translation Strategy

### Layer 1: Static Strings (i18n)
Button labels, headings, fixed UI text — translated once in JSON files.

**Tool:** `next-i18next`

```
frontend/
├── public/
│   └── locales/
│       ├── en/
│       │   ├── common.json      -- Shared strings (buttons, nav)
│       │   └── patient.json     -- Patient portal strings
│       └── bn/
│           ├── common.json
│           └── patient.json
```

**Example `en/patient.json`:**
```json
{
  "welcome": "Hello, {{name}}",
  "record_video": "Record New Video",
  "past_results": "Past Results",
  "healthy": "Healthy",
  "needs_attention": "Needs Attention",
  "share_with_doctor": "Share with Doctor",
  "view_in_bengali": "বাংলায় দেখুন",
  "upload_progress": "Uploading...",
  "upload_keep_open": "Please keep this screen open",
  "next_step": "Show this report to your child's doctor at the next visit."
}
```

**Example `bn/patient.json`:**
```json
{
  "welcome": "স্বাগতম, {{name}}",
  "record_video": "নতুন ভিডিও রেকর্ড করুন",
  "past_results": "আগের ফলাফল",
  "healthy": "সুস্থ",
  "needs_attention": "মনোযোগ দরকার",
  "share_with_doctor": "ডাক্তারের সাথে শেয়ার করুন",
  "view_in_bengali": "View in English",
  "upload_progress": "আপলোড হচ্ছে...",
  "upload_keep_open": "এই স্ক্রিন খোলা রাখুন",
  "next_step": "আপনার সন্তানের পরবর্তী ভিজিটে ডাক্তারকে এই রিপোর্টটি দেখান।"
}
```

**Usage in components:**
```tsx
import { useTranslation } from 'next-i18next';

function PatientHome() {
  const { t } = useTranslation('patient');
  return <button>{t('record_video')}</button>;
  // English: "Record New Video"
  // Bengali: "নতুন ভিডিও রেকর্ড করুন"
}
```

---

### Layer 2: Dynamic Content (LLM Translation)
The ParentInsightsPanel generates insights dynamically based on data. The AI summary is unique per analysis. These cannot be pre-translated in JSON files — they must be translated at generation time.

**Approach:** Add a `lang` parameter to the AI summary endpoint.

### Backend Change: `routes/ai_summary.py`

```python
@router.post("/api/v1/summary/{job_id}")
async def generate_summary(job_id: str, lang: str = Query("en", regex="^(en|bn)$")):
    # ... fetch result data ...

    if lang == "bn":
        system_prompt = """
        You are a compassionate pediatric health communicator.
        Generate a clinical summary in clear, simple Bengali (বাংলা).
        Use everyday Bengali words that a rural parent would understand.
        Do NOT use English medical terms — translate everything.
        Tone: warm, reassuring, empathetic.
        """
    else:
        system_prompt = """
        You are a compassionate pediatric health communicator.
        Generate a clinical summary in clear, simple English...
        """

    # ... call LLM with the appropriate prompt ...
```

### Backend Change: `routes/ai_summary.py` — Bengali Insight Translation

For the `ParentInsightsPanel` dynamic insights:

```python
@router.get("/api/v1/patient/results/{job_id}")
async def get_patient_result(job_id: str, lang: str = "en"):
    result = result_svc.get_by_job(job_id)
    
    if lang == "bn":
        # Translate the insight texts via LLM
        insights = generate_bengali_insights(result)
    else:
        insights = generate_english_insights(result)
    
    return {
        "diagnosis": result["diagnosis"],
        "insights": insights,  # Pre-translated plain-language cards
        "summary": None  # Fetched separately via /summary endpoint
    }
```

---

## Language Selector

On the patient portal, a language toggle appears:
- On the login page (before auth, so they can read instructions)
- On the results page (to switch between English ↔ Bengali)
- Stored in the patient's profile (`language` field in `profiles` table)

```tsx
function LanguageToggle() {
  const { i18n } = useTranslation();
  const toggle = () => {
    const newLang = i18n.language === 'en' ? 'bn' : 'en';
    i18n.changeLanguage(newLang);
    // Also update profile.language via API
  };
  return (
    <button onClick={toggle}>
      {i18n.language === 'en' ? 'বাংলায় দেখুন' : 'View in English'}
    </button>
  );
}
```

---

## Bengali Font Support

Add Bengali-compatible font to `_document.tsx`:

```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet" />
```

CSS:
```css
[lang="bn"] {
  font-family: 'Noto Sans Bengali', sans-serif;
}
```

---

## Verification
- [ ] All static patient portal strings display correctly in Bengali
- [ ] Language toggle switches between English and Bengali instantly
- [ ] AI summary generates valid Bengali text via LLM
- [ ] Bengali font renders correctly (no broken characters)
- [ ] Language preference persists across page navigations
- [ ] Language preference is saved to user profile

## Exit Criteria
A Bengali-speaking parent can use the entire patient portal in their native language — from login to results to AI summary.
