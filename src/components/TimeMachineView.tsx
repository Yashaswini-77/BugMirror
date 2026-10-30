import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Clock,
  ArrowRight,
  Terminal,
  Layers,
  ChevronDown
} from 'lucide-react';
import { TestRun, TimelineEvent } from '../types';

interface TimeMachineViewProps {
  currentRun: TestRun | null;
  onSelectRun: (run: TestRun) => void;
  allRuns: TestRun[];
  onNavigate: (tab: any) => void;
}

export const TimeMachineView: React.FC<TimeMachineViewProps> = ({
  currentRun,
  onSelectRun,
  allRuns,
  onNavigate,
}) => {
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const events: TimelineEvent[] = currentRun?.events || [];
  const selectedEvent = events[selectedEventIndex] || null;

  // Jump to defect event if available on run change
  useEffect(() => {
    if (currentRun) {
      const defectIdx = currentRun.events.findIndex(
        (e) => e.isDefectPoint || e.eventType === 'DEFECT_TRIGGERED'
      );
      if (defectIdx !== -1) {
        setSelectedEventIndex(defectIdx);
      } else {
        setSelectedEventIndex(0);
      }
      setIsPlaying(false);
    }
  }, [currentRun?.id]);

  // Scrubber playback
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setSelectedEventIndex((prev) => {
          if (prev >= events.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playSpeed, events.length]);

  const handleStepBack = () => {
    setIsPlaying(false);
    setSelectedEventIndex((prev) => Math.max(0, prev - 1));
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setSelectedEventIndex((prev) => Math.min(events.length - 1, prev + 1));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setSelectedEventIndex(0);
  };

  const handleJumpToDefect = () => {
    setIsPlaying(false);
    const defectIdx = events.findIndex(
      (e) => e.isDefectPoint || e.eventType === 'DEFECT_TRIGGERED'
    );
    if (defectIdx !== -1) {
      setSelectedEventIndex(defectIdx);
    }
  };

  if (!currentRun || events.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
        <Clock className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">No Test Run Selected for Time Machine</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Execute a scenario in the Concurrency Lab or select an existing test execution to replay its events step-by-step.
        </p>
        <button
          onClick={() => onNavigate('concurrency')}
          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
        >
          Go to Concurrency Lab
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header & Run Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span className="font-semibold text-sky-700">Bug Time Machine</span>
            <span aria-hidden="true">·</span>
            <span>Trace: {currentRun.id}</span>
            <span aria-hidden="true">·</span>
            <span className="uppercase text-slate-700 font-semibold">{currentRun.mode} Mode</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            {currentRun.scenarioName}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 pt-0.5">
            <span>Duration: <strong className="text-slate-800">{currentRun.durationMs}ms</strong></span>
            <span aria-hidden="true">·</span>
            <span>Concurrency: <strong className="text-slate-800">{currentRun.virtualUsers} users</strong></span>
            <span aria-hidden="true">·</span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                currentRun.status === 'PASSED'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {currentRun.status}
            </span>
          </div>
        </div>

        {/* Switcher & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={currentRun.id}
              onChange={(e) => {
                const run = allRuns.find((r) => r.id === e.target.value);
                if (run) onSelectRun(run);
              }}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-800 py-1.5 pl-3 pr-8 focus:outline-none focus:border-sky-500 cursor-pointer shadow-2xs font-medium"
            >
              {allRuns.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.status === 'DEFECT_DETECTED' ? '⚠️ [DEFECT] ' : '✓ [PASS] '}
                  {r.scenarioName.slice(0, 32)} ({r.mode})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          <button
            onClick={() => onNavigate('detective')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            <span>AI Root Cause</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>Bug Report</span>
          </button>
        </div>
      </div>

      {/* TIMELINE SCRUBBER CONTROLLER BAR */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition"
              title="Reset to beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={handleStepBack}
              disabled={selectedEventIndex === 0}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 transition"
              title="Step backward"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs inline-flex items-center gap-1.5 shadow-xs transition"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play Timeline'}</span>
            </button>
            <button
              onClick={handleStepForward}
              disabled={selectedEventIndex === events.length - 1}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 disabled:opacity-40 transition"
              title="Step forward"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Jump to Defect & Speed controls */}
          <div className="flex items-center gap-3">
            {events.some((e) => e.isDefectPoint || e.eventType === 'DEFECT_TRIGGERED') && (
              <button
                onClick={handleJumpToDefect}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Jump to Defect Point</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[11px] font-mono">
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaySpeed(s)}
                  className={`px-2 py-0.5 rounded transition ${
                    playSpeed === s ? 'bg-white text-sky-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div className="font-mono text-xs text-slate-500">
              Event <strong className="text-slate-900">{selectedEventIndex + 1}</strong> of{' '}
              <span>{events.length}</span>
            </div>
          </div>
        </div>

        {/* Interactive Scrub Track Nodes */}
        <div className="relative pt-3 pb-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center justify-between min-w-[650px] relative px-3">
            {/* Connecting baseline bar */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-200 z-0" />

            {events.map((evt, idx) => {
              const isSelected = idx === selectedEventIndex;
              const isDefect = evt.isDefectPoint || evt.eventType === 'DEFECT_TRIGGERED';
              const isPassed = evt.eventType === 'ASSERTION_PASSED';

              let nodeClasses = 'bg-white text-slate-700 border-slate-300';
              if (isDefect) nodeClasses = 'bg-rose-600 text-white border-rose-600';
              else if (isPassed) nodeClasses = 'bg-emerald-600 text-white border-emerald-600';
              else if (evt.eventType === 'MUTEX_ACQUIRE') nodeClasses = 'bg-sky-600 text-white border-sky-600';
              else if (evt.eventType === 'DB_READ' || evt.eventType === 'DB_WRITE') nodeClasses = 'bg-slate-800 text-white border-slate-800';

              return (
                <button
                  key={evt.id}
                  onClick={() => {
                    setIsPlaying(false);
                    setSelectedEventIndex(idx);
                  }}
                  className={`relative z-10 flex flex-col items-center group focus:outline-none transition-transform ${
                    isSelected ? 'scale-120' : 'hover:scale-110'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border-2 transition ${nodeClasses} ${
                      isSelected ? 'ring-3 ring-sky-500/40' : 'shadow-xs'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 mt-1.5 whitespace-nowrap font-medium">
                    +{evt.timestampOffsetMs}ms
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SELECTED EVENT INSPECTOR */}
      {selectedEvent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Event Details & State Diff (Col 7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Event Summary Card */}
            <div
              className={`p-6 rounded-2xl border space-y-3 ${
                selectedEvent.isDefectPoint
                  ? 'bg-rose-50/70 border-rose-200 shadow-xs'
                  : 'bg-white border border-slate-200 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                      selectedEvent.isDefectPoint
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {selectedEvent.eventType}
                  </span>
                  <span className="text-xs font-mono text-slate-500">
                    +{selectedEvent.timestampOffsetMs}ms · {selectedEvent.threadId}
                  </span>
                </div>
                {selectedEvent.isDefectPoint && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Invariant Violated Here</span>
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900">{selectedEvent.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-mono bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                {selectedEvent.details}
              </p>
            </div>

            {/* EXPECTED VS ACTUAL STATE DIFF */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-700" />
                  <span>State Drift Comparison</span>
                </h4>
                <span className="text-[11px] font-mono text-slate-500">Expected vs. Actual</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Expected */}
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Expected State</span>
                  </div>
                  <pre className="font-mono text-xs text-emerald-950 overflow-x-auto p-2.5 bg-white/90 rounded-lg border border-emerald-200">
                    {JSON.stringify(selectedEvent.expectedState, null, 2)}
                  </pre>
                </div>

                {/* Actual */}
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    selectedEvent.isDefectPoint
                      ? 'bg-rose-50/60 border-rose-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div
                    className={`flex items-center gap-1.5 text-xs font-semibold ${
                      selectedEvent.isDefectPoint ? 'text-rose-800' : 'text-slate-700'
                    }`}
                  >
                    {selectedEvent.isDefectPoint ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-slate-500" />
                    )}
                    <span>Actual Runtime State</span>
                  </div>
                  <pre
                    className={`font-mono text-xs overflow-x-auto p-2.5 rounded-lg border ${
                      selectedEvent.isDefectPoint
                        ? 'bg-white/90 text-rose-950 border-rose-200 font-semibold'
                        : 'bg-white text-slate-800 border-slate-200'
                    }`}
                  >
                    {JSON.stringify(selectedEvent.actualState, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Request & Response Details */}
            {(selectedEvent.requestData || selectedEvent.responseData) && (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm">HTTP Traffic Snapshot</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  {selectedEvent.requestData && (
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[11px] block font-sans font-medium">Request:</span>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div>
                          <strong className="text-sky-700">{selectedEvent.requestData.method}</strong>{' '}
                          <span className="text-slate-800 font-medium">{selectedEvent.requestData.endpoint}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">ID: {selectedEvent.requestData.requestId}</div>
                        {selectedEvent.requestData.body && (
                          <pre className="text-[11px] text-slate-600 pt-1">
                            {JSON.stringify(selectedEvent.requestData.body, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedEvent.responseData && (
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[11px] block font-sans font-medium">Response:</span>
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                        <div>
                          Status:{' '}
                          <span
                            className={`font-bold ${
                              selectedEvent.responseData.status === 200
                                ? 'text-emerald-700'
                                : 'text-rose-700'
                            }`}
                          >
                            HTTP {selectedEvent.responseData.status}
                          </span>{' '}
                          ({selectedEvent.responseData.latencyMs}ms)
                        </div>
                        {selectedEvent.responseData.body && (
                          <pre className="text-[11px] text-slate-600 pt-1">
                            {JSON.stringify(selectedEvent.responseData.body, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Server Logs & Detective Bridge (Col 5) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Application Server Log Console (Authentic Terminal) */}
            <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 shadow-md space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span>Synchronized Log Stream</span>
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  {selectedEvent.logs.length} Lines
                </span>
              </div>

              <div className="space-y-1.5 font-mono text-[11px] max-h-72 overflow-y-auto pr-1">
                {selectedEvent.logs.length === 0 ? (
                  <div className="text-slate-500 py-4 text-center font-sans">No log entries for this event.</div>
                ) : (
                  selectedEvent.logs.map((log, lIdx) => (
                    <div
                      key={lIdx}
                      className={`p-2.5 rounded-lg border ${
                        log.level === 'ERROR'
                          ? 'bg-rose-950/40 border-rose-800 text-rose-200'
                          : log.level === 'WARN'
                          ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                          : log.level === 'DEBUG'
                          ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="font-bold">[{log.level}]</span>
                        <span>{log.timestamp}</span>
                      </div>
                      <div className="leading-relaxed">{log.message}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <h4 className="font-semibold text-slate-900 text-sm">Investigation Handoff</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Take the telemetry from this execution trace to analyze root causes or file a bug report.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => onNavigate('detective')}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold transition"
                >
                  <span className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-600" />
                    <span>Run AI Bug Detective</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => onNavigate('reports')}
                  className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-xs font-semibold transition"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>Export JIRA-Ready Bug Report</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
