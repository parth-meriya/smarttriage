import json
from app.schemas.triage import (
    TriageAnalysisRequest,
    TriageAnalysisResponse,
    PatientChatRequest,
    PatientChatResponse
)
from app.services.llm_provider import llm_provider

PRIORITY_META = {
    1: {"code": "LEVEL 1", "label": "Emergency"},
    2: {"code": "LEVEL 2", "label": "High priority"},
    3: {"code": "LEVEL 3", "label": "Urgent"},
    4: {"code": "LEVEL 4", "label": "Non-urgent"},
}

class TriageAdvisor:
    def evaluate_triage(self, req: TriageAnalysisRequest) -> TriageAnalysisResponse:
        """Determines clinical priority, summary, and urgency rationale."""
        risks = []
        priority = 4

        vitals = req.vitals
        spo2 = vitals.spo2 if vitals else None
        hr = vitals.heart_rate if vitals else None
        sbp = vitals.systolic_bp if vitals else None
        temp = vitals.temperature if vitals else None

        # Clinical Manchester / ESI triage logic
        if req.severe_breathing_difficulty or (spo2 and spo2 < 90):
            priority = 1
            if spo2 and spo2 < 90:
                risks.append(f"Severe hypoxia (SpO₂ {spo2}%)")
            if req.severe_breathing_difficulty:
                risks.append("Acute respiratory distress reported")
        elif req.slurred_speech_or_weakness or req.chest_pain_or_pressure or (sbp and sbp >= 175) or (hr and hr >= 115):
            priority = 2
            if req.slurred_speech_or_weakness:
                risks.append("Focal neurological deficits (stroke alert)")
            if req.chest_pain_or_pressure:
                risks.append("Acute cardiac chest pain symptoms")
            if sbp and sbp >= 175:
                risks.append(f"Severe hypertensive blood pressure ({sbp} mmHg)")
            if hr and hr >= 115:
                risks.append(f"Marked tachycardia (HR {hr} bpm)")
        elif (temp and temp >= 38.0) or "pain" in req.complaint.lower():
            priority = 3
            if temp and temp >= 38.0:
                risks.append(f"Febrile state (Temp {temp}°C)")
            if "pain" in req.complaint.lower():
                risks.append("Acute localized pain requiring assessment")
        else:
            priority = 4

        meta = PRIORITY_META[priority]

        # Formulate summaries
        summary = (
            f"{req.patient_name.split()[0]} presents with {req.complaint.lower()}. "
            + (f"Recorded oxygen saturation is below the expected range ({spo2}%) and requires prompt clinical assessment." if spo2 and spo2 < 90 else "Vitals and presenting symptoms are being monitored.")
        )
        rationale = "Priority is based on the reported symptom and recorded vital signs."
        if risks:
            rationale += f" Key risk factors identified: {', '.join(risks)}."

        # Attempt LLM enrichment if provider is configured
        system_prompt = (
            "You are SmartTriage Clinical Decision Support AI. Formulate an objective, "
            "concise clinical summary and urgency rationale for emergency healthcare staff. "
            "Return JSON with keys: patient_summary, urgency_rationale."
        )
        user_prompt = (
            f"Patient: {req.patient_name}, Age: {req.age}, Gender: {req.gender}\n"
            f"Chief Complaint: {req.complaint}, Onset: {req.onset}\n"
            f"Vitals: SpO2={spo2}, HR={hr}, SBP={sbp}, Temp={temp}\n"
            f"Assigned Level: {meta['code']} - {meta['label']}"
        )
        llm_output = llm_provider.generate_completion(system_prompt, user_prompt)
        if llm_output:
            try:
                clean_json = llm_output.strip().removeprefix("```json").removesuffix("```").strip()
                data = json.loads(clean_json)
                if "patient_summary" in data:
                    summary = data["patient_summary"]
                if "urgency_rationale" in data:
                    rationale = data["urgency_rationale"]
            except Exception:
                pass

        return TriageAnalysisResponse(
            suggested_priority=priority,
            priority_code=meta["code"],
            priority_label=meta["label"],
            patient_summary=summary,
            urgency_rationale=rationale,
            key_risk_factors=risks
        )

    def answer_clinical_question(self, req: PatientChatRequest) -> PatientChatResponse:
        """Answers staff questions about a patient's condition."""
        system_prompt = (
            "You are SmartTriage Clinical Assistant. Provide direct, objective clinical insights "
            "based strictly on the patient's triage presentation and vitals."
        )
        user_prompt = (
            f"Patient: {req.patient_name}\nComplaint: {req.complaint}\nVitals: {req.vitals_summary or 'Normal'}\n"
            f"Question: {req.question}"
        )
        llm_reply = llm_provider.generate_completion(system_prompt, user_prompt)
        answer = llm_reply or (
            f"Based on {req.patient_name}'s recorded presentation for {req.complaint.lower()}, "
            "clinical priority should focus on airway/breathing stability and verifying oxygen saturation "
            "along with targeted symptom review."
        )
        return PatientChatResponse(answer=answer)

triage_advisor = TriageAdvisor()
