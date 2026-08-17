import React, { useRef, useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  FileCode, 
  FileType, 
  Layers, 
  BookOpen, 
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { DocumentState } from '../types';
import { formatFileSize, validateDocumentFile } from '../services/api';
import { SAMPLE_DOCUMENTS } from '../data/sampleDocs';

interface DocumentUploadProps {
  docState: DocumentState;
  onSelectFile: (file: File) => void;
  onUpload: () => void;
  onClear: () => void;
  onSelectPreset: (presetId: string) => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  docState,
  onSelectFile,
  onUpload,
  onClear,
  onSelectPreset
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setLocalError(validation.error || 'Ошибка валидации файла');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    onSelectFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setLocalError(null);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateDocumentFile(file);
    if (!validation.valid) {
      setLocalError(validation.error || 'Ошибка валидации файла');
      return;
    }

    onSelectFile(file);
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const isProcessing = docState.status === 'uploading' || docState.status === 'parsing' || docState.status === 'embedding';
  const isReady = docState.status === 'ready';
  const hasFile = !!docState.file;

  return (
    <section className="bg-white rounded-2xl border-2 border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center justify-center text-xs font-mono font-bold">
              01
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Загрузка документа в базу знаний
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-8">
            Поддерживаются форматы PDF, TXT, DOCX до 1 МБ (1 документ)
          </p>
        </div>

        {/* Quick Presets Menu */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="micro-label mr-1 flex items-center gap-1 text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Примеры:
          </span>
          {SAMPLE_DOCUMENTS.map(doc => (
            <button
              key={doc.info.id}
              type="button"
              onClick={() => {
                setLocalError(null);
                onSelectPreset(doc.info.id);
              }}
              disabled={isProcessing}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-950 font-medium transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              {doc.info.name}
            </button>
          ))}
        </div>
      </div>

      {/* Error alert if any */}
      {(localError || docState.errorMessage) && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-rose-900">Ошибка файла:</span>
            <span>{localError || docState.errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocalError(null)}
            className="text-xs text-rose-700 hover:text-rose-900 font-semibold ml-2 cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload-input"
      />

      {/* Drag and Drop Zone or Active File Card */}
      {!hasFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
              : 'border-slate-200 hover:border-indigo-400 bg-slate-50/50 hover:bg-indigo-50/20'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div className="space-y-1 max-w-md">
            <p className="text-sm font-semibold text-slate-800">
              Перетащите документ сюда или{' '}
              <span className="text-indigo-600 hover:text-indigo-700 underline underline-offset-2">
                выберите файл на диске
              </span>
            </p>
            <p className="text-xs text-slate-500">
              PDF, TXT или DOCX • Строго до 1.0 МБ
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-white text-slate-600 border border-slate-200 shadow-2xs">
              .PDF
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-white text-slate-600 border border-slate-200 shadow-2xs">
              .TXT
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-white text-slate-600 border border-slate-200 shadow-2xs">
              .DOCX
            </span>
          </div>
        </div>
      ) : (
        /* Selected / Processing / Ready File Card */
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                isReady 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : isProcessing
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-white text-slate-600 border-slate-200'
              }`}>
                {docState.file?.name.endsWith('.pdf') ? (
                  <FileText className="w-6 h-6" />
                ) : docState.file?.name.endsWith('.txt') ? (
                  <FileCode className="w-6 h-6" />
                ) : (
                  <FileType className="w-6 h-6" />
                )}
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                    {docState.file?.name}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-white text-slate-600 border border-slate-200 shadow-2xs">
                    {formatFileSize(docState.file?.size || 0)}
                  </span>
                </div>

                {/* Status indicator badge */}
                <div className="flex items-center gap-2 text-xs">
                  {docState.status === 'idle' || docState.status === 'error' ? (
                    <span className="text-slate-500 flex items-center gap-1.5">
                      <span className="status-dot bg-slate-400" />
                      Файл выбран, готов к отправке
                    </span>
                  ) : isProcessing ? (
                    <span className="text-indigo-600 font-semibold flex items-center gap-1.5">
                      <span className="status-dot pulse-indigo" />
                      Обработка документа...
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                      <span className="status-dot pulse-green" />
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Документ готов к поиску
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions: change or remove */}
            {!isProcessing && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="text-xs px-3 py-1.5 rounded-lg text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                >
                  Заменить
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Удалить файл"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Processing Progress Bar */}
          {isProcessing && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>
                  {docState.status === 'uploading' && 'Загрузка файла на сервер...'}
                  {docState.status === 'parsing' && 'Извлечение текстового слоя...'}
                  {docState.status === 'embedding' && 'Векторизация и построение индекса...'}
                </span>
                <span className="font-mono font-bold text-slate-900">{docState.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${docState.progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Document Ready Metadata Stats */}
          {isReady && docState.info && (
            <div className="pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div className="micro-label">Фрагменты</div>
                  <div className="font-bold text-slate-900 font-mono">{docState.info.chunksCount} блоков</div>
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-indigo-600 shrink-0" />
                <div>
                  <div className="micro-label">Страницы</div>
                  <div className="font-bold text-slate-900 font-mono">{docState.info.pagesCount} стр.</div>
                </div>
              </div>
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center gap-2.5 col-span-2 sm:col-span-1">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="micro-label">Индекс</div>
                  <div className="font-bold text-emerald-700 flex items-center gap-1.5">
                    <span className="status-dot pulse-green" />
                    Активен
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action button: Загрузить документ */}
          {!isReady && !isProcessing && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onUpload}
                id="btn-upload-document"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <span>Загрузить документ</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
