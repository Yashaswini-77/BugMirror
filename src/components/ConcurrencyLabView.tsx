import React, { useState } from 'react';
import {
  Layers,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle2,
  History,
  FileCheck,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { TestRun } from '../types';

interface ConcurrencyLabViewProps {
  onSelectRun: (run: TestRun) => void;
  onNavigate: (tab: any) => void;
  onRunCreated?: (run: TestRun) => void;
}

export const ConcurrencyLabView: React.FC<ConcurrencyLabViewProps> = ({
  onSelectRun,
  onNavigate,
  onRunCreated,
}) => {
  const [virtualUsers, setVirtualUsers] = useState<number>(2);
  const [initialStock, setInitialStock] = useState<number>(1);
  const [mode, setMode] = useState<'defective' | 'corrected'>('defective');
  const [delayMs, setDelayMs] = useState<number>(25);
  const [deterministic, setDeterministic] = useState<boolean>(true);

  const [executing, setExecuting] = useState<boolean>(false);
  const [currentRun, setCurrentRun] = useState<TestRun | null>(null);
  const [requestResults, setRequestResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const handleExecuteSimulation = async () => {
    setExecuting(true);
    setErrorMsg(null);
    try {
      const res = await api.runSimulation({
        scenarioName:
          mode === 'defective'
            ? `Flash Sale Race Condition (${virtualUsers} Users, Stock ${initialStock})`
            : `Synchronized Atomic Checkout (${virtualUsers} Users, Stock ${initialStock})`,
        virtualUsers,
        initialStock,
        mode,
        delayMs,
        deterministic,
      });

      setCurrentRun(res.run);
      setRequestResults(res.results);
      if (onRunCreated) onRunCreated(res.run);
    } catch (err: any) {
      setErrorMsg(err.message || 'Execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const handleRunAutomatedSuite = async () => {
    setVerifying(true);
    try {
      const res = await api.runVerificationSuite();
      setVerificationResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Automated verification test suite failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
            <span className="text-sky-700 font-semibold">Stress Testing</span>
            <span aria-hidden="true">·</span>
            <span>Concurrent Thread Pipeline</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Concurrency Lab</h1>
          <p className="text-xs text-slate-500">
            Simulate concurrent user bursts against a controlled inventory demo to observe race conditions, overselling, and mutex locking.
          </p>
        </div>

        <button
          onClick={handleRunAutomatedSuite}
          disabled={verifying}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs disabled:opacity-50 transition"
          title="Run 20-batch automated regression test proving mathematical safety"
        >
          <FileCheck className="w-4 h-4 text-sky-600" />
          <span>{verifying ? 'Running Suite...' : 'Run Invariant Proof Tests'}</span>
        </button>
      </div>

      {/* AUTOMATED VERIFICATION RESULTS */}
      {verificationResult && (
        <div className="p-5 rounded-xl bg-white border border-emerald-200 shadow-xs text-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-900 font-bold">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
              <span>Automated Concurrency Proof Results</span>
            </div>
            <button
              onClick={() => setVerificationResult(null)}
              className="text-slate-400 hover:text-slate-700 font-semibold"
            >
              ✕
            </button>
          </div>
          <p className="text-slate-700 leading-relaxed font-mono text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-200">
            {verificationResult.assertionProof}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 font-mono text-[11px]">
              <span className="text-rose-800 font-bold block mb-1">Defective Mode (Unsynchronized):</span>
              <div className="text-slate-700">Defect Rate: <strong className="text-rose-600">{verificationResult.defectiveModeResults.defectRatePercent}%</strong></div>
              <div className="text-slate-500">Avg Inventory Underflow: {verificationResult.defectiveModeResults.averageUnderflow} items</div>
            </div>
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 font-mono text-[11px]">
              <span className="text-emerald-800 font-bold block mb-1">Corrected Mode (Atomic Mutex):</span>
              <div className="text-slate-700">Defect Rate: <strong className="text-emerald-600">{verificationResult.correctedModeResults.defectRatePercent}%</strong></div>
              <div className="text-slate-600 font-semibold">Zero Inventory Underflow (100% Invariant Compliant)</div>
            </div>
          </div>
        </div>
      )}

      {/* CONTROL & CONFIGURATION CARD */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Virtual Users */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Concurrent Virtual Users
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[2, 5, 10, 20].map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setVirtualUsers(u)}
                  className={`py-2 text-xs font-mono font-semibold rounded-lg border transition ${
                    virtualUsers === u
                      ? 'bg-sky-50 text-sky-900 border-sky-400 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500">Simultaneous worker threads</span>
          </div>

          {/* Initial Stock */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Initial Stock Available
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInitialStock(s)}
                  className={`py-2 text-xs font-mono font-semibold rounded-lg border transition ${
                    initialStock === s
                      ? 'bg-sky-50 text-sky-900 border-sky-400 font-bold shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500">Configured inventory in demo DB</span>
          </div>

          {/* Implementation Mode */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Engine Pipeline Mode
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setMode('defective')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition ${
                  mode === 'defective'
                    ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Defective
              </button>
              <button
                type="button"
                onClick={() => setMode('corrected')}
                className={`py-2 px-2 text-xs font-semibold rounded-lg border text-center transition ${
                  mode === 'corrected'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Corrected
              </button>
            </div>
            <span className="text-[11px] text-slate-500">
              {mode === 'defective' ? 'Unsynchronized read-modify-write' : 'Atomic mutex / isolation serializable'}
            </span>
          </div>

          {/* Latency & Determinism */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 block">
              Interleaving Delay Gap
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="5"
                max="80"
                value={delayMs}
                onChange={(e) => setDelayMs(Number(e.target.value))}
                className="w-full accent-sky-600 bg-slate-200 h-1.5 rounded-lg cursor-pointer"
              />
              <span className="font-mono text-xs text-sky-700 font-bold min-w-[45px]">{delayMs}ms</span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={deterministic}
                onChange={(e) => setDeterministic(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-0"
              />
              <span className="text-[11px] text-slate-600">Deterministic Offsets (Reproducible)</span>
            </label>
          </div>
        </div>

        {/* Action Trigger */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-mono">
            Target Endpoint: <code className="text-slate-800 font-semibold">POST /api/sandbox/inventory/checkout</code>
          </div>

          <button
            onClick={handleExecuteSimulation}
            disabled={executing}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold text-white shadow-xs transition active:scale-98 disabled:opacity-50 ${
              mode === 'defective'
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{executing ? 'Executing Threads...' : `Simulate ${virtualUsers} Concurrent Requests`}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {errorMsg}
        </div>
      )}

      {/* SIMULATION RESULT CARD */}
      {currentRun && (
        <div className="space-y-6">
          <div
            className={`p-5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              currentRun.status === 'DEFECT_DETECTED'
                ? 'bg-rose-50/70 border-rose-200 text-rose-900 shadow-xs'
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900 shadow-xs'
            }`}
          >
            <div className="flex items-start gap-3">
              {currentRun.status === 'DEFECT_DETECTED' ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {currentRun.status === 'DEFECT_DETECTED'
                    ? 'Race Condition Detected: Inventory Underflow'
                    : 'Synchronization Maintained: Zero Inventory Leakage'}
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-sans leading-relaxed">
                  {currentRun.status === 'DEFECT_DETECTED'
                    ? `Initial stock was ${currentRun.initialStock}, but ${currentRun.successOrders} orders succeeded. Final inventory dropped to ${currentRun.finalStock}.`
                    : `Exactly ${currentRun.successOrders} order succeeded out of ${currentRun.virtualUsers} requests. Remaining requests returned clean HTTP 409 Conflict.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
              <button
                onClick={() => {
                  onSelectRun(currentRun);
                  onNavigate('timemachine');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 shadow-2xs transition"
              >
                <History className="w-3.5 h-3.5" />
                <span>Replay in Time Machine</span>
              </button>
            </div>
          </div>

          {/* Granular Request Waterfall Table */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900 text-sm">Thread-Level Telemetry Waterfall</h4>
              <span className="text-xs font-mono text-slate-500">
                {requestResults.length} Inbound Requests Logged
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] bg-slate-50/70">
                    <th className="py-2.5 px-3">Request ID</th>
                    <th className="py-2.5 px-3">Thread Worker</th>
                    <th className="py-2.5 px-3">Latency</th>
                    <th className="py-2.5 px-3">Stock Before</th>
                    <th className="py-2.5 px-3">Stock After</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {requestResults.map((r, i) => {
                    const isSuccess = r.responseStatus === 200;
                    return (
                      <tr key={i} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-3 text-sky-700 font-semibold">{r.requestId}</td>
                        <td className="py-3 px-3 text-slate-700">{r.threadId}</td>
                        <td className="py-3 px-3 text-slate-500">{r.durationMs}ms</td>
                        <td className="py-3 px-3 text-slate-700">{r.beforeStock}</td>
                        <td className="py-3 px-3">
                          <span className={r.afterStock < 0 ? 'text-rose-600 font-bold' : 'text-slate-900'}>
                            {r.afterStock}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isSuccess
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            HTTP {r.responseStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-sans">
                          {isSuccess ? (
                            <span className="text-emerald-700 font-medium">Order Confirmed ({r.orderId})</span>
                          ) : (
                            <span className="text-slate-500">{r.errorMessage || 'Conflict (Out of Stock)'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
