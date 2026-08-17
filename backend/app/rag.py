import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from .config import TOP_K
from .document_processor import split_text


class RAGEngine:

    def __init__(self):
        self.embedding_model = SentenceTransformer(
            "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        )

        self.chunks = []
        self.metadata = []
        self.index = None
        self.document_name = None

    def create_index(self, document_pages, filename):
        self.chunks = []
        self.metadata = []
        self.document_name = filename

        for page_data in document_pages:
            page_number = page_data["page"]
            page_text = page_data["text"]

            page_chunks = split_text(page_text)

            for chunk in page_chunks:
                self.chunks.append(chunk)

                self.metadata.append({
                    "document": filename,
                    "page": page_number,
                    "chunk": len(self.chunks)
                })

        if not self.chunks:
            raise ValueError("В документе не найден текст.")

        embeddings = self.embedding_model.encode(
            self.chunks,
            convert_to_numpy=True,
            normalize_embeddings=True
        ).astype("float32")

        dimension = embeddings.shape[1]

        self.index = faiss.IndexFlatIP(dimension)
        self.index.add(embeddings)

        return {
            "document": filename,
            "chunks": len(self.chunks)
        }

    def search(self, question):
        if self.index is None:
            raise ValueError("Сначала загрузите документ.")

        question_embedding = self.embedding_model.encode(
            [question],
            convert_to_numpy=True,
            normalize_embeddings=True
        ).astype("float32")

        scores, indexes = self.index.search(
            question_embedding,
            min(TOP_K, len(self.chunks))
        )

        context = []
        sources = []

        for score, index in zip(scores[0], indexes[0]):
            if index < 0:
                continue

            context.append(self.chunks[index])

            source = self.metadata[index].copy()
            source["similarity"] = round(float(score), 4)

            sources.append(source)

        return context, sources