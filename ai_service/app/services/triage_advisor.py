import json
from app.schemas.triage import (
    TriageAnalysisRequest,
    TriageAnalysisResponse,
    PatientChatRequest,
    PatientChatResponse
)
from app.services.llm_provider import llm_provider
from app.services.clinical_knowledge import retrieve_clinical_guidelines

PRIORITY_META = {
    1: {"code": "LEVEL 1", "label": "Emergency"},
    2: {"code": "LEVEL 2", "label": "High priority"},
    3: {"code": "LEVEL 3", "label": "Urgent"},
    4: {"code": "LEVEL 4", "label": "Non-urgent"},
}

class TriageAdvisor:
    def evaluate_triage(self, req: TriageAnalysisRequest) -> TriageAnalysisResponse:
        """
        Determines assistive clinical priority, summary, urgency rationale,
        and retrieved clinical guidelines with citations.
        """
        risks = []
        priority = 4

        vitals = req.vitals
        spo2 = vitals.spo2 if vitals else None
        hr = vitals.heart_rate if vitals else None
        sbp = vitals.systolic_bp if vitals else None
        temp = vitals.temperature if vitals else None

        # Deterministic clinical rules matching MTS / ESI standards
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

        # Retrieve relevant clinical guidelines (RAG)
        retrieved_guidelines = retrieve_clinical_guidelines(req.complaint, risks)
        citations = [f"{g['id']}: {g['title']} ({g['source']})" for g in retrieved_guidelines]

        # Base summaries
        first_name = req.patient_name.split()[0]
        if spo2 and spo2 < 90:
            summary = f"{first_name} presents with {req.complaint.lower()}. Recorded oxygen saturation is below the expected range ({spo2}%) and requires prompt clinical assessment."
        elif sbp and sbp >= 175:
            summary = f"{first_name} presents with {req.complaint.lower()}. Recorded blood pressure ({sbp} mmHg) is significantly elevated and requires immediate medical evaluation."
        else:
            summary = f"{first_name} presents with {req.complaint.lower()}. Vitals and presenting symptoms are being monitored."

        rationale = "Priority is based on the reported symptom and recorded vital signs."
        if risks:
            rationale += f" Key risk factors identified: {', '.join(risks)}."
        if retrieved_guidelines:
            rationale += f" Concordant with {retrieved_guidelines[0]['title']}."

        # RAG-augmented LLM prompt
        guideline_context = "\n".join([f"- {g['title']}: {g['criteria']} (Source: {g['source']})" for g in retrieved_guidelines])
        system_prompt = (
            "You are SmartTriage Clinical Decision Support AI. Formulate an objective, "
            "concise clinical summary and urgency rationale for emergency healthcare staff.\n"
            f"Reference Clinical Guidelines:\n{guideline_context}\n"
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
                if "patient_summary" in data and data["patient_summary"]:
                    summary = data["patient_summary"]
                if "urgency_rationale" in data and data["urgency_rationale"]:
                    rationale = data["urgency_rationale"]
            except Exception:
                pass

        return TriageAnalysisResponse(
            suggested_priority=priority,
            priority_code=meta["code"],
            priority_label=meta["label"],
            patient_summary=summary,
            urgency_rationale=rationale,
            key_risk_factors=risks,
            guideline_citations=citations,
            clinical_review_required=True,
            disclaimer="AI-generated decision support · Clinical review required."
        )

    def answer_clinical_question(self, req: PatientChatRequest) -> PatientChatResponse:
        """Answers staff questions using clinical decision-support knowledge."""
        retrieved_guidelines = retrieve_clinical_guidelines(req.complaint)
        guideline_context = "\n".join([f"- {g['title']}: {g['criteria']}" for g in retrieved_guidelines])

        system_prompt = (
            "You are SmartTriage Clinical Assistant. Provide direct, objective clinical insights "
            "based strictly on the patient's triage presentation and vitals.\n"
            f"Clinical Knowledge Guidelines:\n{guideline_context}"
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
        return PatientChatResponse(
            answer=answer,
            clinical_disclaimer="AI-generated response for clinical decision support. Always verify with patient assessment."
        )

triage_advisor = TriageAdvisor()
