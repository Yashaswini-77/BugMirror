import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { SystemModal } from './components/SystemModal';
import { LandingView } from './components/LandingView';
import { DashboardView } from './components/DashboardView';
import { ConcurrencyLabView } from './components/ConcurrencyLabView';
import { TimeMachineView } from './components/TimeMachineView';
import { AiDetectiveView } from './components/AiDetectiveView';
import { ScenarioBuilderView } from './components/ScenarioBuilderView';
import { ApiWorkspaceView } from './components/ApiWorkspaceView';
import { BugReportView } from './components/BugReportView';
import { QualityCenterView } from './components/QualityCenterView';
import { ProjectsView } from './components/ProjectsView';
import { api } from './services/api';
import { Project, Scenario, TestRun, DefectItem, SystemStatus } from './types';
import { AlertTriangle, CheckCircle2, ShieldCheck, FileText, X } from 'lucide-react';
import { CommandPalette } from './components/CommandPalette';
import { Breadcrumb } from './components/Breadcrumb';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [runs, setRuns] = useState<TestRun[]>([]);
  const [currentRun, setCurrentRun] = useState<TestRun | null>(null);
  const [defects, setDefects] = useState<DefectItem[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [systemModalOpen, setSystemModalOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  // Global Cmd+K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Recruiter Guided Demo State
  const [recruiterBanner, setRecruiterBanner] = useState<{
    active: boolean;
    step: 'defect_shown' | 'corrected_shown';
    defectiveRun?: TestRun;
    correctedRun?: TestRun;
  }>({
    active: false,
    step: 'defect_shown',
  });

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      const [projList, scenList, runList, defectList, status] = await Promise.all([
        api.getProjects(),
        api.getScenarios(),
        api.getRuns(),
        api.getDefects(),
        api.getSystemStatus().catch(() => null),
      ]);

      setProjects(projList);
      if (projList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projList[0].id);
      }
      setScenarios(scenList);
      setRuns(runList);
      setDefects(defectList);
      if (status) setSystemStatus(status);

      if (runList.length > 0) {
        const initialDefectRun = runList.find((r) => r.status === 'DEFECT_DETECTED') || runList[0];
        setCurrentRun(initialDefectRun);
      }
    } catch (err) {
      console.error('Failed to load initial application state:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Recruiter Demo Execution Routine
  const handleTriggerRecruiterDemo = async () => {
    try {
      const res = await api.runSimulation({
        scenarioName: 'Flash Sale: 2 Concurrent Users On 1 Last Item (Race Condition)',
        virtualUsers: 2,
        initialStock: 1,
        mode: 'defective',
        delayMs: 25,
        deterministic: true,
      });

      setCurrentRun(res.run);
      setRuns((prev) => [res.run, ...prev]);
      const updatedDefects = await api.getDefects();
      setDefects(updatedDefects);

      setRecruiterBanner({
        active: true,
        step: 'defect_shown',
        defectiveRun: res.run,
      });
      setActiveTab('timemachine');
    } catch (err) {
      console.error('Recruiter demo execution error:', err);
    }
  };

  // Run the Corrected implementation comparison
  const handleRunCorrectedComparison = async () => {
    try {
      const res = await api.runSimulation({
        scenarioName: 'Flash Sale: 2 Concurrent Users On 1 Last Item (Corrected Synchronized Mode)',
        virtualUsers: 2,
        initialStock: 1,
        mode: 'corrected',
        delayMs: 25,
        deterministic: true,
      });

      setCurrentRun(res.run);
      setRuns((prev) => [res.run, ...prev]);

      setRecruiterBanner((prev) => ({
        ...prev,
        step: 'corrected_shown',
        correctedRun: res.run,
      }));
    } catch (err) {
      console.error('Failed to run corrected comparison:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f7ff] text-slate-900 flex flex-col font-sans selection:bg-sky-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        projects={projects}
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
        onOpenSystemModal={() => setSystemModalOpen(true)}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        onTriggerRecruiterDemo={handleTriggerRecruiterDemo}
        systemStatus={systemStatus}
      />

      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setCommandPaletteOpen(false);
        }}
        onTriggerRecruiterDemo={handleTriggerRecruiterDemo}
        onRunCorrectedComparison={handleRunCorrectedComparison}
        onOpenSystemModal={() => setSystemModalOpen(true)}
      />

      {/* RECRUITER DEMO GUIDANCE BANNER */}
      {recruiterBanner.active && (
        <div className="bg-sky-50 border-b border-sky-200 px-4 py-3 text-xs shadow-xs relative z-30">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {recruiterBanner.step === 'defect_shown' ? (
                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </div>
              )}
              <div className="leading-snug text-slate-800">
                {recruiterBanner.step === 'defect_shown' ? (
                  <span>
                    <strong className="text-slate-900 font-semibold">Race Condition Simulated:</strong>{' '}
                    Two users concurrently purchased 1 remaining unit ({' '}
                    <strong className="text-rose-600 font-mono font-bold">Final Stock: -1</strong>).
                    Use the scrubber in the Bug Time Machine to replay event #6 where the invariant broke.
                  </span>
                ) : (
                  <span>
                    <strong className="text-emerald-800 font-semibold">Corrected Pipeline Verified:</strong>{' '}
                    Atomic transaction mutex ensured exactly 1 purchase succeeded ({' '}
                    <strong className="text-emerald-700 font-mono font-bold">Stock: 0</strong>), while user 2 was rejected with{' '}
                    <code className="text-slate-800 font-mono font-semibold bg-white px-1 py-0.5 rounded border border-emerald-200">HTTP 409 Conflict</code>.
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {recruiterBanner.step === 'defect_shown' ? (
                <button
                  onClick={handleRunCorrectedComparison}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Run Corrected Implementation</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('reports')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-xs transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>View Generated Bug Report</span>
                </button>
              )}

              <button
                onClick={() => setRecruiterBanner((prev) => ({ ...prev, active: false }))}
                className="p-1 rounded text-slate-400 hover:text-slate-700 transition"
                title="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Dynamic Breadcrumb Navigation */}
      <Breadcrumb
        activeTab={activeTab}
        onNavigate={setActiveTab}
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={(id) => setSelectedProjectId(id)}
        currentRun={currentRun}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {activeTab === 'overview' && (
          <LandingView
            onNavigate={setActiveTab}
            onSelectRun={(run) => setCurrentRun(run)}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            runs={runs}
            projects={projects}
            defects={defects}
            selectedProjectId={selectedProjectId}
            onSelectRun={(run) => setCurrentRun(run)}
            onNavigate={setActiveTab}
            onTriggerRecruiterDemo={handleTriggerRecruiterDemo}
          />
        )}

        {activeTab === 'concurrency' && (
          <ConcurrencyLabView
            onSelectRun={(run) => setCurrentRun(run)}
            onNavigate={setActiveTab}
            onRunCreated={(run) => {
              setRuns((prev) => [run, ...prev]);
              api.getDefects().then(setDefects);
            }}
          />
        )}

        {activeTab === 'timemachine' && (
          <TimeMachineView
            currentRun={currentRun}
            onSelectRun={(run) => setCurrentRun(run)}
            allRuns={runs}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'detective' && (
          <AiDetectiveView
            currentRun={currentRun}
            allRuns={runs}
            onSelectRun={(run) => setCurrentRun(run)}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'scenarios' && (
          <ScenarioBuilderView
            scenarios={scenarios}
            projects={projects}
            selectedProjectId={selectedProjectId}
            onNavigate={setActiveTab}
            onSelectRun={(run) => setCurrentRun(run)}
            onRefreshScenarios={() => api.getScenarios().then(setScenarios)}
          />
        )}

        {activeTab === 'api-workspace' && <ApiWorkspaceView />}

        {activeTab === 'reports' && (
          <BugReportView
            defects={defects}
            runs={runs}
            onSelectRun={(run) => setCurrentRun(run)}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'quality' && (
          <QualityCenterView
            scenarios={scenarios}
            runs={runs}
            onNavigate={setActiveTab}
            onSelectRun={(run) => setCurrentRun(run)}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={(id) => setSelectedProjectId(id)}
            onRefreshProjects={() => api.getProjects().then(setProjects)}
            onNavigate={setActiveTab}
          />
        )}
      </main>

      {/* Global Architecture / System Transparency Modal */}
      <SystemModal
        isOpen={systemModalOpen}
        onClose={() => setSystemModalOpen(false)}
        status={systemStatus}
      />

      {/* Clean Developer-Tool Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-md overflow-hidden bg-slate-950 shrink-0 ring-1 ring-sky-300/60 shadow-2xs">
              <img
                src="/assets/aistudio/Futuristic_Glass_Cube_with_Glowing_Core_fece868d.png"
                alt="BugMirror Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="font-semibold text-slate-800">BugMirror AI</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>QA Concurrency &amp; Replay Engine</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-mono text-[11px] text-slate-400">v2.5.0 Enterprise</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setSystemModalOpen(true)}
              className="text-slate-600 hover:text-slate-900 transition font-medium"
            >
              Runtime &amp; Architecture Info
            </button>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <button
              onClick={handleTriggerRecruiterDemo}
              className="text-sky-600 hover:text-sky-700 transition font-medium"
            >
              Reproduce Race Condition
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
