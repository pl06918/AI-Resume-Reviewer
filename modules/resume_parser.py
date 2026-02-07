from __future__ import annotations

from io import BytesIO
from typing import Optional

import docx
from PyPDF2 import PdfReader


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(BytesIO(file_bytes))
    pages = []
    for page in reader.pages:
        pages.append(page.extract_text() or "")
    return "\n".join(pages).strip()


def extract_text_from_docx(file_bytes: bytes) -> str:
    document = docx.Document(BytesIO(file_bytes))
    lines = [p.text for p in document.paragraphs if p.text]
    return "\n".join(lines).strip()


def extract_text_from_txt(file_bytes: bytes) -> str:
    for encoding in ("utf-8", "cp949", "latin-1"):
        try:
            return file_bytes.decode(encoding).strip()
        except UnicodeDecodeError:
            continue
    return ""


def extract_resume_text(file_name: str, file_bytes: bytes) -> Optional[str]:
    file_name = file_name.lower()
    if file_name.endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    if file_name.endswith(".docx"):
        return extract_text_from_docx(file_bytes)
    if file_name.endswith(".txt"):
        return extract_text_from_txt(file_bytes)
    return None
