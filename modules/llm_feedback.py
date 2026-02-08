from __future__ import annotations

import os
from typing import Optional

from openai import OpenAI


def generate_llm_feedback(resume_text: str, jd_text: str, model: str = "gpt-5-mini") -> Optional[str]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None

    client = OpenAI(api_key=api_key)

    prompt = f"""
You are a senior technical recruiter.
Analyze this resume against the job description and return concise Korean feedback.

Output format:
1) 총평 (2문장)
2) 강점 3개
3) 개선점 5개 (각 항목은 실무적으로 고칠 문장 예시 포함)
4) 30초 자기소개 예시

[RESUME]
{resume_text[:7000]}

[JOB DESCRIPTION]
{jd_text[:4000]}
"""

    response = client.responses.create(
        model=model,
        input=prompt,
        temperature=0.3,
    )

    return response.output_text.strip()
