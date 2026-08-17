import io

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from pydantic import BaseModel

from .config import (
    PROXY_API_KEY,
    PROXY_API_BASE,
    LLM_MODEL,
    MAX_FILE_SIZE,
)
from .document_processor import extract_text
from .rag import RAGEngine


app = FastAPI(
    title="RAG Knowledge Base API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


rag_engine = RAGEngine()

llm_client = OpenAI(
    api_key=PROXY_API_KEY,
    base_url=PROXY_API_BASE,
)


class QueryRequest(BaseModel):
    question: str


SYSTEM_PROMPT = """
Ты — система поиска информации по документу.

КРИТИЧЕСКИЕ ПРАВИЛА:

1. Отвечай ТОЛЬКО на основании предоставленного контекста.
2. Не используй собственные знания для дополнения ответа.
3. Не придумывай отсутствующие факты.
4. Не делай предположений.
5. Не изменяй смысл информации из документа.
6. Если контекст не содержит ответа на вопрос,
обязательно ответь:

"Информация не найдена в загруженном документе."

Отвечай кратко и точно.
"""


@app.get("/health")
def health():
    return {
        "status": "ok",
        "document_loaded": rag_engine.index is not None,
        "document": rag_engine.document_name,
    }


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename or ""

    extension = filename.lower().split(".")[-1]

    if extension not in {"pdf", "txt", "docx"}:
        raise HTTPException(
            status_code=400,
            detail="Поддерживаются только PDF, TXT и DOCX.",
        )

    data = await file.read()

    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Файл слишком большой. Максимальный размер — 1 МБ.",
        )

    if not data:
        raise HTTPException(
            status_code=400,
            detail="Файл пустой.",
        )

    try:
        pages = extract_text(filename, data)

        result = rag_engine.create_index(
            pages,
            filename,
        )

        return {
            "status": "success",
            "message": "Документ успешно обработан и проиндексирован.",
            **result,
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e),
        )


@app.post("/query")
def query(request: QueryRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Вопрос не может быть пустым.",
        )

    if rag_engine.index is None:
        raise HTTPException(
            status_code=400,
            detail="Сначала загрузите документ.",
        )

    try:
        context, sources = rag_engine.search(question)

        context_text = "\n\n--- ФРАГМЕНТ ---\n\n".join(context)

        user_prompt = f"""
КОНТЕКСТ ДОКУМЕНТА:

{context_text}

ВОПРОС:

{question}

Ответь строго по контексту.
"""

        response = llm_client.chat.completions.create(
            model=LLM_MODEL,
            temperature=0,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": user_prompt,
                },
            ],
        )

        answer = response.choices[0].message.content.strip()

        return {
            "answer": answer,
            "sources": sources,
        }

    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Ошибка RAG/LLM: {str(e)}",
        )