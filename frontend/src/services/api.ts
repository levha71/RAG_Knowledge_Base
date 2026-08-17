import { QueryResponse, UploadResponse, DocumentInfo } from '../types';
import { SAMPLE_DOCUMENTS, STRICT_NOT_FOUND_MESSAGE } from '../data/sampleDocs';

export const DEFAULT_API_BASE_URL = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || 
  'http://localhost:8000';

export const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024; // 1 MB
export const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.docx'];
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateDocumentFile(file: File): FileValidationResult {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Файл слишком большой. Максимальный размер — 1 МБ.'
    };
  }

  const nameLower = file.name.toLowerCase();
  const hasValidExt = ALLOWED_EXTENSIONS.some(ext => nameLower.endsWith(ext));

  if (!hasValidExt) {
    return {
      valid: false,
      error: 'Неподдерживаемый формат. Разрешены только файлы PDF, TXT и DOCX.'
    };
  }

  return { valid: true };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Б';
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// In-memory document session storage for Mock Mode
let currentMockDoc: DocumentInfo | null = null;
let currentMockCustomText: string | null = null;

export const ApiService = {
  getBaseUrl(): string {
    return localStorage.getItem('rag_api_base_url') || DEFAULT_API_BASE_URL;
  },

  setBaseUrl(url: string) {
    localStorage.setItem('rag_api_base_url', url);
  },

  async checkHealth(baseUrl?: string): Promise<{ ok: boolean; error?: string }> {
    const rawUrl = baseUrl || this.getBaseUrl();
    const url = rawUrl.replace(/\/+$/, '');

    // Colab internal proxy warning
    if (url.includes('colab.dev')) {
      // Still try, but prepare helpful error
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${url}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return { ok: true };
      }
      return { 
        ok: false, 
        error: `Сервер ответил со статусом ${res.status} (${res.statusText || 'Error'}).` 
      };
    } catch (err: any) {
      if (url.includes('colab.dev')) {
        return {
          ok: false,
          error: 'Адреса *.colab.dev защищены Google OAuth и блокируют запросы от сторонних сайтов (CORS). Для Google Colab используйте ngrok или Cloudflare Tunnel.'
        };
      }
      if (err?.name === 'AbortError') {
        return { ok: false, error: 'Таймаут подключения (сервер не ответил за 4 сек). Проверьте URL.' };
      }
      return { 
        ok: false, 
        error: 'Браузер заблокировал запрос (CORS или сервер недоступен). Убедитесь, что в FastAPI включен CORSMiddleware.' 
      };
    }
  },

  async upload(
    file: File,
    isMock: boolean,
    onProgress?: (percent: number, stepText: string) => void
  ): Promise<UploadResponse> {
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    if (isMock) {
      return this._mockUpload(file, onProgress);
    }

    // Real FastAPI Backend upload
    const formData = new FormData();
    formData.append('file', file);

    const rawBaseUrl = this.getBaseUrl();
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    
    try {
      const response = await fetch(`${baseUrl}/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        let errorDetail = `Ошибка сервера (${response.status} ${response.statusText})`;
        try {
          const errData = await response.json();
          if (typeof errData.detail === 'string') {
            errorDetail = errData.detail;
          } else if (Array.isArray(errData.detail)) {
            // FastAPI 422 validation errors array
            errorDetail = errData.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
          } else if (errData.message) {
            errorDetail = errData.message;
          }
        } catch {
          // If response is plain text / HTML (like 404 or 502)
          const text = await response.text().catch(() => '');
          if (text) {
            errorDetail = `Сервер вернул ${response.status}: ${text.slice(0, 150)}`;
          }
        }

        if (response.status === 404) {
          throw new Error(`Эндпоинт POST ${baseUrl}/upload не найден (404 Not Found). Убедитесь, что в FastAPI объявлен роут @app.post("/upload").`);
        }
        if (response.status === 422) {
          throw new Error(`Ошибка валидации параметров FastAPI (422 Unprocessable Entity): ${errorDetail}. Убедитесь, что параметр называется 'file: UploadFile = File(...)'.`);
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();

      // Normalize any FastAPI response format (camelCase or snake_case)
      const documentId = data.document_id || data.documentId || data.doc_id || data.id || `doc_${Date.now()}`;
      const filename = data.filename || data.file_name || data.name || file.name;
      const size = typeof data.size === 'number' ? data.size : file.size;
      const chunksCount = data.chunks_count ?? data.chunksCount ?? data.chunks ?? data.num_chunks ?? 8;
      const pagesCount = data.pages_count ?? data.pagesCount ?? data.pages ?? data.total_pages ?? 1;

      return {
        status: 'success',
        documentId: String(documentId),
        filename: String(filename),
        size: Number(size),
        chunksCount: Number(chunksCount),
        pagesCount: Number(pagesCount),
        message: data.message || 'Документ успешно загружен'
      };
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error(
          `Не удалось отправить запрос на ${baseUrl}/upload. Возможные причины: ` +
          `1) Сервер выключен; ` +
          `2) Заблокировано CORS (добавьте CORSMiddleware в FastAPI); ` +
          `3) Использован внутренний URL Colab вместо ngrok/cloudflared.`
        );
      }
      throw err;
    }
  },

  async query(
    question: string,
    documentId: string,
    isMock: boolean
  ): Promise<QueryResponse> {
    const trimmed = question.trim();
    if (!trimmed) {
      throw new Error('Вопрос не может быть пустым');
    }

    if (isMock) {
      return this._mockQuery(trimmed, documentId);
    }

    const rawBaseUrl = this.getBaseUrl();
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    const startTime = performance.now();

    try {
      const response = await fetch(`${baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          question: trimmed,
          document_id: documentId,
          // also provide alias if backend uses 'documentId'
          documentId: documentId
        })
      });

      if (!response.ok) {
        let errorDetail = `Ошибка при выполнении запроса (${response.status})`;
        try {
          const errData = await response.json();
          if (typeof errData.detail === 'string') {
            errorDetail = errData.detail;
          } else if (Array.isArray(errData.detail)) {
            errorDetail = errData.detail.map((e: any) => `${e.loc?.join('.')}: ${e.msg}`).join(', ');
          } else if (errData.message) {
            errorDetail = errData.message;
          }
        } catch {
          const text = await response.text().catch(() => '');
          if (text) {
            errorDetail = `Сервер вернул ${response.status}: ${text.slice(0, 150)}`;
          }
        }
        if (response.status === 404) {
          throw new Error(`Эндпоинт POST ${baseUrl}/query не найден (404). Проверьте @app.post("/query") в FastAPI.`);
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      const queryTimeMs = Math.round(performance.now() - startTime);

      const rawAnswer = data.answer || data.response || data.result || data.text || '';
      const rawSources = Array.isArray(data.sources) ? data.sources : [];

      // Normalize sources format
      const normalizedSources = rawSources.map((s: any, idx: number) => ({
        document: s.document || s.document_name || s.file_name || s.filename || 'Документ',
        page: Number(s.page ?? s.page_num ?? s.page_number ?? 1),
        chunk: Number(s.chunk ?? s.chunk_id ?? s.chunk_index ?? (idx + 1)),
        snippet: s.snippet || s.text || s.content || s.chunk_text || '',
        relevance: typeof s.relevance === 'number' 
          ? s.relevance 
          : typeof s.score === 'number' 
          ? s.score 
          : typeof s.similarity === 'number' 
          ? s.similarity 
          : undefined
      }));

      const isNotFound = 
        !rawAnswer || 
        rawAnswer.trim() === '' || 
        rawAnswer.includes(STRICT_NOT_FOUND_MESSAGE) || 
        (normalizedSources.length === 0 && !rawAnswer);

      return {
        answer: isNotFound ? STRICT_NOT_FOUND_MESSAGE : rawAnswer,
        sources: normalizedSources,
        notFound: isNotFound,
        queryTimeMs
      };
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error(
          `Не удалось отправить вопрос на ${baseUrl}/query. Проверьте соединение с сервером и настройки CORS.`
        );
      }
      throw err;
    }
  },

  // --- MOCK IMPLEMENTATIONS ---
  async _mockUpload(
    file: File,
    onProgress?: (percent: number, stepText: string) => void
  ): Promise<UploadResponse> {
    const steps = [
      { p: 25, text: 'Загрузка файла...' },
      { p: 55, text: 'Извлечение текстового содержимого...' },
      { p: 85, text: 'Сегментация на фрагменты (chunks) и векторизация...' },
      { p: 100, text: 'Индексирование завершено. Документ готов.' }
    ];

    for (const step of steps) {
      onProgress?.(step.p, step.text);
      await new Promise(r => setTimeout(r, 450));
    }

    // Check if matching preset
    const preset = SAMPLE_DOCUMENTS.find(
      d => d.info.name.toLowerCase() === file.name.toLowerCase()
    );

    let chunks = 16;
    let pages = 6;
    let sampleQuestions = [
      'Каковы основные условия данного документа?',
      'Какие обязанности сторон зафиксированы?',
      'Какой порядок расторжения предусмотрен?'
    ];

    if (preset) {
      chunks = preset.info.chunksCount;
      pages = preset.info.pagesCount;
      sampleQuestions = preset.info.sampleQuestions || sampleQuestions;
    } else {
      // Estimate based on size
      chunks = Math.max(4, Math.round(file.size / 18000));
      pages = Math.max(1, Math.round(chunks / 2.5));
    }

    // Try reading text if text/plain
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      try {
        currentMockCustomText = await file.text();
      } catch {
        currentMockCustomText = null;
      }
    } else {
      currentMockCustomText = null;
    }

    const docId = `doc_${Date.now()}`;
    currentMockDoc = {
      id: docId,
      name: file.name,
      size: file.size,
      type: file.type,
      uploadDate: new Date(),
      chunksCount: chunks,
      pagesCount: pages,
      sampleQuestions
    };

    return {
      status: 'success',
      documentId: docId,
      filename: file.name,
      size: file.size,
      chunksCount: chunks,
      pagesCount: pages,
      message: 'Документ успешно загружен и векторизован.'
    };
  },

  async _mockQuery(question: string, _documentId: string): Promise<QueryResponse> {
    const startTime = performance.now();
    // Simulate RAG vector search + LLM latency
    await new Promise(r => setTimeout(r, 900));

    const qLower = question.toLowerCase().trim();
    const docName = currentMockDoc?.name || 'document.pdf';

    // 1. Check if we match a preset
    const preset = SAMPLE_DOCUMENTS.find(
      p => p.info.name.toLowerCase() === docName.toLowerCase()
    );

    if (preset) {
      for (const pair of preset.qaPairs) {
        const matches = pair.keywords.some(kw => qLower.includes(kw.toLowerCase()));
        if (matches) {
          const queryTimeMs = Math.round(performance.now() - startTime);
          return {
            answer: pair.answer,
            sources: pair.sources,
            notFound: false,
            queryTimeMs
          };
        }
      }
    }

    // 2. If custom uploaded .txt content exists, perform keyword search on real text
    if (currentMockCustomText) {
      const sentences = currentMockCustomText.split(/(?<=[.?!])\s+/);
      const matchedSentences = sentences.filter(s => {
        const words = qLower.split(/\s+/).filter(w => w.length > 3);
        return words.some(w => s.toLowerCase().includes(w));
      });

      if (matchedSentences.length > 0) {
        const snippet = matchedSentences.slice(0, 3).join(' ');
        const queryTimeMs = Math.round(performance.now() - startTime);
        return {
          answer: `На основании фрагмента текста документа:\n\n${snippet}`,
          sources: [
            {
              document: docName,
              page: 1,
              chunk: 3,
              snippet: snippet.length > 200 ? snippet.slice(0, 200) + '...' : snippet,
              relevance: 0.91
            }
          ],
          notFound: false,
          queryTimeMs
        };
      }
    }

    // 3. STRICT RAG FALLBACK RULE:
    // If the information is not present in the document, never hallucinate!
    const queryTimeMs = Math.round(performance.now() - startTime);
    return {
      answer: STRICT_NOT_FOUND_MESSAGE,
      sources: [],
      notFound: true,
      queryTimeMs
    };
  }
};
