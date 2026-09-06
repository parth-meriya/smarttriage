from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.schemas.triage import (
    TriageAnalysisRequest,
    TriageAnalysisResponse,
    PatientChatRequest,
    PatientChatResponse
)
from app.services.triage_advisor import triage_advisor

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SmartTriage AI Microservice: Clinical decision support, triage urgency categorization, and RAG."
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["Root"])
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "healthy"
    }

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "provider": settings.LLM_PROVIDER}

@app.post(
    f"{settings.API_V1_STR}/triage/evaluate",
    response_model=TriageAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Triage Decision Support"]
)
def evaluate_triage(request: TriageAnalysisRequest):
    """Evaluates symptoms and vitals to generate triage urgency scores, summary, and rationales."""
    return triage_advisor.evaluate_triage(request)

@app.post(
    f"{settings.API_V1_STR}/ai/chat",
    response_model=PatientChatResponse,
    status_code=status.HTTP_200_OK,
    tags=["Clinical Assistant Q&A"]
)
def ask_assistant(request: PatientChatRequest):
    """Provides decision-support answers for clinical staff questions."""
    return triage_advisor.answer_clinical_question(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
