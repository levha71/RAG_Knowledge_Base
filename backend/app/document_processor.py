import io
import re

import fitz
from docx import Document


def extract_pdf(data: bytes):
    pages = []

    pdf = fitz.open(stream=data, filetype="pdf")

    for page_number, page in enumerate(pdf, start=1):
        text = page.get_text("text").strip()

        if not text:
            blocks = page.get_text("blocks")
            text_parts = []

            for block in blocks:
                if len(block) >= 5 and block[4].strip():
                    text_parts.append(block[4].strip())

            text = "\n".join(text_parts).strip()

        if text:
            pages.append({
                "page": page_number,
                "text": text
            })

    pdf.close()

    return pages


def extract_txt(data: bytes):
    text = data.decode("utf-8", errors="ignore").strip()

    if not text:
        return []

    return [{
        "page": 1,
        "text": text
    }]


def extract_docx(data: bytes):
    document = Document(io.BytesIO(data))

    paragraphs = []

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()

        if text:
            paragraphs.append(text)

    text = "\n".join(paragraphs).strip()

    if not text:
        return []

    return [{
        "page": 1,
        "text": text
    }]


def extract_text(filename: str, data: bytes):
    extension = filename.lower().split(".")[-1]

    if extension == "pdf":
        return extract_pdf(data)

    if extension == "txt":
        return extract_txt(data)

    if extension == "docx":
        return extract_docx(data)

    raise ValueError(
        "Поддерживаются только PDF, TXT и DOCX."
    )


def split_text(text: str, chunk_size=900, overlap=150):
    text = re.sub(r"\s+", " ", text).strip()

    if not text:
        return []

    result = []
    start = 0

    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()

        if chunk:
            result.append(chunk)

        if end >= len(text):
            break

        start = end - overlap

    return result