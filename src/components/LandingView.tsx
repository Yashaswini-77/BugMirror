import React, { useState } from 'react';
import {
  Layers,
  History,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Terminal,
  Sliders,
  CheckCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { TestRun } from '../types';

interface LandingViewProps {
  onNavigate: (tab: any) => void;
  onSelectRun: (run: TestRun) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({ onNavigate, onSelectRun }) => {
  const [demoState, setDemoState] = useState<{
    running: boolean;
    mode: 'defective' | 'corrected' | null;
    stock: number;
    results: any[];
    oversold: boolean;
    lastRun: TestRun | null;
  }>({
    running: false,
    mode: null,
    stock: 1,
    results: [],
    oversold: false,
    lastRun: null,
  });

  const handleRunMiniDemo = async (mode: 'defective' | 'corrected') => {
    setDemoState((prev) => ({ ...prev, running: true, mode, results: [] }));
    try {
      const res = await api.runSimulation({
        virtualUsers: 2,
        initialStock: 1,
        mode,
        delayMs: 25,
        deterministic: true,
      });

      setDemoState({
        running: false,
        mode,
        stock: res.run.finalStock,
        results: res.results,
        oversold: res.invariantsViolated,
        lastRun: res.run,
      });
    } catch (e) {
      console.error(e);
      setDemoState((prev) => ({ ...prev, running: false }));
    }
  };

  const resetMiniDemo = () => {
    setDemoState({
      running: false,
      mode: null,
      stock: 1,
      results: [],
      oversold: false,
      lastRun: null,
    });
  };

  return (
    <div className="space-y-16 pb-24">
      {/* HERO SECTION */}
      <section className="relative pt-6 sm:pt-10 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Futuristic App Logo Display */}
          <div className="flex justify-center">
            <div className="relative group cursor-pointer" onClick={() => onNavigate('concurrency')}>
              <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-300 opacity-40 blur-lg group-hover:opacity-75 transition duration-500" />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shadow-xl ring-2 ring-sky-300/80 bg-slate-950 flex items-center justify-center">
                <img
                  src="/assets/aistudio/Futuristic_Glass_Cube_with_Glowing_Core_fece868d.png"
                  alt="BugMirror AI Quantum Cube Logo"
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-800 border border-sky-200">
            <span className="w-2 h-2 rounded-full bg-sky-600"></span>
            <span>Enterprise Concurrency &amp; Defect Simulator · Version 2.5</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
            Catch race conditions <br className="hidden sm:inline" />
            <span className="text-sky-700">before they corrupt production data.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Standard unit tests run in isolation and miss multi-threaded timing bugs.
            BugMirror simulates concurrent user bursts, detects data drift, and provides a visual{' '}
            <strong className="text-slate-900 font-semibold">Bug Time Machine</strong> to replay failures step-by-step.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('concurrency')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-xs transition"
            >
              <Layers className="w-4 h-4" />
              <span>Launch Concurrency Lab</span>
            </button>
            <button
              onClick={() => onNavigate('timemachine')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition"
            >
              <History className="w-4 h-4 text-slate-500" />
              <span>Open Bug Time Machine</span>
            </button>
          </div>
        </div>

        {/* INTERACTIVE WORKBENCH IN HERO */}
        <div className="max-w-3xl mx-auto mt-12 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-md text-left">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-600"></span>
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Live Interactive Lab: Flash Sale Race Condition
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
              <span>Item: <strong className="text-slate-700 font-mono">item-99</strong></span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>Initial Stock: <strong className="text-slate-900 font-mono">1</strong></span>
            </div>
          </div>

          <div className="py-5 space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Two virtual buyers submit simultaneous checkout requests for the <strong>very last unit</strong> in inventory.
              Execute both pipelines to inspect how an un-isolated read-modify-write pattern causes overselling.
            </p>

            {/* Simulation Triggers */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                disabled={demoState.running}
                onClick={() => handleRunMiniDemo('defective')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 shadow-xs transition active:scale-98"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Simulate Defective Mode (TOCTOU)</span>
              </button>

              <button
                disabled={demoState.running}
                onClick={() => handleRunMiniDemo('corrected')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 shadow-xs transition active:scale-98"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Simulate Corrected Mode (Atomic Lock)</span>
              </button>

              {demoState.mode && (
                <button
                  onClick={resetMiniDemo}
                  className="p-2 rounded-lg text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition"
                  title="Reset Simulation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Output Display Terminal */}
            <div className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                <span className="font-semibold text-slate-300">EXECUTION TELEMETRY</span>
                <span>STATUS: {demoState.running ? 'DISPATCHING THREADS...' : demoState.mode ? 'COMPLETED' : 'READY'}</span>
              </div>

              {!demoState.mode && !demoState.running ? (
                <div className="text-center py-6 text-slate-400 font-sans text-xs">
                  Click either mode above to fire parallel requests and observe state drift.
                </div>
              ) : demoState.running ? (
                <div className="py-6 flex flex-col items-center justify-center gap-2 text-blue-400">
                  <Activity className="w-5 h-5 animate-spin" />
                  <span className="text-[11px] font-sans text-slate-300">Thread-1 and Thread-2 executing concurrently...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Results row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {demoState.results.map((r, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-lg border ${
                          r.success
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                            : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-white">User {r.virtualUser} ({r.threadId})</span>
                          <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-black/50">
                            HTTP {r.responseStatus}
                          </span>
                        </div>
                        <div className="text-[11px] mt-1.5 text-slate-300 font-sans">
                          {r.success ? `Order Persisted: ${r.orderId}` : `Safely Rejected: ${r.errorMessage}`}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Summary Bar */}
                  <div className={`p-3.5 rounded-lg border flex items-center justify-between ${
                    demoState.oversold
                      ? 'bg-rose-900/30 border-rose-700/60 text-rose-200'
                      : 'bg-emerald-900/30 border-emerald-700/60 text-emerald-200'
                  }`}>
                    <div className="flex items-center gap-2.5">
                      {demoState.oversold ? (
                        <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-xs text-white">
                          {demoState.oversold
                            ? 'Race Condition Detected: Inventory Oversold'
                            : 'Invariants Maintained: Zero Inventory Leakage'}
                        </div>
                        <div className="text-[11px] text-slate-300 font-sans mt-0.5">
                          Final Recorded Stock: <span className="font-mono font-bold text-white">{demoState.stock}</span> (Requirement: stock &gt;= 0)
                        </div>
                      </div>
                    </div>

                    {demoState.lastRun && (
                      <button
                        onClick={() => {
                          onSelectRun(demoState.lastRun!);
                          onNavigate('timemachine');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 shadow-xs transition"
                      >
                        <span>Replay in Time Machine</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Designed for Multi-User &amp; High-Contention Systems
          </h2>
          <p className="text-xs text-slate-500 max-w-xl mx-auto">
            Traditional testing tools verify syntax and isolated endpoints. BugMirror AI tests the boundaries of concurrent state.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition">
            <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <History className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Bug Time Machine</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Scrub backwards and forwards through interleaved thread events. Compare expected versus actual database state at any microsecond offset.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition">
            <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Concurrency Lab</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Simulate 2, 5, 10, or 20 simultaneous virtual users. Test un-isolated transactions against serializable row-level mutexes with automated verification suites.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3 hover:border-slate-300 transition">
            <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Diagnostic Detective</h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Strictly segregates observed empirical facts from AI hypotheses. Generates production-ready patches for Spring Boot and Node.js.
            </p>
          </div>
        </div>
      </section>

      {/* CATALOG OF SIMULATED FINDINGS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Production Findings Catalog</h3>
              <p className="text-xs text-slate-500">Defects and synchronization edge cases detected by the platform</p>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-800 font-semibold self-start sm:self-auto transition"
            >
              <span>View All Executions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              {
                title: 'E-Commerce Flash Sale Stock Underflow',
                severity: 'CRITICAL',
                badgeStyle: 'text-rose-700 bg-rose-50 border-rose-200',
                desc: 'Two concurrent checkout requests bypassed the stock check within a 2.1ms window, reducing 1 available unit to -1 and issuing two valid order confirmations.',
                fix: 'SELECT FOR UPDATE or SERIALIZABLE transaction isolation',
              },
              {
                title: 'Welcome Promo Code Double-Spend',
                severity: 'HIGH',
                badgeStyle: 'text-amber-700 bg-amber-50 border-amber-200',
                desc: 'Single-use $50 discount applied concurrently in two browser tabs before redemption status was committed to the ledger.',
                fix: 'Idempotency key enforcement & atomic reservation ledger',
              },
              {
                title: 'Cart Negative Quantity Underflow Injection',
                severity: 'MEDIUM',
                badgeStyle: 'text-sky-700 bg-sky-50 border-sky-200',
                desc: 'Client-side payload modification sent a negative integer (-5) in cart update, subtracting item cost from the subtotal.',
                fix: 'Enforce boundary validation and server-side range checks',
              },
            ].map((f, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs">{f.title}</span>
                    <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${f.badgeStyle}`}>
                      {f.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
                <div className="shrink-0 text-left md:text-right font-mono text-[11px] text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
                  {f.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="text-center max-w-xl mx-auto space-y-4 px-4">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Ready to explore simulated race conditions?</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          The entire platform is operational with live deterministic test runs and interactive step-through debugging.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('concurrency')}
            className="px-5 py-2.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition shadow-xs"
          >
            Launch Concurrency Lab
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-5 py-2.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition shadow-2xs"
          >
            View Dashboard Metrics
          </button>
        </div>
      </section>
    </div>
  );
};
