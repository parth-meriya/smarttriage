from fastapi.testclient import TestClient
import pytest
from main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_evaluate_triage_level_1_emergency_rag():
    payload = {
        "patient_name": "Marcus Vance",
        "age": 58,
        "gender": "Male",
        "complaint": "Severe acute shortness of breath and wheezing",
        "onset": "15 minutes ago",
        "severe_breathing_difficulty": True,
        "vitals": {
            "spo2": 87,
            "heart_rate": 125,
            "respiratory_rate": 32
        }
    }
    response = client.post("/api/v1/triage/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["suggested_priority"] == 1
    assert data["priority_code"] == "LEVEL 1"
    assert data["clinical_review_required"] is True
    assert "AI-generated" in data["disclaimer"]
    # Check RAG citations
    assert len(data["guideline_citations"]) > 0
    assert any("MTS" in c or "Manchester" in c for c in data["guideline_citations"])

def test_evaluate_triage_level_2_cardiac_rag():
    payload = {
        "patient_name": "Helen Keller",
        "age": 62,
        "gender": "Female",
        "complaint": "Substernal chest pressure radiating to left arm",
        "chest_pain_or_pressure": True,
        "vitals": {
            "spo2": 98,
            "heart_rate": 95,
            "systolic_bp": 185,
            "diastolic_bp": 110
        }
    }
    response = client.post("/api/v1/triage/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["suggested_priority"] == 2
    assert data["priority_code"] == "LEVEL 2"
    assert any("chest" in r.lower() or "hypertensive" in r.lower() for r in data["key_risk_factors"])
    assert any("Acute Coronary" in c or "Hypertensive" in c for c in data["guideline_citations"])

def test_clinical_chat_assistant():
    payload = {
        "patient_name": "Helen Keller",
        "complaint": "Chest pressure",
        "vitals_summary": "BP 185/110, HR 95",
        "question": "What immediate diagnostic tests are indicated?"
    }
    response = client.post("/api/v1/ai/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert len(data["answer"]) > 0
    assert "clinical_disclaimer" in data
