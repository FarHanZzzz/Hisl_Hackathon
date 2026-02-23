"""
AI-powered clinical summary endpoint.

Uses OpenRouter API (via httpx) to interpret raw gait analysis
metrics and produce a structured, human-readable clinical summary.
"""
import json
import re
import httpx
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from ..config import OPENROUTER_API_KEY, OPENROUTER_MODEL
from ..services.database import JobService, ResultService

# Hardcoded fallbacks if the primary model gets rate-limited
FREE_MODEL_FALLBACKS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
    "nvidia/nemotron-3-nano-30b-a3b:free",
    "google/gemma-3-4b-it:free",
    "deepseek/deepseek-r1-0528:free"
]

print("AI SUMMARY MODULE LOADED:")
print(f"  KEY length: {len(OPENROUTER_API_KEY)}")
print(f"  MODEL: {OPENROUTER_MODEL}")

router = APIRouter(prefix="/api/v1/summary", tags=["ai-summary"])

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


# --- Response Model ---

class AISummaryResponse(BaseModel):
    overview: str
    what_this_means: str
    key_findings: List[str]
    risk_assessment: str
    recommendations: List[str]
    disclaimer: str


# --- Prompt ---

SYSTEM_PROMPT = """You are a pediatric gait analysis AI assistant that explains results to PARENTS and NON-MEDICAL people.

Your audience is NOT doctors — they are parents, caregivers, and everyday people who want to understand what their child's gait analysis means in SIMPLE, CLEAR language.

IMPORTANT RULES:
- Write like you are explaining to a worried parent. Use everyday language, not medical jargon.
- When mentioning angles or numbers, ALWAYS explain what they mean in practical terms.
  Example: Instead of "Left knee ROM is 26.86 degrees" say "The left knee only bends about 27 degrees during walking, which is much less than the normal range of 40-60 degrees. This means the knee is stiffer than expected."
- Explain what symmetry/asymmetry means: "The left and right legs move differently from each other, which can cause an uneven walk."
- Use analogies and comparisons to make things relatable.
- Be empathetic but honest. Don't sugarcoat concerning findings, but don't be alarming either.
- ALWAYS explain what each finding means for the child's daily life (walking, running, playing).
- Include a "what_this_means" section that gives a simple 3-4 sentence plain-English summary a parent can quickly understand.

OUTPUT FORMAT — You MUST respond with valid JSON only, no markdown, no extra text:
{
  "overview": "A 3-4 sentence summary written in simple language explaining what was observed in the child's walking pattern. Avoid medical jargon.",
  "what_this_means": "A 3-4 sentence plain-English explanation a parent can understand. What does this mean for my child? Is this something to worry about? What should I do next? Be specific and practical.",
  "key_findings": [
    "Finding 1: Explain the measurement AND what it means in simple terms. Example: 'The left knee bends about 27 degrees during walking — this is less than the normal 40-60 degrees, meaning the knee appears stiffer than expected and may cause the child to walk with a limp.'",
    "Finding 2: Same format — number + plain explanation",
    "Finding 3: Same format",
    "Finding 4: Same format"
  ],
  "risk_assessment": "A detailed paragraph explaining the overall risk level in plain language. What does 'high risk' or 'normal' actually mean? What should the parent understand? Be specific about what the asymmetry percentage and symmetry index tell us about the child's walking.",
  "recommendations": [
    "Recommendation 1: Specific, actionable step written for a parent (not a doctor)",
    "Recommendation 2: Another clear next step",
    "Recommendation 3: Another clear next step",
    "Recommendation 4: Another clear next step"
  ]
}
"""


def _build_user_prompt(result: dict) -> str:
    """Build the prompt from a result dict."""
    return f"""Analyze the following pediatric gait analysis data and explain it in simple terms for a parent:

WHAT WAS MEASURED (Knee Angles During Walking):
- Left Knee Maximum Bend: {result.get('left_max_flexion', 'N/A')} degrees
- Left Knee Minimum Bend: {result.get('left_min_flexion', 'N/A')} degrees
- Left Knee Range of Motion (how much it bends/straightens): {result.get('left_rom', 'N/A')} degrees
- Right Knee Maximum Bend: {result.get('right_max_flexion', 'N/A')} degrees
- Right Knee Minimum Bend: {result.get('right_min_flexion', 'N/A')} degrees
- Right Knee Range of Motion: {result.get('right_rom', 'N/A')} degrees

HOW EVENLY THE LEGS MOVE:
- Symmetry Index: {result.get('symmetry_index', 'N/A')} (1.0 means both legs move identically, further from 1.0 means more difference between legs)
- Asymmetry Percentage: {result.get('asymmetry_percentage', 'N/A')}% (0% = perfectly even, higher = more uneven)

AI CLASSIFICATION:
- Diagnosis: {result.get('diagnosis', 'N/A')}
- High Risk: {result.get('is_high_risk', 'N/A')}
- Confidence: {result.get('confidence', 'N/A')}

VIDEO QUALITY:
- Detection Rate: {result.get('detection_rate', 'N/A')}%
- Frames Analyzed: {result.get('frames_processed', 'N/A')}
- Frames with Clear Detection: {result.get('frames_detected', 'N/A')}

Normal pediatric knee ROM during walking is typically 40-60 degrees. A symmetry index near 1.0 is normal; anything below 0.9 or above 1.1 suggests notable asymmetry.

Please explain these results in simple, parent-friendly language. Be specific about what each number means for the child's walking and daily life. Respond ONLY with JSON."""


