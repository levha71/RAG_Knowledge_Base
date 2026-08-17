export interface DocumentSource {
  document: string;
  page: number;
  chunk: number;
  snippet?: string;
  relevance?: number;
}

export interface QueryResponse {
  answer: string;
  sources: DocumentSource[];
  notFound?: boolean;
  queryTimeMs?: number;
}

export interface UploadResponse {
  status: 'success' | 'error';
  documentId: string;
  filename: string;
  size: number;
  chunksCount: number;
  pagesCount: number;
  message?: string;
}

export type ProcessingStep = 'idle' | 'uploading' | 'parsing' | 'embedding' | 'ready' | 'error';

export interface DocumentInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  chunksCount: number;
  pagesCount: number;
  rawText?: string;
  sampleQuestions?: string[];
}

export interface DocumentState {
  file: File | null;
  info: DocumentInfo | null;
  status: ProcessingStep;
  progress: number;
  errorMessage: string | null;
}

export interface QueryState {
  question: string;
  status: 'idle' | 'loading' | 'success' | 'not_found' | 'error';
  response: QueryResponse | null;
  errorMessage: string | null;
  queryHistory: Array<{
    question: string;
    response: QueryResponse;
    timestamp: Date;
  }>;
}

export interface BackendConfig {
  apiBaseUrl: string;
  isMockMode: boolean;
  isConnected: boolean | null;
  lastHealthCheck: Date | null;
}
