import React from 'react';
import { BookOpen, FileText, Hash, Bookmark, Percent } from 'lucide-react';
import { DocumentSource } from '../types';

interface SourcesSectionProps {
  sources: DocumentSource[];
  isNotFound?: boolean;
}

export const SourcesSection: React.FC<SourcesSectionProps> = ({
  sources,
  isNotFound
}) => {
  if (isNotFound || !sources || sources.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-2xs">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Источники</h3>
            <p className="text-xs text-slate-500">
              Фрагменты документа, использованные для формирования ответа ({sources.length})
            </p>
          </div>
        </div>
      </div>

      {/* Sources Grid / List */}
      <div className="space-y-3">
        {sources.map((src, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition-all hover:border-indigo-200 space-y-3"
          >
            {/* Header info: Document, Page, Chunk */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Document name */}
                <div className="flex items-center gap-1.5 font-medium text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                  <span className="text-slate-500 font-normal">Документ:</span>
                  <span className="font-bold">{src.document}</span>
                </div>

                {/* Page */}
                <div className="flex items-center gap-1 text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-mono shadow-2xs">
                  <Bookmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 font-normal font-sans">Стр:</span>
                  <span className="font-bold text-slate-900">{src.page}</span>
                </div>

                {/* Chunk / Fragment */}
                <div className="flex items-center gap-1 text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-mono shadow-2xs">
                  <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 font-normal font-sans">Блок:</span>
                  <span className="font-bold text-slate-900">{src.chunk}</span>
                </div>
              </div>

              {/* Relevance score */}
              {src.relevance && (
                <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-mono shadow-2xs">
                  <Percent className="w-3 h-3 text-emerald-600" />
                  <span>Релевантность {Math.round(src.relevance * 100)}%</span>
                </div>
              )}
            </div>

            {/* Snippet quote */}
            {src.snippet && (
              <div className="text-xs text-slate-800 bg-white p-3.5 rounded-xl border border-slate-200 font-mono leading-relaxed shadow-2xs">
                <span className="text-slate-500 select-none mr-1.5 font-sans italic text-[11px] font-medium">
                  Цитата из документа:
                </span>
                «{src.snippet}»
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};
