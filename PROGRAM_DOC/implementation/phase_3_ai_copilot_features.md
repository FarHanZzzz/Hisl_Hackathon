# Phase 3: AI Co-pilot & Intelligent Patient Onboarding

## Overview
Inspired by open-source solutions like GaitAnalyzer, this phase elevates the patient experience from a static "report viewer" into an interactive, supportive journey. It introduces two major features:
1. **Intelligent Onboarding Agent ("App Walkthrough"):** A guided, conversational tour that helps new users understand how to use the app (e.g., how to record a video properly for the analysis).
2. **"Waiting Room" AI Co-pilot:** An interactive LLM chat agent that engages the parent while they wait for a doctor's review. It is grounded in the specific patient's MediaPipe extraction data (gait features) to explain findings in simple, empathetic terms.

---

## 1. The "Waiting Room" AI Co-pilot (GaitAnalyzer Feature)

### The Concept
Instead of just displaying "High Risk for DMD" and leaving the parent anxious while waiting for a doctor's consultation, a chat interface appears:
> *"Hi, I am the Pedi-Growth AI. I noticed some trunk sway in the video we just analyzed. Do you have any immediate questions while I connect you to a doctor?"*

### Architecture Details

**1. Backend (FastAPI / LangChain)**
*   **Endpoint:** `POST /api/copilot/chat`
*   **Context Injection (The Handoff):** The backend initializes the LLM conversation with a system prompt that contains the *actual extracted data* from the recent analysis.
    *   *System Prompt Example:* "You are a paediatric AI assistant. The parent is waiting for a doctor. You recently analyzed a video and found: 15-degree trunk sway, elevated pelvic tilt. Explain this gently. Do not give a final medical diagnosis. Answer their questions in simple terms."
*   **Memory:** Use a short-term memory buffer (e.g., LangChain's `ConversationBufferMemory`) tied to a `session_id` so the user can ask follow-up questions.

**2. Frontend (React / Next.js)**
*   **Component:** `<AICopilotChat />`
*   **Placement:** Rendered on the Patient Portal Results page. It can be a floating chat widget or embedded below the severe alert banner.
*   **Trigger:** Automatically open the chat with the initial greeting once a report finishes generating, or when the user clicks "Consult Specialist Now".

---

## 2. Intelligent Onboarding Agent (App Walkthrough)

### The Concept
When a patient logs in for the first time or attempts to start a new analysis, a friendly AI agent walks them through the process to ensure high-quality video submissions (which is crucial for MediaPipe accuracy).

### Architecture Details

**1. Frontend Library Selection**
*   Use a library like `react-joyride` or `intro.js` to handle the step-by-step element highlighting.

**2. Walkthrough Steps**
*   **Step 1: Dashboard:** "Welcome to Pedi-Growth. This is your dashboard where you can track your child's progress."
*   **Step 2: Start Analysis Button:** "To begin, click here. You will need your smartphone camera."
*   **Step 3: Upload Instruction Modal:** "Make sure the room is well-lit. Record your child walking towards the camera for at least 5 seconds. Avoid loose clothing if possible."

**3. Integration with the AI Persona**
*   Instead of standard tooltips, style the tooltips to look like chat bubbles coming from the Pedi-Growth AI mascot/avatar. 

---

## Technical Implementation Steps

### Step 3.1: Create the Co-pilot Backend Chat Endpoint
Create a new file in your Python backend (e.g., `app/api/copilot.py`):
```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
# Assume specialized LLM service is available

router = APIRouter()

class ChatRequest(BaseModel):
    report_id: str
    message: str
    session_id: str

@router.post("/chat")
async def copilot_chat(request: ChatRequest):
    # 1. Fetch the diagnostic report data from Supabase using report_id
    # 2. Extract MediaPipe metrics (e.g., trunk sway angles)
    # 3. Construct System Prompt with the patient's data
    # 4. Generate LLM response
    # 5. Return response
    pass
```

### Step 3.2: Build the Frontend Chat Component
Create `frontend/components/patient/AICopilotChat.tsx`:
*   Implement a standard chat UI (messages list, input box).
*   Add a "Typing..." indicator.
*   Connect it to the `/api/copilot/chat` endpoint.

### Step 3.3: Implement the Onboarding Walkthrough
Create `frontend/components/walkthrough/PatientOnboarding.tsx`:
```tsx
import Joyride from 'react-joyride';

const steps = [
    { target: '.start-analysis-btn', content: 'Click here to start a new gait analysis.' },
    { target: '.upload-area', content: 'Ensure the video is well-lit and shows the full body.' },
];

export const PatientOnboarding = () => {
    return (
        <Joyride
            steps={steps}
            continuous
            showSkipButton
            styles={{
                options: { primaryColor: '#0ea5e9' } // Use your brand color
            }}
        />
    );
};
```

## Why this wins Hackathons
*   **Empathy & UX:** Combining strict medical analysis (MediaPipe) with an empathetic interface (LLM Co-pilot) addresses the human element of healthcare technology.
*   **Error Prevention:** The onboarding agent ensures better input data, which means your AI gait analysis will be more accurate during the live demo.
