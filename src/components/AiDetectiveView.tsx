import React, { useState } from 'react';
import {
  Terminal,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  FileText,
  Activity,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { TestRun } from '../types';

interface AiDetectiveViewProps {
  currentRun: TestRun | null;
  allRuns: TestRun[];
  onSelectRun: (run: TestRun) => void;
  onNavigate: (tab: any) => void;
}

export const AiDetectiveView: React.FC<AiDetectiveViewProps> = ({
  currentRun,
  allRuns,
  onSelectRun,
  onNavigate,
}) => {
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [copiedJira, setCopiedJira] = useState<boolean>(false);
  const [copiedFix, setCopiedFix] = useState<boolean>(false);

  const [analysis, setAnalysis] = useState<any | null>(currentRun?.aiAnalysis || null);

  const handleRunAnalysis = async () => {
    if (!currentRun) return;
    setAnalyzing(true);
    try {
      const result = await api.analyzeRun(currentRun.id, userPrompt);
      setAnalysis(result);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string, type: 'jira' | 'fix') => {
    navigator.clipboard.writeText(text);
    if (type === 'jira') {
      setCopiedJira(true);
      setTimeout(() => setCopiedJira(false), 2000);
    } else {
      setCopiedFix(true);
      setTimeout(() => setCopiedFix(false), 2000);
    }
  };

  if (!currentRun) {
    return (
      <div className="p-12 text-center rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-700 flex items-center justify-center mx-auto">
          <Terminal className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Select a Run for Root Cause Analysis</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Choose a past test execution or trigger a race condition in the Concurrency Lab to perform automated root cause analysis.
        </p>
        <button
          onClick={() => onNavigate('concurrency')}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-md shadow-xs transition"
        >
          Go to Concurrency Lab
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="text-sky-700 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Root Cause Detective
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Telemetry &amp; Log Analysis</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Root Cause: {currentRun.scenarioName}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-600">
            <span>Run: <strong className="text-slate-900 font-semibold">{currentRun.id}</strong></span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Outcome: <strong className={currentRun.status === 'DEFECT_DETECTED' ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>{currentRun.status}</strong></span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Stock: <strong className="text-slate-900">{currentRun.initialStock} → {currentRun.finalStock}</strong></span>
          </div>
        </div>

        {/* Run Selector */}
        <div className="flex items-center gap-2">
          <select
            value={currentRun.id}
            onChange={(e) => {
              const run = allRuns.find((r) => r.id === e.target.value);
              if (run) {
                onSelectRun(run);
                setAnalysis(run.aiAnalysis || null);
              }
            }}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-md text-xs text-slate-800 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
          >
            {allRuns.map((r) => (
              <option key={r.id} value={r.id}>
                {r.status === 'DEFECT_DETECTED' ? '⚠️ ' : '✓ '}
                {r.scenarioName.slice(0, 36)} ({r.mode})
              </option>
            ))}
          </select>

          <button
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-50 shrink-0"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>{analyzing ? 'Analyzing Logs...' : 'Re-Analyze'}</span>
          </button>
        </div>
      </div>

      {/* MODEL TRANSPARENCY NOTICE */}
      <div className="p-3.5 rounded-lg bg-sky-50/70 border border-sky-200/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-sky-900 font-medium">Active Intelligence Engine:</span>
          <span className="font-mono font-bold text-slate-900">
            {analysis?.modelUsed || 'Rule-Based Concurrency Detective & Heuristic Classifier'}
          </span>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
            analysis?.isAiGenerated
              ? 'bg-sky-100 text-sky-800 border-sky-300'
              : 'bg-emerald-100 text-emerald-800 border-emerald-300'
          }`}
        >
          {analysis?.isAiGenerated ? 'LLM INFERENCE (GEMINI)' : 'DETERMINISTIC HEURISTIC'}
        </span>
      </div>

      {/* ANALYSIS RESULTS BODY */}
      {analysis ? (
        <div className="space-y-6">
          {/* Root Cause Banner */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-sky-700 uppercase tracking-wide">
                Identified Root Cause
              </span>
              <span
                className={`text-[10px] font-mono px-2.5 py-0.5 rounded font-bold border ${
                  analysis.severity === 'CRITICAL'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                SEVERITY: {analysis.severity}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">{analysis.rootCause}</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EMPIRICAL EVIDENCE OBSERVED (FACTS) */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-sm text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1. Empirical Evidence (Observed Facts)
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Verified Telemetry</span>
              </div>
              <p className="text-slate-600 text-xs">
                Hard telemetry captured directly from timestamped request waterfalls:
              </p>
              <ul className="space-y-2 text-xs">
                {analysis.observedEvidence?.map((ev: string, i: number) => (
                  <li key={i} className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200/70 text-slate-800 font-mono text-[11px] flex items-start gap-2.5 leading-relaxed">
                    <span className="text-emerald-700 font-bold shrink-0">#{i + 1}</span>
                    <span>{ev}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AI HYPOTHESIS & INFERRED MECHANISM */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-sm text-sky-800 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-sky-700" /> 2. Inferred Mechanism &amp; Hypothesis
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Deductive Analysis</span>
              </div>
              <p className="text-slate-600 text-xs">
                Carefully distinguished from verified telemetry:
              </p>
              <div className="p-3.5 rounded-lg bg-sky-50/50 border border-sky-200/70 text-slate-800 text-xs leading-relaxed font-sans">
                {analysis.aiHypothesis ||
                  'The database transaction isolation level allows concurrent reads without exclusive row locking, causing Time-of-Check to Time-of-Use race hazards.'}
              </div>

              {/* Repro Steps */}
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-800">Exact Reproduction Steps:</span>
                <ol className="space-y-1.5 text-xs text-slate-700 font-mono text-[11px]">
                  {analysis.reproductionSteps?.map((step: string, sIdx: number) => (
                    <li key={sIdx} className="p-2.5 rounded bg-slate-50 border border-slate-200 text-slate-800">
                      <strong className="text-sky-700 mr-1">{sIdx + 1}.</strong> {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* CODE FIX PROPOSAL */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Code2 className="w-4 h-4 text-sky-700" />
                <span>Recommended Engineering Code Patch (Java / TypeScript)</span>
              </div>
              <button
                onClick={() => copyToClipboard(analysis.suggestedFix, 'fix')}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-mono text-slate-700 border border-slate-300 transition"
              >
                {copiedFix ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFix ? 'Copied' : 'Copy Patch'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-sky-200 overflow-x-auto leading-relaxed shadow-inner">
              {analysis.suggestedFix}
            </pre>
          </div>

          {/* JIRA TICKET READY FORMAT */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FileText className="w-4 h-4 text-sky-700" />
                <span>JIRA / GitHub Ticket Description</span>
              </div>
              <button
                onClick={() => copyToClipboard(analysis.jiraMarkdown, 'jira')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition"
              >
                {copiedJira ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedJira ? 'Copied' : 'Copy Ticket'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {analysis.jiraMarkdown}
            </pre>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-xl bg-white border border-slate-200 shadow-xs">
          <p className="text-xs text-slate-500 mb-3">
            No analysis generated yet for this execution. Click below to analyze telemetry and logs.
          </p>
          <button
            onClick={handleRunAnalysis}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-md shadow-xs transition"
          >
            Run Detective Now
          </button>
        </div>
      )}
    </div>
  );
};
