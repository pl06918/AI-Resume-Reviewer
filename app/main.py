from __future__ import annotations

import streamlit as st
import plotly.graph_objects as go

from modules.llm_feedback import generate_llm_feedback
from modules.resume_parser import extract_resume_text
from modules.scorer import review_resume

st.set_page_config(page_title="AI Resume Reviewer", page_icon="📄", layout="wide")

st.title("📄 AI Resume Reviewer")
st.caption("UGA Hackathon 제출용 MVP - Resume/JD 기반 자동 피드백")

with st.sidebar:
    st.header("설정")
    use_llm = st.toggle("LLM 상세 피드백 사용 (OPENAI_API_KEY 필요)", value=False)
    st.markdown("지원 파일: PDF, DOCX, TXT")

col1, col2 = st.columns([1, 1])

with col1:
    uploaded_resume = st.file_uploader("이력서 업로드", type=["pdf", "docx", "txt"])

with col2:
    jd_text = st.text_area(
        "Job Description 입력 (선택)",
        height=250,
        placeholder="채용 공고 내용을 붙여넣으면 JD 매칭 점수가 계산됩니다.",
    )

if uploaded_resume:
    file_bytes = uploaded_resume.read()
    resume_text = extract_resume_text(uploaded_resume.name, file_bytes)

    if not resume_text:
        st.error("파일에서 텍스트를 읽지 못했습니다. 다른 형식으로 다시 업로드해 주세요.")
    else:
        result = review_resume(resume_text, jd_text)

        s1, s2, s3, s4 = st.columns(4)
        s1.metric("Overall", f"{result.overall_score}/100")
        s2.metric("JD Match", f"{result.jd_match_score}/100")
        s3.metric("ATS", f"{result.ats_score}/100")
        s4.metric("Impact", f"{result.impact_score}/100")

        fig = go.Figure(
            data=[
                go.Bar(
                    x=["JD Match", "ATS", "Section", "Impact"],
                    y=[
                        result.jd_match_score,
                        result.ats_score,
                        result.section_score,
                        result.impact_score,
                    ],
                    marker_color=["#0068c9", "#00a3a3", "#f39c12", "#27ae60"],
                )
            ]
        )
        fig.update_layout(height=320, margin=dict(l=20, r=20, t=20, b=20), yaxis_range=[0, 100])
        st.plotly_chart(fig, use_container_width=True)

        c1, c2 = st.columns(2)

        with c1:
            st.subheader("강점")
            for s in result.strengths:
                st.write(f"- {s}")

            st.subheader("누락 키워드")
            if result.missing_keywords:
                st.write(", ".join(result.missing_keywords))
            else:
                st.write("누락된 핵심 키워드가 거의 없습니다.")

        with c2:
            st.subheader("개선 포인트")
            for i in result.improvements:
                st.write(f"- {i}")

            st.subheader("면접 예상 질문")
            for q in result.interview_questions:
                st.write(f"- {q}")

        with st.expander("추출된 이력서 텍스트 보기"):
            st.text_area("Resume Text", resume_text, height=300)

        if use_llm:
            with st.spinner("LLM 피드백 생성 중..."):
                llm_feedback = generate_llm_feedback(resume_text, jd_text)
            if llm_feedback:
                st.subheader("LLM 상세 피드백")
                st.markdown(llm_feedback)
            else:
                st.info("OPENAI_API_KEY가 설정되어 있지 않아 LLM 피드백은 건너뜁니다.")
else:
    st.info("이력서를 업로드하면 분석이 시작됩니다.")
