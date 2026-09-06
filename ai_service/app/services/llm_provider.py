import os
from typing import Optional
from app.core.config import settings

class LLMProvider:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.gemini_key = settings.GEMINI_API_KEY
        self.openai_key = settings.OPENAI_API_KEY

    def generate_completion(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        """Dispatches completion request to configured LLM provider."""
        if self.provider == "gemini" and self.gemini_key:
            return self._call_gemini(system_prompt, user_prompt)
        elif self.provider == "openai" and self.openai_key:
            return self._call_openai(system_prompt, user_prompt)
        return None

    def _call_gemini(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        try:
            import google.generativeai as genai
            genai.configure(api_key=self.gemini_key)
            model = genai.GenerativeModel(
                model_name=settings.DEFAULT_MODEL,
                system_instruction=system_prompt
            )
            response = model.generate_content(user_prompt)
            return response.text
        except Exception as e:
            print(f"[AI Service] Gemini invocation error: {e}")
            return None

    def _call_openai(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.openai_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.2
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[AI Service] OpenAI invocation error: {e}")
            return None

llm_provider = LLMProvider()
