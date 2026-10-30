import React from 'react';
import { X, Server, Database, Sparkles, CheckCircle, FileCode } from 'lucide-react';
import { SystemStatus } from '../types';

interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: SystemStatus | null;
}

export const SystemModal: React.FC<SystemModalProps> = ({ isOpen, onClose, status }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 shrink-0 ring-1 ring-sky-300/80 shadow-xs">
              <img
                src="/assets/aistudio/Futuristic_Glass_Cube_with_Glowing_Core_fece868d.png"
                alt="BugMirror Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">System Architecture &amp; Runtime Transparency</h3>
              <p className="text-xs text-slate-500">Live backend telemetry and reference implementations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-sm">
          {/* Active Runtime Engine */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" /> Active Application Server
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ACTIVE
              </span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              {status?.runtime.activeEngine || 'Node.js 22 LTS / Express / TypeScript reactive concurrency engine'}
            </p>
          </div>

          {/* Java Spring Boot Reference Architecture */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-600" /> Java 21 / Spring Boot 3 Reference Backend
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                SOURCE INCLUDED
              </span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              {status?.runtime.javaSupport.explanation}
            </p>
            <div className="bg-white p-2.5 rounded-lg font-mono text-xs text-slate-800 border border-slate-200 flex items-center justify-between">
              <span className="font-semibold text-blue-700">/backend-java-reference/src/</span>
              <span className="text-slate-500 text-[11px]">JUnit 5 + Mockito 20-thread test included</span>
            </div>
          </div>

          {/* Database Persistence */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 flex items-center gap-2">
                <Database className="w-4 h-4 text-slate-500" /> Database &amp; Ledger Isolation
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded font-mono font-bold bg-slate-200 text-slate-700 border border-slate-300">
                ACID SIMULATOR
              </span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              {status?.runtime.database.active}
            </p>
            <p className="text-slate-500 text-[11px]">
              {status?.runtime.database.fallbackReason}
            </p>
          </div>

          {/* AI Bug Detective Status */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> AI Diagnostic Engine
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold border ${
                status?.runtime.aiProvider.configured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {status?.runtime.aiProvider.configured ? 'GEMINI 3.8 FLASH' : 'RULE-BASED HEURISTIC'}
              </span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Provider: <span className="text-slate-900 font-mono font-semibold">{status?.runtime.aiProvider.provider}</span>.
              {status?.runtime.aiProvider.configured
                ? ' Generates contextual hypotheses and code patches.'
                : ' Fully operational without external API keys. Demarcates empirical evidence from hypotheses.'}
            </p>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
