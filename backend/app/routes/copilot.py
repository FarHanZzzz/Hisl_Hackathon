import json
from typing import Dict, List
import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..config import OPENROUTER_API_KEY, OPENROUTER_MODEL
from ..services.database import ResultService

router = APIRouter(prefix="/api/v1/copilot", tags=["copilot"])

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Simple in-memory memory (acts like ConversationBufferMemory)
chat_memory: Dict[str, List[dict]] = {}

class ChatRequest(BaseModel):
    report_id: str
    message: str
    session_id: str
    lang: str = "en"

class ChatResponse(BaseModel):
    response: str

@router.post("/chat", response_model=ChatResponse)
async def copilot_chat(req: ChatRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY is not configured."
        )

    # Note: the user requested report_id. In our schema, results are linked by result id or job id.
    # We will try fetching the result by job_id (assuming report_id == job_id since we pass id from results/[id])
    result_svc = ResultService()
    results = result_svc.get_by_job(req.report_id)
    if not results:
        # Fallback to get_by_id if it's the result ID directly
        try:
            result = result_svc.get_by_id(req.report_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Result not found")
    else:
        result = results[0] if isinstance(results, list) else results

    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    # Extract metrics
    left_flex = result.get("left_max_flexion", "N/A")
    right_flex = result.get("right_max_flexion", "N/A")
    knee_valgus = result.get("knee_valgus_angle", "N/A")
    symmetry = result.get("symmetry_index", "N/A")
    diagnosis = result.get("diagnosis", "N/A")

    metrics_text = (
        f"Left Knee Bending: {left_flex}°, Right Knee Bending: {right_flex}°, "
        f"Knee Valgus Angle: {knee_valgus}°, Symmetry Index: {symmetry}, "
        f"Initial Diagnosis Note: {diagnosis}"
    )

    system_prompt = (
        f"You are a compassionate paediatric AI assistant named Pedi-Growth AI. The parent is waiting for a doctor. "
        f"You recently analyzed a video of their child and found these exact metrics: {metrics_text}. "
        "Explain this gently. Do not give a final medical diagnosis. Answer their questions in simple terms, "
        "keeping answers short, empathetic, and conversational. Never use complex jargon without explaining it. "
        "Keep your responses concise (2-3 sentences max)."
    )

    if req.lang == "bn":
        system_prompt += "\n\nCRITICAL: You MUST write your responses ENTIRELY in fluent Bengali (বাংলা)."

    # Initialize memory if new session
    if req.session_id not in chat_memory:
        chat_memory[req.session_id] = [
            {"role": "system", "content": system_prompt}
        ]
    
    # Append user message
    chat_memory[req.session_id].append({"role": "user", "content": req.message})

    # Prepare payload
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                OPENROUTER_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": chat_memory[req.session_id],
                    "temperature": 0.5,
                    "max_tokens": 500,
                },
            )
        
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"OpenRouter error: {resp.text}")

        resp_json = resp.json()
        ai_message = resp_json["choices"][0]["message"]["content"]
        
        # Append AI response to memory
        chat_memory[req.session_id].append({"role": "assistant", "content": ai_message})

        return ChatResponse(response=ai_message)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI Copilot failed: {str(e)}"
        )