def _extract_json(text: str) -> dict:
    """Robust JSON extraction from AI response text."""
    text = text.strip()

    # Strip reasoning model <think>...</think> blocks (e.g. DeepSeek R1)
    text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

    # Try 1: Direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try 2: Strip markdown code fences
    if "```" in text:
        cleaned = re.sub(r"```(?:json)?\s*", "", text)
        cleaned = cleaned.strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

    # Try 3: Extract first { ... } block via brace matching
    start = text.find("{")
    if start != -1:
        depth = 0
        for i in range(start, len(text)):
            if text[i] == "{":
                depth += 1
            elif text[i] == "}":
                depth -= 1
                if depth == 0:
                    try:
                        return json.loads(text[start : i + 1])
                    except json.JSONDecodeError:
                        break

    raise json.JSONDecodeError("Could not extract JSON from AI response", text, 0)


# --- Endpoint ---

@router.post("/{job_id}", response_model=AISummaryResponse)
async def generate_summary(job_id: str):
    """
    Generate an AI clinical summary for a completed gait analysis job.
    """
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY is not configured. Add it to your .env file."
        )

    # 1. Fetch the job and its results
    job_svc = JobService()
    result_svc = ResultService()

    job = job_svc.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Job is not completed yet")

    results = result_svc.get_by_job(job_id)
    if not results:
        raise HTTPException(status_code=404, detail="No results found for this job")

    result = results[0] if isinstance(results, list) else results

    # 2. Build the prompt
    user_prompt = _build_user_prompt(result)

    # 3. Call OpenRouter via httpx (OpenAI-compatible)
    # We will try the user's configured model first, then fallback to others if rate-limited
    try:
        models_to_try = [OPENROUTER_MODEL] + [m for m in FREE_MODEL_FALLBACKS if m != OPENROUTER_MODEL]
        
        last_error_detail = "Failed to connect to OpenRouter"
        
        for attempt, model_id in enumerate(models_to_try):
            try:
                async with httpx.AsyncClient(timeout=120.0) as client:
                    resp = await client.post(
                        OPENROUTER_URL,
                        headers={
                            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": model_id,
                            "messages": [
                                {"role": "system", "content": SYSTEM_PROMPT},
                                {"role": "user", "content": user_prompt},
                            ],
                            "temperature": 0.3,
                            "max_tokens": 2000,
                        },
                    )
                
                # If rate limited (429) or model missing (404/400), try the next model
                if resp.status_code in [429, 404, 400]:
                    last_error_detail = f"Model {model_id} failed: {resp.text[:200]}"
                    continue
                    
                if resp.status_code != 200:
                    detail = resp.text[:300]
                    raise HTTPException(status_code=resp.status_code, detail=f"OpenRouter error: {detail}")

                data = resp.json()
                raw_text = data["choices"][0]["message"]["content"]
                summary_data = _extract_json(raw_text)

                return AISummaryResponse(
                    overview=summary_data.get("overview", "Summary unavailable."),
                    what_this_means=summary_data.get("what_this_means", ""),
                    key_findings=summary_data.get("key_findings", []),
                    risk_assessment=summary_data.get("risk_assessment", "Assessment unavailable."),
                    recommendations=summary_data.get("recommendations", []),
                    disclaimer="This is an AI-assisted screening tool and does not constitute a medical diagnosis. All findings should be verified through clinical observation and professional medical judgment."
                )
                
            except httpx.RequestError as e:
                last_error_detail = f"Network error trying {model_id}: {str(e)}"
                continue

        # If all models failed
        raise HTTPException(status_code=500, detail=f"All models rate-limited or failed. Last error: {last_error_detail}")

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse AI response: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI summary generation failed: {type(e).__name__}: {str(e)}"
        )
