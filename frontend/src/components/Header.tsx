import React from 'react';
import { Database, Settings, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { BackendConfig } from '../types';

interface HeaderProps {
  config: BackendConfig;
  onOpenSettings: () => void;
  onToggleMock: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  onOpenSettings,
  onToggleMock
}) => {
  return (
    <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-bold text-slate-900 text-lg tracking-tight flex items-center gap-1.5">
                <span>RAG</span>
                <span className="font-serif italic font-normal text-indigo-600 tracking-normal">
                  База знаний
                </span>
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Семантический поиск точных фактов по загруженным документам
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Mock Mode / Backend Badge */}
          <button
            type="button"
            onClick={onToggleMock}
            title={config.isMockMode ? "Нажмите для переключения на внешний сервер FastAPI" : "Нажмите для перехода в демо-режим"}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer shadow-xs ${
              config.isMockMode
                ? 'bg-amber-50/90 border-amber-200/90 text-amber-800 hover:bg-amber-100'
                : config.isConnected
                ? 'bg-emerald-50/90 border-emerald-200/90 text-emerald-800 hover:bg-emerald-100'
                : 'bg-rose-50/90 border-rose-200/90 text-rose-800 hover:bg-rose-100'
            }`}
          >
            {config.isMockMode ? (
              <>
                <span className="status-dot pulse-amber" />
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-medium">Демо-режим (Mock)</span>
              </>
            ) : config.isConnected ? (
              <>
                <span className="status-dot pulse-green" />
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline text-slate-600 font-normal">Сервер:</span>
                <span className="font-semibold text-emerald-700">Подключен</span>
              </>
            ) : (
              <>
                <span className="status-dot bg-rose-500" />
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden md:inline text-slate-600 font-normal">Сервер:</span>
                <span className="font-semibold text-rose-700">Недоступен</span>
              </>
            )}
          </button>

          {/* API Settings Button */}
          <button
            type="button"
            onClick={onOpenSettings}
            id="btn-open-settings"
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer shadow-xs"
            title="Настройки подключения и сервера"
            aria-label="Настройки подключения и сервера"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
