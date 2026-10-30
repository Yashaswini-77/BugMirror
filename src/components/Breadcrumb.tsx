import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  Home,
  FolderGit2,
  ChevronDown,
  Layers,
  Activity,
  History,
  Terminal,
  GitBranch,
  Send,
  FileText,
  ShieldCheck,
  Zap,
  Check,
  Command,
  Copy,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { ActiveTab } from './Navbar';
import { Project, TestRun } from '../types';

interface BreadcrumbProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  currentRun?: TestRun | null;
  onOpenCommandPalette?: () => void;
}

interface TabMeta {
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor?: string;
}

const TAB_METADATA: Record<ActiveTab, TabMeta> = {
  overview: {
    label: 'Platform Overview',
    category: 'Core',
    icon: Zap,
    accentColor: 'text-sky-600',
  },
  dashboard: {
    label: 'Executive Dashboard',
    category: 'Telemetry & KPIs',
    icon: Activity,
    accentColor: 'text-sky-600',
  },
  concurrency: {
    label: 'Concurrency Lab',
    category: 'Stress Simulations',
    icon: Layers,
    accentColor: 'text-amber-600',
  },
  timemachine: {
    label: 'Bug Time Machine',
    category: 'Root Cause Replay',
    icon: History,
    accentColor: 'text-purple-600',
  },
  detective: {
    label: 'AI Bug Detective',
    category: 'Root Cause & Heuristics',
    icon: Terminal,
    accentColor: 'text-sky-600',
  },
  scenarios: {
    label: 'Scenario Builder',
    category: 'Test Definitions',
    icon: GitBranch,
    accentColor: 'text-indigo-600',
  },
  'api-workspace': {
    label: 'API Testing Workspace',
    category: 'REST Sandbox',
    icon: Send,
    accentColor: 'text-sky-600',
  },
  reports: {
    label: 'Bug Reports Generator',
    category: 'Defect Ledger',
    icon: FileText,
    accentColor: 'text-rose-600',
  },
  quality: {
    label: 'Test Quality Center',
    category: 'Reliability & Coverage',
    icon: ShieldCheck,
    accentColor: 'text-emerald-600',
  },
  projects: {
    label: 'Project Workspaces',
    category: 'Organization & Scope',
    icon: FolderGit2,
    accentColor: 'text-sky-600',
  },
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  activeTab,
  onNavigate,
  projects,
  selectedProjectId,
  onSelectProject,
  currentRun,
  onOpenCommandPalette,
}) => {
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const projectMenuRef = useRef<HTMLLIElement>(null);
  const sectionMenuRef = useRef<HTMLLIElement>(null);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0] || {
    id: selectedProjectId,
    name: 'Default Workspace',
    description: '',
    scenarioCount: 0,
    defectCount: 0,
  };

  const currentTabMeta = TAB_METADATA[activeTab] || TAB_METADATA.overview;
  const ActiveTabIcon = currentTabMeta.icon;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        projectMenuRef.current &&
        !projectMenuRef.current.contains(event.target as Node)
      ) {
        setProjectDropdownOpen(false);
      }
      if (
        sectionMenuRef.current &&
        !sectionMenuRef.current.contains(event.target as Node)
      ) {
        setSectionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCopyPath = () => {
    const path = `BugMirror AI > ${activeProject.name} > ${currentTabMeta.category} > ${currentTabMeta.label}${
      currentRun ? ` > Run #${currentRun.id.slice(-6)}` : ''
    }`;
    navigator.clipboard?.writeText?.(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDetailView =
    (activeTab === 'timemachine' || activeTab === 'detective' || activeTab === 'reports') &&
    Boolean(currentRun);

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className="bg-white/85 backdrop-blur-md border-b border-sky-200/70 shadow-2xs text-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        {/* Left Side: Breadcrumb trail */}
        <ol className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
          {/* 1. Root / Home Node */}
          <li className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onNavigate('overview')}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-600 hover:text-sky-700 hover:bg-sky-50 font-medium transition"
              title="Return to Product Overview"
            >
              <div className="w-4 h-4 rounded-xs overflow-hidden bg-slate-950 shrink-0 ring-1 ring-sky-300/60 shadow-2xs">
                <img
                  src="/assets/aistudio/Futuristic_Glass_Cube_with_Glowing_Core_fece868d.png"
                  alt="BugMirror Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-semibold text-slate-900 hidden sm:inline">BugMirror</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </li>

          {/* 2. Project Scope Selector Dropdown */}
          <li className="relative flex items-center gap-1.5 shrink-0" ref={projectMenuRef}>
            <button
              onClick={() => setProjectDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-700 hover:text-sky-800 hover:bg-sky-50 font-medium border border-transparent hover:border-sky-200/80 transition"
              title="Click to switch project workspace"
              aria-haspopup="true"
              aria-expanded={projectDropdownOpen}
            >
              <FolderGit2 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span className="max-w-[130px] sm:max-w-[200px] truncate font-medium text-slate-800">
                {activeProject.name}
              </span>
              <span className="hidden md:inline-flex text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {activeProject.id.toUpperCase()}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
            </button>

            {/* Project Switcher Popover */}
            {projectDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-sky-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                    Switch Active Project
                  </span>
                  <button
                    onClick={() => {
                      setProjectDropdownOpen(false);
                      onNavigate('projects');
                    }}
                    className="text-[10px] font-semibold text-sky-600 hover:text-sky-800 hover:underline"
                  >
                    Manage All
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto py-1">
                  {projects.map((proj) => {
                    const isSelected = proj.id === selectedProjectId;
                    return (
                      <button
                        key={proj.id}
                        onClick={() => {
                          onSelectProject(proj.id);
                          setProjectDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition ${
                          isSelected
                            ? 'bg-sky-50 text-sky-950 font-semibold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="flex items-center gap-1.5 truncate">
                            <FolderGit2 className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-600' : 'text-slate-400'}`} />
                            <span className="truncate">{proj.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 block ml-5">
                            {proj.scenarioCount} scenarios · {proj.defectCount} defects
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </li>

          {/* 3. Category Chip (Contextual domain grouping) */}
          <li className="hidden lg:flex items-center gap-1.5 shrink-0">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 px-1.5 py-0.5 rounded bg-slate-100/80">
              {currentTabMeta.category}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </li>

          {/* 4. Current Active Section with quick switch popover */}
          <li className="relative flex items-center shrink-0" ref={sectionMenuRef}>
            <button
              onClick={() => setSectionDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-100/60 hover:bg-sky-100 border border-sky-300/80 text-sky-950 font-semibold transition"
              title="Switch module or view"
              aria-haspopup="true"
              aria-expanded={sectionDropdownOpen}
            >
              <ActiveTabIcon className={`w-3.5 h-3.5 ${currentTabMeta.accentColor || 'text-sky-600'} shrink-0`} />
              <span>{currentTabMeta.label}</span>
              <ChevronDown className="w-3 h-3 text-sky-700 shrink-0 ml-0.5" />
            </button>

            {/* Quick Section Switcher Popover */}
            {sectionDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-sky-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                  Jump to Section
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {(Object.keys(TAB_METADATA) as ActiveTab[]).map((tabKey) => {
                    const meta = TAB_METADATA[tabKey];
                    const Icon = meta.icon;
                    const isCurrent = tabKey === activeTab;
                    return (
                      <button
                        key={tabKey}
                        onClick={() => {
                          onNavigate(tabKey);
                          setSectionDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between text-xs transition ${
                          isCurrent
                            ? 'bg-sky-50 text-sky-950 font-bold'
                            : 'text-slate-700 hover:bg-slate-50 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-sky-600' : 'text-slate-400'}`} />
                          <span className="truncate">{meta.label}</span>
                        </div>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </li>

          {/* 5. Sub-Resource Node (e.g. Current Test Run in Time Machine or AI Detective) */}
          {isDetailView && currentRun && (
            <>
              <li className="flex items-center gap-1.5 shrink-0">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              </li>
              <li className="flex items-center gap-1.5 shrink-0">
                <div
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md font-mono text-[11px] border ${
                    currentRun.status === 'DEFECT_DETECTED'
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                  title={`Active Test Run: ${currentRun.scenarioName}`}
                >
                  {currentRun.status === 'DEFECT_DETECTED' ? (
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  )}
                  <span className="font-bold">
                    {currentRun.id.includes('-') ? currentRun.id.split('-').slice(0, 2).join('-').toUpperCase() : currentRun.id}
                  </span>
                  <span className="hidden sm:inline text-slate-500 font-sans font-normal truncate max-w-[140px]">
                    · {currentRun.scenarioName.split(':')[0]}
                  </span>
                </div>
              </li>
            </>
          )}
        </ol>

        {/* Right Side: Quick Action Utilities */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Copy Breadcrumb Path */}
          <button
            onClick={handleCopyPath}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
            title="Copy path to clipboard"
          >
            <Copy className="w-3 h-3" />
            <span>{copied ? 'Copied!' : 'Copy Path'}</span>
          </button>

          {/* Quick Palette Trigger Badge */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100/90 hover:bg-sky-50 text-slate-700 hover:text-sky-800 border border-slate-200 hover:border-sky-200 transition shadow-2xs"
              title="Open Command Palette (Cmd+K)"
            >
              <Command className="w-3 h-3 text-sky-600" />
              <span className="hidden sm:inline">Palette</span>
              <kbd className="font-mono text-[10px] px-1 py-0.2 rounded bg-white text-slate-600 border border-slate-200 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
