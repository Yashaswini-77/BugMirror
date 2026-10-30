import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Terminal,
  Search,
  Clock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { TestRun, Project, DefectItem } from '../types';

interface DashboardViewProps {
  runs: TestRun[];
  projects: Project[];
  defects: DefectItem[];
  selectedProjectId: string;
  onSelectRun: (run: TestRun) => void;
  onNavigate: (tab: any) => void;
  onTriggerRecruiterDemo: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  runs,
  projects,
  defects,
  selectedProjectId,
  onSelectRun,
  onNavigate,
  onTriggerRecruiterDemo,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredRuns = runs.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (modeFilter !== 'ALL' && r.mode !== modeFilter) return false;
    if (
      searchTerm &&
      !r.scenarioName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !r.id.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalRuns = runs.length;
  const passedRuns = runs.filter((r) => r.status === 'PASSED').length;
  const failedRuns = runs.filter((r) => r.status === 'FAILED' || r.status === 'DEFECT_DETECTED').length;
  const criticalDefects = defects.filter((d) => d.severity === 'CRITICAL').length;
  const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 100;
  const avgDurationMs = totalRuns > 0 ? Math.round(runs.reduce((acc, r) => acc + r.durationMs, 0) / totalRuns) : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
            <span className="text-sky-700 font-semibold">Quality Dashboard</span>
            <span aria-hidden="true">·</span>
            <span>Execution Telemetry &amp; Defect Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">QA Metrics &amp; Defect Hub</h1>
          <p className="text-xs text-slate-500">
            Real-time execution telemetry, invariant pass rates, and concurrency hazard history.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('concurrency')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-xs transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Launch Simulation</span>
          </button>
          <button
            onClick={onTriggerRecruiterDemo}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg shadow-2xs transition"
          >
            <span>Reproduce Race Condition</span>
          </button>
        </div>
      </div>

      {/* METRIC KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Runs */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Test Runs</span>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{totalRuns}</div>
          <div className="text-[11px] text-slate-400">Across all projects</div>
        </div>

        {/* Pass Rate */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums flex items-baseline gap-1.5">
            <span>{passRate}%</span>
            <span className="text-xs font-normal text-slate-500">({passedRuns} passed)</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${passRate}%` }} />
          </div>
        </div>

        {/* Critical Defects */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Critical Defects</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-600 tabular-nums">{criticalDefects}</div>
          <div className="text-[11px] text-rose-600/80">Race conditions detected</div>
        </div>

        {/* Failed / Blocked */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Failed Invariants</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{failedRuns}</div>
          <div className="text-[11px] text-slate-400">Negative stock / leaks</div>
        </div>

        {/* Avg Latency */}
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Mean Duration</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">{avgDurationMs}ms</div>
          <div className="text-[11px] text-slate-400">Parallel test dispatch</div>
        </div>
      </div>

      {/* DEFECT SEVERITY & ACTIVE DEFECT PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity Distribution */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 text-sm">Defect Severity Breakdown</h3>
            <span className="text-xs font-mono text-slate-500">{defects.length} Total</span>
          </div>

          <div className="space-y-3">
            {[
              {
                label: 'Critical (Oversell & Race Conditions)',
                count: defects.filter((d) => d.severity === 'CRITICAL').length,
                color: 'bg-rose-500',
                textColor: 'text-rose-600',
              },
              {
                label: 'High (Idempotency Replay Glitches)',
                count: defects.filter((d) => d.severity === 'HIGH').length,
                color: 'bg-amber-500',
                textColor: 'text-amber-600',
              },
              {
                label: 'Medium (Boundary / Negative Input)',
                count: defects.filter((d) => d.severity === 'MEDIUM').length,
                color: 'bg-blue-500',
                textColor: 'text-blue-600',
              },
              {
                label: 'Low (Timeout / Assertion Warnings)',
                count: defects.filter((d) => d.severity === 'LOW').length,
                color: 'bg-slate-400',
                textColor: 'text-slate-600',
              },
            ].map((item, i) => {
              const pct = defects.length > 0 ? Math.round((item.count / defects.length) * 100) : 0;
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">{item.label}</span>
                    <span className={`font-mono font-semibold ${item.textColor}`}>{item.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Active Flaw Card */}
        <div className="p-5 rounded-xl bg-rose-50/60 border border-rose-200 shadow-xs lg:col-span-2 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-rose-700">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> RECENTLY DETECTED CRITICAL DEFECT
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                OPEN DEFECT
              </span>
            </div>
            <h4 className="text-base font-bold text-slate-900 mt-1">
              Flash Sale Concurrency: 2 Orders Succeeded for 1 Inventory Unit (Stock: -1)
            </h4>
            <p className="text-xs text-slate-700 mt-2 leading-relaxed">
              Unsynchronized Read-Check-Write condition permitted Thread-2 to proceed with purchase deduction while Thread-1 was simultaneously writing.
              Database final recorded stock dropped to <strong className="text-rose-700 font-mono">-1</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-rose-200/80">
            <div className="text-xs font-mono text-slate-600">
              Scenario: Flash Sale Race Condition · Item ID: item-99
            </div>
            <div className="flex items-center gap-2">
              {runs.find((r) => r.status === 'DEFECT_DETECTED') && (
                <button
                  onClick={() => {
                    const defectRun = runs.find((r) => r.status === 'DEFECT_DETECTED');
                    if (defectRun) {
                      onSelectRun(defectRun);
                      onNavigate('timemachine');
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition shadow-xs"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Replay in Time Machine</span>
                </button>
              )}
              <button
                onClick={() => onNavigate('detective')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition shadow-2xs"
              >
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>AI Root Cause</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EXECUTION HISTORY TABLE & FILTERS */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h3 className="font-semibold text-slate-900 text-sm">Execution History</h3>
            <span className="text-xs font-mono text-slate-500">({filteredRuns.length} runs)</span>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <input
                type="text"
                placeholder="Search scenario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 py-1.5 pl-7 pr-3 focus:outline-none focus:border-sky-500 focus:bg-white w-48 sm:w-56"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 py-1.5 px-2.5 focus:outline-none focus:border-sky-500 focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PASSED">Passed Only</option>
              <option value="DEFECT_DETECTED">Defect Detected</option>
              <option value="FAILED">Failed</option>
            </select>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 py-1.5 px-2.5 focus:outline-none focus:border-sky-500 focus:bg-white"
            >
              <option value="ALL">All Modes</option>
              <option value="defective">Defective Mode</option>
              <option value="corrected">Corrected Mode</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px] bg-slate-50/70">
                <th className="py-2.5 px-3">Run ID</th>
                <th className="py-2.5 px-3">Scenario</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Users</th>
                <th className="py-2.5 px-3">Stock (Init → Final)</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Duration</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredRuns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No matching test execution records found.
                  </td>
                </tr>
              ) : (
                filteredRuns.map((r) => {
                  const isDefect = r.status === 'DEFECT_DETECTED';
                  const isPassed = r.status === 'PASSED';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-sky-700 font-semibold">{r.id.substring(0, 14)}...</td>
                      <td className="py-3 px-3 font-sans text-slate-800 max-w-xs truncate font-medium" title={r.scenarioName}>
                        {r.scenarioName}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold ${
                            r.mode === 'corrected'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {r.mode}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{r.virtualUsers} users</td>
                      <td className="py-3 px-3">
                        <span className="text-slate-500">{r.initialStock}</span>
                        <span className="text-slate-400 mx-1">→</span>
                        <span className={r.finalStock < 0 ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          {r.finalStock}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isPassed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : isDefect
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isPassed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500">{r.durationMs}ms</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => {
                            onSelectRun(r);
                            onNavigate('timemachine');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-sky-800 text-[11px] font-sans font-semibold transition"
                        >
                          <span>Replay</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
