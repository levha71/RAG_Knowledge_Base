import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { RagRuleBanner } from './components/RagRuleBanner';
import { DocumentUpload } from './components/DocumentUpload';
import { QuerySection } from './components/QuerySection';
import { AnswerCard } from './components/AnswerCard';
import { SourcesSection } from './components/SourcesSection';
import { BackendSettingsModal } from './components/BackendSettingsModal';
import { DocumentState, QueryState, BackendConfig } from './types';
import { ApiService, DEFAULT_API_BASE_URL } from './services/api';
import { SAMPLE_DOCUMENTS } from './data/sampleDocs';

export default function App() {
  // Backend and environment configuration
  const [backendConfig, setBackendConfig] = useState<BackendConfig>({
    apiBaseUrl: ApiService.getBaseUrl(),
    isMockMode: false, // Default to Mock Mode as requested for frontend prototype
    isConnected: null,
    lastHealthCheck: null
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Document State
  const [docState, setDocState] = useState<DocumentState>({
    file: null,
    info: null,
    status: 'idle',
    progress: 0,
    errorMessage: null
  });

  // Query State
  const [queryState, setQueryState] = useState<QueryState>({
    question: '',
    status: 'idle',
    response: null,
    errorMessage: null,
    queryHistory: []
  });

  // On mount, auto-load first sample preset so the user sees a full working demo immediately!


  // Handlers for Document
  const handleSelectFile = (file: File) => {
    setDocState({
      file,
      info: null,
      status: 'idle',
      progress: 0,
      errorMessage: null
    });
    setQueryState(prev => ({
      ...prev,
      response: null,
      status: 'idle',
      errorMessage: null
    }));
  };

  const handleUpload = async () => {
    if (!docState.file) return;

    setDocState(prev => ({
      ...prev,
      status: 'uploading',
      progress: 10,
      errorMessage: null
    }));

    try {
      const res = await ApiService.upload(
        docState.file,
        backendConfig.isMockMode,
        (p, stepText) => {
          let stepStatus: DocumentState['status'] = 'uploading';
          if (p >= 80) stepStatus = 'embedding';
          else if (p >= 50) stepStatus = 'parsing';

          setDocState(prev => ({
            ...prev,
            progress: p,
            status: stepStatus
          }));
        }
      );

      const matchedPreset = SAMPLE_DOCUMENTS.find(
        d => d.info.name.toLowerCase() === docState.file?.name.toLowerCase()
      );

      setDocState({
        file: docState.file,
        info: {
          id: res.documentId,
          name: res.filename,
          size: res.size,
          type: docState.file.type,
          uploadDate: new Date(),
          chunksCount: res.chunksCount,
          pagesCount: res.pagesCount,
          sampleQuestions: matchedPreset?.info.sampleQuestions || [
            'Каковы основные положения данного документа?',
            'Каковы права и обязанности сторон?',
            'Какой порядок согласования действий?'
          ]
        },
        status: 'ready',
        progress: 100,
        errorMessage: null
      });
    } catch (err: any) {
      setDocState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Ошибка загрузки документа'
      }));
    }
  };

  const handleClearFile = () => {
    setDocState({
      file: null,
      info: null,
      status: 'idle',
      progress: 0,
      errorMessage: null
    });
    setQueryState(prev => ({
      ...prev,
      question: '',
      response: null,
      status: 'idle',
      errorMessage: null
    }));
  };

  const handleSelectPreset = async (presetId: string) => {
    const preset = SAMPLE_DOCUMENTS.find(p => p.info.id === presetId);
    if (!preset) return;

    const dummyFile = new File(['[Sample content]'], preset.info.name, {
      type: preset.info.type
    });

    setDocState({
      file: dummyFile,
      info: null,
      status: 'uploading',
      progress: 20,
      errorMessage: null
    });

    setQueryState(prev => ({
      ...prev,
      question: '',
      response: null,
      status: 'idle',
      errorMessage: null
    }));

    try {
      const res = await ApiService.upload(
        dummyFile,
        backendConfig.isMockMode,
        (p) => {
          let stepStatus: DocumentState['status'] = 'uploading';
          if (p >= 80) stepStatus = 'embedding';
          else if (p >= 50) stepStatus = 'parsing';

          setDocState(prev => ({
            ...prev,
            progress: p,
            status: stepStatus
          }));
        }
      );

      setDocState({
        file: dummyFile,
        info: preset.info,
        status: 'ready',
        progress: 100,
        errorMessage: null
      });
    } catch (err: any) {
      setDocState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Ошибка загрузки пресета'
      }));
    }
  };

  // Handlers for Query
  const handleSubmitQuery = async (customQ?: string) => {
    const q = (customQ || queryState.question).trim();
    if (!q || !docState.info) return;

    setQueryState(prev => ({
      ...prev,
      question: q,
      status: 'loading',
      errorMessage: null
    }));

    try {
      const res = await ApiService.query(
        q,
        docState.info.id,
        backendConfig.isMockMode
      );

      setQueryState(prev => ({
        ...prev,
        status: res.notFound ? 'not_found' : 'success',
        response: res,
        queryHistory: [
          { question: q, response: res, timestamp: new Date() },
          ...prev.queryHistory
        ]
      }));
    } catch (err: any) {
      setQueryState(prev => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Ошибка при отправке вопроса'
      }));
    }
  };

  const handleSelectSuggestion = (suggestedQ: string) => {
    setQueryState(prev => ({ ...prev, question: suggestedQ }));
    handleSubmitQuery(suggestedQ);
  };

  const handleToggleMock = () => {
    setBackendConfig(prev => ({ ...prev, isMockMode: !prev.isMockMode }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <Header
        config={backendConfig}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleMock={handleToggleMock}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Strict RAG Rule Callout */}
        <RagRuleBanner />

        {/* Step 1: Upload and Process Document */}
        <DocumentUpload
          docState={docState}
          onSelectFile={handleSelectFile}
          onUpload={handleUpload}
          onClear={handleClearFile}
          onSelectPreset={handleSelectPreset}
        />

        {/* Step 2: Query Document Section */}
        <QuerySection
          docState={docState}
          queryState={queryState}
          onQuestionChange={(q) => setQueryState(prev => ({ ...prev, question: q }))}
          onSubmitQuery={() => handleSubmitQuery()}
          onSelectSuggestion={handleSelectSuggestion}
        />

        {/* Step 3: Answer Block */}
        <AnswerCard
          response={queryState.response}
          isLoading={queryState.status === 'loading'}
          question={queryState.question}
        />

        {/* Step 4: Sources Block */}
        {queryState.response && (
          <SourcesSection
            sources={queryState.response.sources}
            isNotFound={queryState.response.notFound}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 mt-12 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">База знаний RAG</span>
            <span>•</span>
            <span className="text-slate-600">Семантический поиск фактов по документам без вымысла</span>
          </p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="text-slate-600 hover:text-indigo-600 font-medium transition-colors cursor-pointer"
            >
              Настройки сервера
            </button>
            <span>•</span>
            <span className="font-mono text-slate-500">PDF / TXT / DOCX &le; 1 МБ</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <BackendSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={backendConfig}
        onUpdateConfig={(newConfig) => setBackendConfig(prev => ({ ...prev, ...newConfig }))}
      />
    </div>
  );
}
