import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { Scenario, TestRun } from '../types';

interface QualityCenterViewProps {
  scenarios: Scenario[];
  runs: TestRun[];
  onNavigate: (tab: any) => void;
  onSelectRun: (run: TestRun) => void;
}

export const QualityCenterView: React.FC<QualityCenterViewProps> = ({
  scenarios,
  runs,
  onNavigate,
  onSelectRun,
}) => {
  const totalScenarios = scenarios.length;
  const flakyScenarios = scenarios.filter((s) => s.isFlaky || (s.passRate > 0 && s.passRate < 100));
  const repeatedFailures = scenarios.filter((s) => s.passRate <= 50 && s.totalRuns > 0);

  const categories = [
    { name: 'concurrency', label: 'Concurrency & Race Hazards', icon: Layers },
    { name: 'ecommerce', label: 'E-Commerce State Transitions', icon: Activity },
    { name: 'api', label: 'API Idempotency & Replays', icon: ShieldCheck },
    { name: 'security', label: 'Input Boundary Validations', icon: ShieldCheck },
  ];

  const totalRuns = runs.length;
  const passedRuns = runs.filter((r) => r.status === 'PASSED').length;
  const overallPassRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 100;

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
          <span className="text-sky-700 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Quality Engineering
          </span>
          <span aria-hidden="true" className="text-slate-300">·</span>
          <span>Coverage &amp; Flakiness</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Test Quality Center</h1>
        <p className="text-xs text-slate-500">
          Instrumented scenario health, repeat failure trends, and concurrency flakiness radar.
        </p>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Defined Scenarios</span>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{totalScenarios}</div>
          <span className="text-[11px] text-slate-500">100% instrumented in suite</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Aggregate Pass Rate</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 tabular-nums">{overallPassRate}%</div>
          <span className="text-[11px] text-slate-500">{passedRuns} of {totalRuns} runs passed</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Flaky Scenarios</span>
          <div className="text-2xl font-bold font-mono text-amber-600 tabular-nums">{flakyScenarios.length}</div>
          <span className="text-[11px] text-amber-700">Timing-dependent pass/fail</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Repeated Failures</span>
          <div className="text-2xl font-bold font-mono text-rose-600 tabular-nums">{repeatedFailures.length}</div>
          <span className="text-[11px] text-rose-700">Persistent race conditions</span>
        </div>
      </div>

      {/* CATEGORY HEALTH GRID */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">Instrumented Coverage by Domain</h3>
          <span className="text-xs font-mono text-slate-500">Telemetry Grounded</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((c) => {
            const scensInCat = scenarios.filter((s) => s.category === c.name);
            const count = scensInCat.length;
            const avgPass =
              count > 0
                ? Math.round(scensInCat.reduce((acc, s) => acc + s.passRate, 0) / count)
                : 100;
            const Icon = c.icon;

            return (
              <div key={c.name} className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-800 tabular-nums">{avgPass}% Pass</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs">{c.label}</h4>
                  <div className="text-[11px] text-slate-500">{count} Active Scenario{count !== 1 ? 's' : ''}</div>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${avgPass > 80 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{ width: `${avgPass}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* REPEATED FAILURES & FLAKINESS RADAR */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-semibold text-slate-900 text-sm">High-Contention Scenarios Requiring Attention</h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">Concurrency Audit List</span>
        </div>

        <div className="space-y-3">
          {scenarios.map((scen) => {
            const isHighFlake = scen.passRate < 100;
            return (
              <div
                key={scen.id}
                className="p-4 rounded-lg bg-slate-50/70 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-900 text-xs">{scen.name}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                        scen.passRate === 100
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {scen.passRate}% Reliability
                    </span>
                    {isHighFlake && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Race Flakiness Detected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{scen.description}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono text-xs text-slate-600">
                    <div>{scen.totalRuns} Executions</div>
                    <div className="text-slate-500 text-[11px]">{scen.virtualUsers} Virtual Users</div>
                  </div>
                  <button
                    onClick={() => onNavigate('concurrency')}
                    className="px-3.5 py-1.5 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white transition shadow-xs"
                  >
                    Stress Test
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
