import React, { useState } from 'react';
import { 
  X, 
  Server, 
  Activity, 
  Code, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ToggleLeft, 
  ToggleRight,
  Sparkles
} from 'lucide-react';
import { BackendConfig } from '../types';
import { ApiService } from '../services/api';

interface BackendSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BackendConfig;
  onUpdateConfig: (newConfig: Partial<BackendConfig>) => void;
}

export const BackendSettingsModal: React.FC<BackendSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig
}) => {
  const [urlInput, setUrlInput] = useState(config.apiBaseUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await ApiService.checkHealth(urlInput);
      if (result.ok) {
        setTestResult({
          success: true,
          message: 'Подключение успешно! Сервер активен и отвечает со статусом 200 OK.'
        });
        onUpdateConfig({ isConnected: true, apiBaseUrl: urlInput, lastHealthCheck: new Date() });
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Сервер недоступен по указанному адресу. Проверьте, запущен ли FastAPI.'
        });
        onUpdateConfig({ isConnected: false, apiBaseUrl: urlInput, lastHealthCheck: new Date() });
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Ошибка при выполнении сетевого запроса к эндпоинту /health.'
      });
      onUpdateConfig({ isConnected: false, apiBaseUrl: urlInput, lastHealthCheck: new Date() });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    ApiService.setBaseUrl(urlInput);
    onUpdateConfig({ apiBaseUrl: urlInput });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-2xs">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Интеграция с сервером (FastAPI)
              </h3>
              <p className="text-xs text-slate-500">
                Конфигурация API и переключение режима работы
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Mode Switcher */}
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Демонстрационный режим (Mock Mode)
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Автономный режим с эмуляцией парсинга, индексации и поиска по фрагментам
                </p>
              </div>
              <button
                type="button"
                onClick={() => onUpdateConfig({ isMockMode: !config.isMockMode })}
                className="cursor-pointer"
              >
                {config.isMockMode ? (
                  <ToggleRight className="w-9 h-9 text-indigo-600" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          {/* URL Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Базовый адрес API (FastAPI Сервер)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                {isTesting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>Проверить статус (/health)</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                testResult.success 
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>

          {/* Google Colab Instructions Box */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2 text-xs">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>Запуск бекенда в Google Colab</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Внутренние адреса <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-mono">*.prod.colab.dev</code> защищены авторизацией Google и блокируют запросы браузера (CORS). Для связи с фронтендом пробросьте порт через <strong>pyngrok</strong> или <strong>cloudflared</strong>:
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-amber-200 font-mono text-[11px] text-slate-800 space-y-1">
              <div className="text-slate-500 font-sans font-semibold">Вставьте в ячейку Colab перед uvicorn:</div>
              <div className="text-indigo-700">!pip install pyngrok</div>
              <div className="text-slate-800">from pyngrok import ngrok</div>
              <div className="text-slate-800">public_url = ngrok.connect(8000)</div>
              <div className="text-emerald-700">print("Публичный URL:", public_url.public_url)</div>
            </div>
          </div>

          {/* Prepared API Contract Info */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-600" />
                <span>Эндпоинты FastAPI:</span>
              </div>
              <span className="text-[11px] text-slate-500 font-normal">Параметр файла: <code className="bg-slate-100 px-1 py-0.5 rounded text-indigo-700 font-mono font-semibold">file</code></span>
            </div>
            <div className="space-y-2 text-xs font-mono bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-emerald-700 font-medium">
                <span className="font-bold">POST /upload</span>
                <span className="text-[10px] text-slate-500 font-sans">FormData: file: UploadFile</span>
              </div>
              <div className="flex items-center justify-between text-indigo-700 font-medium pt-1.5 border-t border-slate-200">
                <span className="font-bold">POST /query</span>
                <span className="text-[10px] text-slate-500 font-sans">JSON: {`{"question": "...", "document_id": "..."}`}</span>
              </div>
              <div className="flex items-center justify-between text-amber-700 font-medium pt-1.5 border-t border-slate-200">
                <span className="font-bold">GET /health</span>
                <span className="text-[10px] text-slate-500 font-sans">Status 200 OK</span>
              </div>
            </div>

            {/* FastAPI minimal boilerplate snippet */}
            <details className="text-xs bg-slate-50 rounded-xl border border-slate-200 p-3 group">
              <summary className="font-semibold text-slate-700 cursor-pointer list-none flex items-center justify-between">
                <span>🐍 Пример кода FastAPI роутов</span>
                <span className="text-[11px] text-indigo-600 font-normal group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <pre className="mt-2.5 p-3 rounded-lg bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed">
{`@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    contents = await file.read()
    # ваш код парсинга и векторизации
    return {
        "status": "success",
        "document_id": "doc_1",
        "filename": file.filename,
        "chunks_count": 10,
        "pages_count": 2
    }

@app.post("/query")
async def query_rag(data: dict):
    q = data.get("question", "")
    # ваш RAG поиск
    return {
        "answer": "Найденный ответ...",
        "sources": [
            {"document": "doc.pdf", "page": 1, "chunk": 2, "snippet": "...", "relevance": 0.95}
        ]
    }`}
              </pre>
            </details>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            Сохранить настройки
          </button>
        </div>
      </div>
    </div>
  );
};
