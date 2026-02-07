from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict, List, Set

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

SKILL_HINTS = {
    "python",
    "java",
    "javascript",
    "typescript",
    "sql",
    "aws",
    "gcp",
    "azure",
    "docker",
    "kubernetes",
    "react",
    "node",
    "pytorch",
    "tensorflow",
    "machine learning",
    "deep learning",
    "nlp",
    "llm",
    "data analysis",
    "git",
}

ACTION_VERBS = {
    "built",
    "led",
    "improved",
    "optimized",
    "developed",
    "designed",
    "implemented",
    "launched",
    "increased",
    "reduced",
    "automated",
    "managed",
}

SECTION_HINTS = ["experience", "project", "projects", "education", "skills", "summary", "certification"]


@dataclass
class ReviewResult:
    overall_score: int
    jd_match_score: int
    ats_score: int
    section_score: int
    impact_score: int
    matched_keywords: List[str]
    missing_keywords: List[str]
    strengths: List[str]
    improvements: List[str]
    interview_questions: List[str]


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def _extract_keywords(text: str) -> Set[str]:
    normalized = _normalize(text)
    found = set()
    for skill in SKILL_HINTS:
        if skill in normalized:
            found.add(skill)
    tokens = set(re.findall(r"[a-zA-Z][a-zA-Z\-\+\.]{1,}", normalized))
    # Keep potentially useful technical tokens
    for t in tokens:
        if len(t) >= 4 and any(ch.isalpha() for ch in t):
            if t in {"with", "from", "that", "this", "have", "your", "using", "will", "were", "team"}:
                continue
            if t in SKILL_HINTS:
                found.add(t)
    return found


def _calc_jd_match(resume_text: str, jd_text: str) -> int:
    if not jd_text.strip():
        return 0
    vec = TfidfVectorizer(stop_words="english")
    matrix = vec.fit_transform([resume_text, jd_text])
    score = float(cosine_similarity(matrix[0:1], matrix[1:2])[0][0])
    return int(np.clip(round(score * 100), 0, 100))


def _calc_ats_score(resume_text: str) -> int:
    text = _normalize(resume_text)
    length_score = 30 if 250 <= len(text.split()) <= 900 else 18
    section_count = sum(1 for s in SECTION_HINTS if s in text)
    section_score = min(section_count * 8, 32)
    bullet_count = len(re.findall(r"(^|\n)\s*[-*•]", resume_text))
    bullet_score = min(bullet_count * 2, 20)
    numeric_count = len(re.findall(r"\b\d+(?:\.\d+)?%?\b", resume_text))
    numeric_score = min(numeric_count * 2, 18)
    return int(np.clip(length_score + section_score + bullet_score + numeric_score, 0, 100))


def _calc_section_score(resume_text: str) -> int:
    text = _normalize(resume_text)
    section_count = sum(1 for s in SECTION_HINTS if s in text)
    return int(np.clip(section_count / len(SECTION_HINTS) * 100, 0, 100))


def _calc_impact_score(resume_text: str) -> int:
    text = _normalize(resume_text)
    verbs = sum(1 for v in ACTION_VERBS if v in text)
    metrics = len(re.findall(r"\b\d+(?:\.\d+)?%?\b", text))
    score = min(verbs * 9 + metrics * 4, 100)
    return int(score)


def _build_strengths_and_improvements(
    jd_match: int,
    ats: int,
    section: int,
    impact: int,
    matched_keywords: List[str],
    missing_keywords: List[str],
) -> tuple[list[str], list[str]]:
    strengths: list[str] = []
    improvements: list[str] = []

    if jd_match >= 65:
        strengths.append("JD와 이력서 내용 유사도가 높은 편입니다.")
    else:
        improvements.append("JD 핵심 요구사항을 경력 bullet에 더 직접적으로 반영하세요.")

    if ats >= 70:
        strengths.append("ATS 관점에서 구조와 포맷이 비교적 안정적입니다.")
    else:
        improvements.append("섹션 제목/불릿/숫자 기반 성과를 늘려 ATS 가독성을 개선하세요.")

    if section >= 65:
        strengths.append("핵심 섹션(경력/프로젝트/기술스택) 구성이 적절합니다.")
    else:
        improvements.append("Experience, Projects, Skills, Education 섹션을 명확히 분리하세요.")

    if impact >= 60:
        strengths.append("성과를 수치로 표현한 내용이 강점입니다.")
    else:
        improvements.append("각 경험 항목에 수치(%, 시간, 비용, 사용자 수) 기반 성과를 추가하세요.")

    if matched_keywords:
        strengths.append(f"JD 키워드 매칭: {', '.join(matched_keywords[:8])}")

    if missing_keywords:
        improvements.append(f"누락된 주요 키워드 보강: {', '.join(missing_keywords[:8])}")

    return strengths[:5], improvements[:6]


def _build_interview_questions(missing_keywords: List[str], matched_keywords: List[str]) -> List[str]:
    questions = [
        "가장 임팩트 있었던 프로젝트 1개를 STAR 방식으로 설명해 주세요.",
        "해당 역할에서 성과를 수치로 증명할 수 있는 사례는 무엇인가요?",
        "팀 협업 중 충돌을 해결한 경험을 말씀해 주세요.",
    ]
    if matched_keywords:
        questions.append(f"{matched_keywords[0]}를 실제 업무에 적용한 구체적 사례를 설명해 주세요.")
    if missing_keywords:
        questions.append(f"{missing_keywords[0]} 경험이 부족하다면 어떤 방식으로 빠르게 보완할 계획인가요?")
    return questions[:5]


def review_resume(resume_text: str, jd_text: str) -> ReviewResult:
    jd_match = _calc_jd_match(resume_text, jd_text)
    ats = _calc_ats_score(resume_text)
    section = _calc_section_score(resume_text)
    impact = _calc_impact_score(resume_text)

    resume_keywords = _extract_keywords(resume_text)
    jd_keywords = _extract_keywords(jd_text) if jd_text.strip() else set()

    matched_keywords = sorted(resume_keywords & jd_keywords)
    missing_keywords = sorted(jd_keywords - resume_keywords)

    if jd_text.strip():
        overall = int(round(0.45 * jd_match + 0.3 * ats + 0.15 * section + 0.1 * impact))
    else:
        overall = int(round(0.55 * ats + 0.25 * section + 0.2 * impact))

    strengths, improvements = _build_strengths_and_improvements(
        jd_match=jd_match,
        ats=ats,
        section=section,
        impact=impact,
        matched_keywords=matched_keywords,
        missing_keywords=missing_keywords,
    )

    questions = _build_interview_questions(missing_keywords, matched_keywords)

    return ReviewResult(
        overall_score=int(np.clip(overall, 0, 100)),
        jd_match_score=jd_match,
        ats_score=ats,
        section_score=section,
        impact_score=impact,
        matched_keywords=matched_keywords[:15],
        missing_keywords=missing_keywords[:15],
        strengths=strengths,
        improvements=improvements,
        interview_questions=questions,
    )
