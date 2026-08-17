import React, { useState } from 'react';
import { 
  Check, 
  Copy, 
  HelpCircle, 
  ShieldAlert, 
  Clock, 
  FileCheck2
} from 'lucide-react';
import { QueryResponse } from '../types';
import { STRICT_NOT_FOUND_MESSAGE } from '../data/sampleDocs';

interface AnswerCardProps {
  response: QueryResponse | null;
  isLoading: boolean;
  question: string;
}

export const AnswerCard: React.FC<AnswerCardProps> = ({
  response,
  isLoading,
  question
}) => {
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-slate-200" />
            <div className="h-4 w-28 bg-slate-200 rounded" />
          </div>
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </div>
        <div className="space-y-2.5">
          <div className="h-4 bg-slate-200 rounded w-5/6" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-4/6" />
        </div>
      </section>
    );
  }

  if (!response) {
    return null;
  }

  const isNotFound = response.notFound || response.answer.includes(STRICT_NOT_FOUND_MESSAGE);

  const handleCopy = () => {
    navigator.clipboard.writeText(response.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={`rounded-2xl border p-5 sm:p-6 shadow-xs transition-all ${
      isNotFound
        ? 'bg-amber-50/70 border-amber-200'
        : 'bg-white border-slate-200/90'
    }`}>
      {/* Header of Answer block */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            isNotFound 
              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
              : 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs'
          }`}>
            {isNotFound ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <FileCheck2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {isNotFound ? 'Результат поиска' : 'Ответ'}
            </h3>
            <p className="text-xs text-slate-500">
              {isNotFound 
                ? 'Строгая проверка по загруженному источнику' 
                : 'Сформирован исключительно по фрагментам документа'}
            </p>
          </div>
        </div>

        {/* Copy button & metadata */}
        <div className="flex items-center gap-2">
          {response.queryTimeMs && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-500 font-mono">
              <Clock className="w-3.5 h-3.5" />
              {response.queryTimeMs} мс
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            id="btn-copy-answer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-2xs"
            title="Скопировать текст ответа"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Скопировано</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Копировать</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Answer Body */}
      <div className="space-y-3">
        {question && (
          <div className="text-xs text-slate-500 font-medium pb-1 flex items-center gap-1.5 flex-wrap">
            <span className="micro-label text-slate-400">Вопрос:</span>
            <span className="text-slate-800 italic font-semibold">«{question}»</span>
          </div>
        )}

        {isNotFound ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/90 space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{STRICT_NOT_FOUND_MESSAGE}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pl-7 font-normal">
              RAG-система проверила все проиндексированные фрагменты документа, но не обнаружила релевантной информации по вашему вопросу. В соответствии с регламентом точного поиска, генерация непроверенных фактов или предположений строго запрещена.
            </p>
          </div>
        ) : (
          <div className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line bg-slate-50/70 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
            {response.answer}
          </div>
        )}
      </div>
    </section>
  );
};
