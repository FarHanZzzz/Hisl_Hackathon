"""
AI-powered clinical summary endpoint.

Uses Google Gemini to interpret raw gait analysis metrics and produce
a structured, human-readable clinical summary.
"""
import json
import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from ..config import GEMINI_API_KEY
from ..services.database import JobService, ResultService

router = APIRouter(prefix="/api/v1/summary", tags=["ai-summary"])


# --- Response Model ---

class AISummaryResponse(BaseModel):
    overview: str
    key_findings: List[str]
    risk_assessment: str
    recommendations: List[str]
    disclaimer: str


# --- Gemini Prompt ---

SYSTEM_PROMPT = """You are a pediatric gait analysis AI assistant for clinicians. 
You will receive structured kinematic data from a gait analysis session of a pediatric patient.
Your job is to interpret the raw numbers and produce a clear, structured clinical summary.

IMPORTANT RULES:
- Write in clear, professional medical language that a clinician would understand.
- Be specific about which values are concerning and why.
- Reference normal pediatric ranges where applicable.
- Do NOT diagnose — only screen and recommend further evaluation.
- Always include the disclaimer that this is an AI-assisted screening tool.

OUTPUT FORMAT — You MUST respond with valid JSON only, no markdown, no extra text:
{
  "overview": "A 2-3 sentence summary of the overall gait pattern observed.",
  "key_findings": [
    "Finding 1 with specific metric reference",
    "Finding 2 with specific metric reference",
    "Finding 3..."
  ],
  "risk_assessment": "A paragraph explaining the risk level and what the asymmetry/symmetry values mean clinically.",
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2",
    "Recommendation 3..."
  ]
}
"""


def _build_user_prompt(result: dict) -> str:
    """Build the Gemini prompt from a result dict."""
    return f"""Analyze the following pediatric gait analysis data:

KINEMATIC MEASUREMENTS:
- Left Knee Max Flexion: {result.get('left_max_flexion', 'N/A')}°
- Left Knee Min Flexion: {result.get('left_min_flexion', 'N/A')}°
- Left Knee Range of Motion: {result.get('left_rom', 'N/A')}°
- Right Knee Max Flexion: {result.get('right_max_flexion', 'N/A')}°
- Right Knee Min Flexion: {result.get('right_min_flexion', 'N/A')}°
- Right Knee Range of Motion: {result.get('right_rom', 'N/A')}°

SYMMETRY ANALYSIS:
- Symmetry Index (L/R Ratio): {result.get('symmetry_index', 'N/A')} (1.0 = perfect symmetry)
- Asymmetry Percentage: {result.get('asymmetry_percentage', 'N/A')}%

CLASSIFICATION:
- AI Diagnosis: {result.get('diagnosis', 'N/A')}
- High Risk Flag: {result.get('is_high_risk', 'N/A')}
- Confidence Score: {result.get('confidence', 'N/A')}

DATA QUALITY:
- Detection Rate: {result.get('detection_rate', 'N/A')}%
- Frames Processed: {result.get('frames_processed', 'N/A')}
- Frames Detected: {result.get('frames_detected', 'N/A')}

Please provide your structured clinical interpretation as JSON."""


# --- Endpoint ---

@router.post("/{job_id}", response_model=AISummaryResponse)
async def generate_summary(job_id: str):
    """
    Generate an AI clinical summary for a completed gait analysis job.
    Calls Gemini to interpret the raw metrics.
    """
    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured. Add it to your .env file."
        )

    # 1. Fetch the job and its results
    job_svc = JobService()
    result_svc = ResultService()

    job = job_svc.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Job is not completed yet")

    # Get results for this job
    results = result_svc.get_by_job(job_id)
    if not results:
        raise HTTPException(status_code=404, detail="No results found for this job")

    result = results[0] if isinstance(results, list) else results

    # 2. Build the prompt
    user_prompt = _build_user_prompt(result)

    # 3. Call Gemini
    try:
        from google import genai

        client = genai.Client(api_key=GEMINI_API_KEY)

        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=user_prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.3,
                max_output_tokens=1500,
            ),
        )

        # Parse the JSON response
        raw_text = response.text.strip()
        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1]  # Remove first line
            raw_text = raw_text.rsplit("```", 1)[0]  # Remove last fence
            raw_text = raw_text.strip()

        summary_data = json.loads(raw_text)

        return AISummaryResponse(
            overview=summary_data.get("overview", "Summary unavailable."),
            key_findings=summary_data.get("key_findings", []),
            risk_assessment=summary_data.get("risk_assessment", "Assessment unavailable."),
            recommendations=summary_data.get("recommendations", []),
            disclaimer="This is an AI-assisted screening tool and does not constitute a medical diagnosis. All findings should be interpreted by a qualified healthcare professional."
        )

    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse AI response: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI summary generation failed: {type(e).__name__}: {str(e)}"
        )
