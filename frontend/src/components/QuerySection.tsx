import React, { useRef } from 'react';
import { Search, Send, Sparkles, Loader2, CornerDownLeft, Lock } from 'lucide-react';
import { DocumentState, QueryState } from '../types';

interface QuerySectionProps {
  docState: DocumentState;
  queryState: QueryState;
  onQuestionChange: (q: string) => void;
  onSubmitQuery: () => void;
  onSelectSuggestion: (q: string) => void;
}

export const QuerySection: React.FC<QuerySectionProps> = ({
  docState,
  queryState,
  onQuestionChange,
  onSubmitQuery,
  onSelectSuggestion
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isDocReady = docState.status === 'ready' && !!docState.info;
  const isLoading = queryState.status === 'loading';
  const canSubmit = isDocReady && !isLoading && queryState.question.trim().length > 0;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) {
        onSubmitQuery();
      }
    }
  };

  const sampleQuestions = docState.info?.sampleQuestions || [
    'Каковы ключевые положения документа?',
    'Какой срок действия обязательств?',
    'Какова ответственность сторон?'
  ];

  return (
    <section className="bg-white rounded-2xl border-2 border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
              isDocReady 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80' 
                : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              02
            </span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Задайте вопрос по документу
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 ml-8">
            {isDocReady 
              ? `Поиск ведется по документу «${docState.info?.name}»`
              : 'Для отправки вопроса сначала загрузите и обработайте документ выше'}
          </p>
        </div>

        {!isDocReady && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            Ожидает документ
          </span>
        )}
      </div>

      {/* Query Input Container */}
      <div className="relative">
        <div className={`relative rounded-2xl border transition-all ${
          !isDocReady
            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
            : isLoading
            ? 'border-indigo-500 bg-white ring-2 ring-indigo-100'
            : 'border-slate-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 bg-white hover:border-slate-300'
        }`}>
          <div className="flex items-start p-3.5 sm:p-4 gap-3">
            <Search className={`w-5 h-5 mt-1 shrink-0 ${
              isDocReady ? 'text-indigo-600' : 'text-slate-400'
            }`} />

            <textarea
              ref={textareaRef}
              rows={2}
              disabled={!isDocReady || isLoading}
              value={queryState.question}
              onChange={(e) => onQuestionChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isDocReady
                  ? "Например: «Какой срок действия договора?» или «Каков график работы?»..."
                  : "Сначала загрузите документ выше для разблокировки поиска..."
              }
              className="w-full bg-transparent border-0 resize-none text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden disabled:cursor-not-allowed leading-relaxed font-normal"
            />
          </div>

          {/* Footer inside input box */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 rounded-b-2xl">
            <span className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5 font-mono">
              <CornerDownLeft className="w-3 h-3 text-slate-400" />
              <span>Нажмите <kbd className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px] font-semibold text-slate-700 shadow-2xs">Enter</kbd> для поиска</span>
            </span>

            <div className="flex items-center gap-2 ml-auto">
              {queryState.question && (
                <button
                  type="button"
                  onClick={() => onQuestionChange('')}
                  disabled={isLoading}
                  className="text-xs text-slate-500 hover:text-slate-800 px-2 py-1 transition-colors cursor-pointer font-medium"
                >
                  Очистить
                </button>
              )}

              <button
                type="button"
                id="btn-submit-query"
                onClick={onSubmitQuery}
                disabled={!canSubmit}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                  canSubmit
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Поиск фактов...</span>
                  </>
                ) : (
                  <>
                    <span>Задать вопрос</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Questions */}
      {isDocReady && sampleQuestions.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className="micro-label text-slate-500">Рекомендуемые вопросы:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectSuggestion(q)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-950 transition-all text-left cursor-pointer disabled:opacity-50 shadow-2xs font-medium"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
