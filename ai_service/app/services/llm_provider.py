from abc import ABC, abstractmethod
from typing import Optional
from app.core.config import settings

class BaseLLMProvider(ABC):
    @abstractmethod
    def generate_completion(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        pass

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model_name: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model_name = model_name

    def generate_completion(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_key)
            model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_prompt
            )
            response = model.generate_content(user_prompt)
            return response.text
        except Exception as e:
            print(f"[AI Service] GeminiProvider error: {e}")
            return None

class OpenAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str, model_name: str = "gpt-4o-mini"):
        self.api_key = api_key
        self.model_name = model_name

    def generate_completion(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key)
            response = client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[AI Service] OpenAIProvider error: {e}")
            return None

class MockAIProvider(BaseLLMProvider):
    """Deterministic, explainable clinical assistant for offline or test environments."""
    def generate_completion(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        # Return structured clinical insights based on prompt cues
        if "patient_summary" in system_prompt:
            import json
            summary = "Patient presentation documented and clinical signs prioritized for evaluation."
            rationale = "Urgency assigned based on vital signs thresholds and clinical protocol screening."
            return json.dumps({
                "patient_summary": summary,
                "urgency_rationale": rationale
            })
        return "Clinical decision support: Monitor vital signs closely and follow facility triage protocol."

class LLMProvider:
    """Wrapper that selects provider with automatic graceful degradation."""
    def __init__(self):
        provider_name = settings.LLM_PROVIDER.lower()
        if provider_name == "gemini" and settings.GEMINI_API_KEY:
            self._provider = GeminiProvider(settings.GEMINI_API_KEY, settings.DEFAULT_MODEL)
        elif provider_name == "openai" and settings.OPENAI_API_KEY:
            self._provider = OpenAIProvider(settings.OPENAI_API_KEY)
        else:
            self._provider = MockAIProvider()

    def generate_completion(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        return self._provider.generate_completion(system_prompt, user_prompt)

llm_provider = LLMProvider()
