from typing import Optional, List
from pydantic import BaseModel, Field

class VitalsInput(BaseModel):
    spo2: Optional[int] = Field(None, description="Oxygen Saturation percentage")
    heart_rate: Optional[int] = Field(None, description="Heart rate in beats per minute")
    respiratory_rate: Optional[int] = Field(None, description="Breaths per minute")
    systolic_bp: Optional[int] = Field(None, description="Systolic blood pressure mmHg")
    diastolic_bp: Optional[int] = Field(None, description="Diastolic blood pressure mmHg")
    temperature: Optional[float] = Field(None, description="Body temperature in Celsius")

class TriageAnalysisRequest(BaseModel):
    patient_name: str
    age: int
    gender: str = "Male"
    complaint: str
    onset: Optional[str] = "About 30 minutes ago"
    vitals: Optional[VitalsInput] = None
    severe_breathing_difficulty: bool = False
    chest_pain_or_pressure: bool = False
    slurred_speech_or_weakness: bool = False

class TriageAnalysisResponse(BaseModel):
    suggested_priority: int = Field(..., ge=1, le=4, description="Priority level 1 to 4")
    priority_code: str = Field(..., description="e.g. LEVEL 1")
    priority_label: str = Field(..., description="e.g. Emergency")
    patient_summary: str
    urgency_rationale: str
    key_risk_factors: List[str] = []
    guideline_citations: List[str] = []
    clinical_review_required: bool = True
    disclaimer: str = "AI-generated decision support. Clinical review required."

class PatientChatRequest(BaseModel):
    patient_name: str
    complaint: str
    vitals_summary: Optional[str] = None
    question: str

class PatientChatResponse(BaseModel):
    answer: str
    clinical_disclaimer: str = "AI-generated response for clinical decision support. Always verify with patient assessment."
