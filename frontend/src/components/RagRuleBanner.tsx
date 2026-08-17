import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const RagRuleBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 text-slate-800 rounded-2xl p-4 sm:p-5 border border-indigo-100 shadow-xs relative overflow-hidden">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-indigo-100/70 border border-indigo-200/80 flex items-center justify-center shrink-0 mt-0.5 text-indigo-700 shadow-2xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="micro-label text-indigo-700">
              Главное правило RAG
            </span>
            <span className="text-[11px] text-slate-400 font-medium">• Исключение вымысла и галлюцинаций</span>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed font-normal">
            «Ответ формируется исключительно на основании информации из загруженного документа. Если данных нет — система ответит:{' '}
            <span className="text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
              «Информация не найдена в загруженном документе.»
            </span>»
          </p>
        </div>
      </div>
    </div>
  );
};
