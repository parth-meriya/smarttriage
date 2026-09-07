TRIAGE_QUESTIONS = [
    {
        "id": "primary_complaint",
        "question": "What is the primary reason for your visit?",
        "field": "primary_complaint",
        "type": "text",
        "required": True,
        "placeholder": "e.g. Sudden onset chest tightness, laceration, high fever"
    },
    {
        "id": "symptom_onset",
        "question": "When did your symptoms start?",
        "field": "symptom_onset",
        "type": "select",
        "required": True,
        "options": [
            "Within the last 30 minutes",
            "1 to 2 hours ago",
            "Earlier today",
            "1 to 2 days ago",
            "More than 3 days ago"
        ]
    },
    {
        "id": "severe_breathing_difficulty",
        "question": "Are you experiencing severe shortness of breath or struggling to breathe?",
        "field": "severe_breathing_difficulty",
        "type": "boolean",
        "urgency_trigger": 1,
        "urgency_label": "Level 1 Emergency"
    },
    {
        "id": "chest_pain_or_pressure",
        "question": "Are you having chest pain, severe pressure, or pain radiating to your arm, neck, or jaw?",
        "field": "chest_pain_or_pressure",
        "type": "boolean",
        "urgency_trigger": 2,
        "urgency_label": "Level 2 High Priority"
    },
    {
        "id": "slurred_speech_or_weakness",
        "question": "Have you experienced sudden facial drooping, one-sided arm weakness, or slurred speech?",
        "field": "slurred_speech_or_weakness",
        "type": "boolean",
        "urgency_trigger": 2,
        "urgency_label": "Level 2 High Priority"
    },
    {
        "id": "clinical_notes",
        "question": "Additional nurse observations or patient-reported details:",
        "field": "clinical_notes",
        "type": "textarea",
        "required": False,
        "placeholder": "Enter any additional observations, allergies, or context..."
    }
]
