"""
Clinical Knowledge Retrieval (RAG) for SmartTriage.
Contains curated triage protocols based on Manchester Triage System (MTS)
and Emergency Severity Index (ESI) standards.
"""

from typing import List, Dict, Any

CLINICAL_GUIDELINES: List[Dict[str, Any]] = [
    {
        "id": "MTS-RESP-01",
        "category": "Respiratory",
        "keywords": ["breathing", "dyspnea", "wheezing", "asthma", "hypoxia", "spo2", "cyanosis", "stridor"],
        "title": "Manchester Triage System: Shortness of Breath Protocol",
        "source": "Manchester Triage Group (MTS) 3rd Edition · Cardiorespiratory Section",
        "target_level": 1,
        "criteria": (
            "Patients presenting with SpO₂ < 90% on room air, exhaustion, severe retractions, "
            "or inability to complete words represent Immediate Life Threat (Level 1 Emergency). "
            "Immediate oxygen therapy, high Fowler positioning, and critical physician assessment required."
        )
    },
    {
        "id": "MTS-CHEST-02",
        "category": "Cardiovascular",
        "keywords": ["chest", "cardiac", "angina", "pressure", "radiating", "heart", "infarction"],
        "title": "MTS & ESI Protocol: Acute Coronary Syndrome Screening",
        "source": "Emergency Severity Index (ESI) v4 Implementation Handbook · Section 3",
        "target_level": 2,
        "criteria": (
            "Acute chest pain or substernal tightness radiating to jaw, left arm, or back "
            "requires immediate 12-lead ECG within 10 minutes of arrival (High Priority / ESI Level 2). "
            "Continuous telemetry monitoring and vascular access must be prioritized."
        )
    },
    {
        "id": "FAST-NEURO-03",
        "category": "Neurological",
        "keywords": ["stroke", "speech", "slurred", "weakness", "facial", "droop", "numbness", "fast"],
        "title": "AHA/ASA FAST Stroke Assessment Protocol",
        "source": "American Heart Association / American Stroke Association Acute Stroke Guidelines",
        "target_level": 2,
        "criteria": (
            "Sudden onset of facial asymmetry, unilateral arm/leg weakness, or slurred/absent speech "
            "mandates immediate Stroke Team activation with last known normal (LKN) time documentation (Level 2). "
            "Urgent non-contrast head CT protocol must be initiated within 20 minutes."
        )
    },
    {
        "id": "ESI-HYPER-04",
        "category": "Vascular",
        "keywords": ["hypertension", "bp", "blood pressure", "systolic", "headache", "crisis"],
        "title": "Emergency Severity Index: Hypertensive Urgency / Crisis Protocol",
        "source": "ACC/AHA Clinical Practice Guidelines for High Blood Pressure",
        "target_level": 2,
        "criteria": (
            "Systolic BP ≥ 180 mmHg or Diastolic BP ≥ 110 mmHg with acute symptoms represents hypertensive crisis "
            "(High Priority Level 2). Screen for acute end-organ damage (headache, visual changes, chest pain)."
        )
    },
    {
        "id": "MTS-FEVER-05",
        "category": "Infectious",
        "keywords": ["fever", "temperature", "febrile", "chills", "sepsis", "infection"],
        "title": "MTS Febrile Illness & Sepsis Screening",
        "source": "Surviving Sepsis Campaign Guidelines · Emergency Triage Screening",
        "target_level": 3,
        "criteria": (
            "Temperature ≥ 38.0°C in an adult requires Level 3 (Urgent) evaluation. "
            "If accompanied by tachycardia (HR > 100) and tachypnea (RR > 20), calculate qSOFA score "
            "to rule out systemic inflammatory response or sepsis."
        )
    },
    {
        "id": "MTS-ROUTINE-06",
        "category": "General",
        "keywords": ["minor", "scrape", "stable", "routine", "refill", "mild", "follow-up"],
        "title": "MTS Level 4: Non-Urgent Care Protocol",
        "source": "Emergency Severity Index (ESI) v4 Resource Allocation Guidelines",
        "target_level": 4,
        "criteria": (
            "Normal vital signs and mild localized complaints without systemic signs "
            "classify as Level 4 (Non-urgent). Standard waiting area observation with re-triage if symptoms evolve."
        )
    }
]

def retrieve_clinical_guidelines(complaint: str, key_risks: List[str] = None) -> List[Dict[str, Any]]:
    """
    RAG retrieval: finds relevant clinical guidelines based on complaint text and risk factors.
    Returns matching protocols with source citations.
    """
    query_text = (complaint + " " + " ".join(key_risks or [])).lower()
    matches = []

    for guideline in CLINICAL_GUIDELINES:
        score = 0
        for kw in guideline["keywords"]:
            if kw in query_text:
                score += 1
        if score > 0:
            matches.append((score, guideline))

    # Sort by relevance score descending
    matches.sort(key=lambda x: x[0], reverse=True)
    
    # Return top 2 matching guidelines (or general protocol if none match)
    if matches:
        return [m[1] for m in matches[:2]]
    return [CLINICAL_GUIDELINES[-1]]
