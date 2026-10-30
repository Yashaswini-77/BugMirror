import React from 'react';
import {
  Layers,
  Activity,
  History,
  Terminal,
  GitBranch,
  Send,
  FileText,
  ShieldCheck,
  FolderGit2,
  Server,
  Zap,
  ChevronDown,
  Search,
  Command
} from 'lucide-react';
import { Project, SystemStatus } from '../types';

export type ActiveTab =
  | 'overview'
  | 'dashboard'
  | 'concurrency'
  | 'timemachine'
  | 'detective'
  | 'scenarios'
  | 'api-workspace'
  | 'reports'
  | 'quality'
  | 'projects';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  onOpenSystemModal: () => void;
  onOpenCommandPalette: () => void;
  onTriggerRecruiterDemo: () => void;
  systemStatus: SystemStatus | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  projects,
  selectedProjectId,
  setSelectedProjectId,
  onOpenSystemModal,
  onOpenCommandPalette,
  onTriggerRecruiterDemo,
  systemStatus,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview', icon: Zap },
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'concurrency', label: 'Concurrency Lab', icon: Layers },
    { id: 'timemachine', label: 'Bug Time Machine', icon: History, highlight: true },
    { id: 'detective', label: 'AI Detective', icon: Terminal },
    { id: 'scenarios', label: 'Scenario Builder', icon: GitBranch },
    { id: 'api-workspace', label: 'API Workspace', icon: Send },
    { id: 'reports', label: 'Bug Reports', icon: FileText },
    { id: 'quality', label: 'Quality Center', icon: ShieldCheck },
    { id: 'projects', label: 'Projects', icon: FolderGit2 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-sky-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Tier */}
        <div className="flex items-center justify-between h-16 border-b border-sky-100/80">
          {/* Brand & Project Selector */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-3 text-left group transition"
            >
              <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-xs ring-1 ring-sky-300/80 group-hover:ring-sky-500 transition shrink-0 bg-slate-950">
                <img
                  src="/assets/aistudio/Futuristic_Glass_Cube_with_Glowing_Core_fece868d.png"
                  alt="BugMirror AI Logo"
                  className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 group-hover:text-sky-700 transition">
                  BugMirror
                </span>
                <span className="text-xs font-semibold text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200 hidden sm:inline">
                  QA Enterprise
                </span>
              </div>
            </button>

            {/* Project Quick-Switch */}
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Workspace:</span>
              <div className="relative">
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-800 py-1.5 pl-3 pr-8 focus:outline-none focus:border-sky-500 focus:bg-white transition cursor-pointer font-medium shadow-2xs"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* Global Command Palette Trigger Button (Cmd+K) */}
            <button
              onClick={onOpenCommandPalette}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-sky-50/70 hover:bg-sky-100/90 border border-sky-200 transition group"
              title="Quick navigation and common actions (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5 text-sky-600 group-hover:scale-110 transition-transform" />
              <span className="hidden md:inline text-slate-700 font-medium">Commands &amp; Actions...</span>
              <span className="md:hidden text-slate-700 font-medium">Search</span>
              <kbd className="inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-sky-200 shadow-2xs font-semibold">
                ⌘K
              </kbd>
            </button>

            {/* Architecture Info */}
            <button
              onClick={onOpenSystemModal}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition"
              title="Inspect Active Runtime Architecture & Java Reference"
            >
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>Runtime Engine</span>
            </button>

            {/* Recruiter 1-Click Demo Action */}
            <button
              onClick={onTriggerRecruiterDemo}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 shadow-xs transition"
              title="Simulate a live race condition and replay events in the Time Machine"
            >
              <Zap className="w-3.5 h-3.5 fill-current text-sky-200" />
              <span className="hidden sm:inline">Reproduce Race Condition</span>
              <span className="sm:hidden">Run Demo</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar text-xs">
          {tabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-sky-100/80 text-sky-950 border border-sky-300 font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-700' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.highlight && !isActive && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Core
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
