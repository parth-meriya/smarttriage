import logging
from typing import Optional, Tuple, List

logger = logging.getLogger(__name__)

PRIORITY_META = {
    1: {"code": "LEVEL 1", "label": "Emergency", "max_wait_minutes": 0},
    2: {"code": "LEVEL 2", "label": "High Priority", "max_wait_minutes": 10},
    3: {"code": "LEVEL 3", "label": "Urgent", "max_wait_minutes": 60},
    4: {"code": "LEVEL 4", "label": "Non-urgent", "max_wait_minutes": 120},
}

def evaluate_triage(
    primary_complaint: str,
    severe_breathing_difficulty: bool = False,
    chest_pain_or_pressure: bool = False,
    slurred_speech_or_weakness: bool = False,
    spo2: Optional[int] = None,
    heart_rate: Optional[int] = None,
    respiratory_rate: Optional[int] = None,
    systolic_bp: Optional[int] = None,
    diastolic_bp: Optional[int] = None,
    temperature: Optional[float] = None,
) -> Tuple[int, str, List[str]]:
    """
    Deterministic SmartTriage clinical evaluation engine.
    Returns: (priority_level: int, rationale: str, risk_factors: List[str])
    """
    risks: List[str] = []
    priority = 4

    # --- LEVEL 1: IMMEDIATE / LIFE THREAT ---
    if severe_breathing_difficulty:
        priority = 1
        risks.append("Acute respiratory distress reported")
    if spo2 is not None and spo2 < 90:
        priority = 1
        risks.append(f"Critical hypoxia (SpO₂ {spo2}%)")
    if respiratory_rate is not None and (respiratory_rate > 30 or respiratory_rate < 8):
        priority = 1
        risks.append(f"Critical respiratory rate ({respiratory_rate} /min)")
    if heart_rate is not None and (heart_rate > 140 or heart_rate < 40):
        priority = 1
        risks.append(f"Severe hemodynamic instability (HR {heart_rate} bpm)")

    if priority == 1:
        meta = PRIORITY_META[1]
        rationale = f"Assigned {meta['code']} ({meta['label']}) due to immediate life-threatening criteria: {'; '.join(risks)}."
        return priority, rationale, risks

    # --- LEVEL 2: HIGH PRIORITY / EMERGENT ---
    if chest_pain_or_pressure:
        priority = 2
        risks.append("Acute cardiac chest pain symptoms")
    if slurred_speech_or_weakness:
        priority = 2
        risks.append("Focal neurological deficits (stroke alert)")
    if systolic_bp is not None and systolic_bp >= 180:
        priority = 2
        risks.append(f"Hypertensive crisis (Systolic BP {systolic_bp} mmHg)")
    if diastolic_bp is not None and diastolic_bp >= 110:
        priority = 2
        risks.append(f"Severe diastolic hypertension ({diastolic_bp} mmHg)")
    if spo2 is not None and 90 <= spo2 < 94:
        priority = 2
        risks.append(f"Compromised oxygenation (SpO₂ {spo2}%)")
    if heart_rate is not None and heart_rate >= 120:
        priority = 2
        risks.append(f"Marked tachycardia (HR {heart_rate} bpm)")
    if respiratory_rate is not None and respiratory_rate >= 24:
        priority = 2
        risks.append(f"Tachypnea (RR {respiratory_rate} /min)")

    if priority == 2:
        meta = PRIORITY_META[2]
        rationale = f"Assigned {meta['code']} ({meta['label']}) based on high-risk clinical findings: {'; '.join(risks)}."
        return priority, rationale, risks

    # --- LEVEL 3: URGENT ---
    complaint_lower = primary_complaint.lower() if primary_complaint else ""
    if temperature is not None and float(temperature) >= 38.0:
        priority = 3
        risks.append(f"Febrile state (Temp {temperature}°C)")
    if "pain" in complaint_lower or "fracture" in complaint_lower or "burn" in complaint_lower:
        priority = 3
        risks.append("Acute localized pain or trauma requiring prompt evaluation")
    if systolic_bp is not None and systolic_bp >= 140:
        priority = 3
        risks.append(f"Elevated blood pressure ({systolic_bp} mmHg)")
    if heart_rate is not None and 100 <= heart_rate < 120:
        priority = 3
        risks.append(f"Moderate tachycardia (HR {heart_rate} bpm)")

    if priority == 3:
        meta = PRIORITY_META[3]
        rationale = f"Assigned {meta['code']} ({meta['label']}) for urgent clinical assessment: {'; '.join(risks)}."
        return priority, rationale, risks

    # --- LEVEL 4: NON-URGENT ---
    meta = PRIORITY_META[4]
    rationale = f"Assigned {meta['code']} ({meta['label']}). Patient is physiologically stable with no urgent discriminators identified."
    return 4, rationale, []
