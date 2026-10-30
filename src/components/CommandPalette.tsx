import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Zap,
  ShieldCheck,
  Activity,
  Layers,
  History,
  Terminal,
  GitBranch,
  Send,
  FileText,
  FolderGit2,
  Server,
  ArrowRight,
  Sparkles,
  Command,
  X
} from 'lucide-react';
import { ActiveTab } from './Navbar';

export interface CommandItem {
  id: string;
  title: string;
  description: string;
  category: 'Actions' | 'Navigation' | 'System';
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  keywords?: string[];
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
  onTriggerRecruiterDemo: () => void;
  onRunCorrectedComparison: () => void;
  onOpenSystemModal: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onTriggerRecruiterDemo,
  onRunCorrectedComparison,
  onOpenSystemModal,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    // High-impact Actions
    {
      id: 'action-reproduce-race',
      title: 'Reproduce a Race Condition',
      description: 'Simulate 2 concurrent buyers on 1 stock unit and replay the defect in Bug Time Machine',
      category: 'Actions',
      icon: Zap,
      badge: 'Recruiter Demo',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      keywords: ['race', 'condition', 'demo', 'bug', 'reproduce', 'concurrency', 'stock', 'oversell', 'defect', 'recruiter'],
      action: () => {
        onTriggerRecruiterDemo();
        onClose();
      },
    },
    {
      id: 'action-run-corrected',
      title: 'Run Corrected Implementation',
      description: 'Simulate with atomic transaction mutex locks and verify invariant (Stock: 0, HTTP 409 Conflict)',
      category: 'Actions',
      icon: ShieldCheck,
      badge: 'Fix Verification',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      keywords: ['fix', 'corrected', 'mutex', 'atomic', 'lock', 'pass', 'solution'],
      action: () => {
        onRunCorrectedComparison();
        onNavigate('timemachine');
        onClose();
      },
    },
    {
      id: 'action-api-execute',
      title: 'Execute Sandbox API Request',
      description: 'Open API Testing Workspace and test endpoints with custom headers and latency assertions',
      category: 'Actions',
      icon: Send,
      badge: 'REST Sandbox',
      badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
      keywords: ['api', 'rest', 'http', 'post', 'get', 'curl', 'request', 'payload'],
      action: () => {
        onNavigate('api-workspace');
        onClose();
      },
    },
    {
      id: 'action-jira-export',
      title: 'Export JIRA / GitHub Bug Report',
      description: 'Inspect logged defects and copy markdown, JIRA syntax, JSON, or CSV',
      category: 'Actions',
      icon: FileText,
      badge: 'Export',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      keywords: ['report', 'jira', 'github', 'export', 'csv', 'json', 'markdown', 'ticket'],
      action: () => {
        onNavigate('reports');
        onClose();
      },
    },

    // Navigation Items (All 10 Sections)
    {
      id: 'nav-overview',
      title: 'Go to Product Overview',
      description: 'Feature introduction, architecture highlights, and live zero-setup demo',
      category: 'Navigation',
      icon: Zap,
      keywords: ['overview', 'landing', 'home', 'intro'],
      action: () => {
        onNavigate('overview');
        onClose();
      },
    },
    {
      id: 'nav-dashboard',
      title: 'Go to Executive Dashboard',
      description: 'Live test runs, pass/fail trends, defect severity counts, and recent activity',
      category: 'Navigation',
      icon: Activity,
      keywords: ['dashboard', 'metrics', 'trends', 'kpi', 'history', 'stats'],
      action: () => {
        onNavigate('dashboard');
        onClose();
      },
    },
    {
      id: 'nav-concurrency',
      title: 'Go to Concurrency Lab',
      description: 'Stress-test 2, 5, 10, or 20 virtual workers against inventory and payment sandboxes',
      category: 'Navigation',
      icon: Layers,
      keywords: ['concurrency', 'lab', 'virtual', 'users', 'stress', 'load', 'parallel', 'threads'],
      action: () => {
        onNavigate('concurrency');
        onClose();
      },
    },
    {
      id: 'nav-timemachine',
      title: 'Go to Bug Time Machine',
      description: 'Replay defects checkpoint by checkpoint, comparing Expected vs Actual database state',
      category: 'Navigation',
      icon: History,
      badge: 'Core Feature',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      keywords: ['time', 'machine', 'replay', 'timeline', 'scrubber', 'step', 'diff', 'state'],
      action: () => {
        onNavigate('timemachine');
        onClose();
      },
    },
    {
      id: 'nav-detective',
      title: 'Go to AI Bug Detective',
      description: 'Automated telemetry inspection, empirical evidence separation, and Spring Boot / TS code fixes',
      category: 'Navigation',
      icon: Terminal,
      keywords: ['ai', 'detective', 'root', 'cause', 'gemini', 'heuristic', 'fix', 'patch'],
      action: () => {
        onNavigate('detective');
        onClose();
      },
    },
    {
      id: 'nav-scenarios',
      title: 'Go to Scenario Builder',
      description: 'Build custom sequences: login, add to cart, check inventory, and checkout payment',
      category: 'Navigation',
      icon: GitBranch,
      keywords: ['scenario', 'builder', 'steps', 'pipeline', 'sequence', 'template'],
      action: () => {
        onNavigate('scenarios');
        onClose();
      },
    },
    {
      id: 'nav-api-workspace',
      title: 'Go to API Testing Workspace',
      description: 'Interactive HTTP client with assertion engine for response status and max latency',
      category: 'Navigation',
      icon: Send,
      keywords: ['api', 'workspace', 'http', 'rest', 'client', 'postman'],
      action: () => {
        onNavigate('api-workspace');
        onClose();
      },
    },
    {
      id: 'nav-reports',
      title: 'Go to Bug Reports Generator',
      description: 'Generate standardized defect reports formatted for engineering ticketing systems',
      category: 'Navigation',
      icon: FileText,
      keywords: ['reports', 'generator', 'jira', 'tickets', 'documentation'],
      action: () => {
        onNavigate('reports');
        onClose();
      },
    },
    {
      id: 'nav-quality',
      title: 'Go to Test Quality Center',
      description: 'Track instrumented scenario health, repeat failures, and race condition flakiness',
      category: 'Navigation',
      icon: ShieldCheck,
      keywords: ['quality', 'center', 'flakiness', 'pass', 'rate', 'coverage', 'radar'],
      action: () => {
        onNavigate('quality');
        onClose();
      },
    },
    {
      id: 'nav-projects',
      title: 'Go to Project Workspaces',
      description: 'Manage projects, test suites, and team scopes with role-based access',
      category: 'Navigation',
      icon: FolderGit2,
      keywords: ['projects', 'workspace', 'rbac', 'scopes', 'manage'],
      action: () => {
        onNavigate('projects');
        onClose();
      },
    },

    // System Information
    {
      id: 'system-runtime',
      title: 'Inspect System Architecture & Runtime',
      description: 'Node.js 22 LTS active reactive engine, Java 21 / Spring Boot 3 reference backend, and ACID storage',
      category: 'System',
      icon: Server,
      keywords: ['system', 'architecture', 'runtime', 'java', 'spring', 'boot', 'status', 'telemetry', 'info'],
      action: () => {
        onOpenSystemModal();
        onClose();
      },
    },
  ];

  // Filter commands by search query
  const filteredCommands = commands.filter((cmd) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const titleMatch = cmd.title.toLowerCase().includes(q);
    const descMatch = cmd.description.toLowerCase().includes(q);
    const catMatch = cmd.category.toLowerCase().includes(q);
    const keywordMatch = cmd.keywords?.some((k) => k.toLowerCase().includes(q));
    return titleMatch || descMatch || catMatch || keywordMatch;
  });

  // Focus input on open & reset
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keep selected index within bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeElement = listRef.current.querySelector('[data-selected="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group commands by category
  const categories: Array<'Actions' | 'Navigation' | 'System'> = ['Actions', 'Navigation', 'System'];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white border border-sky-200/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-sky-100 bg-gradient-to-r from-sky-50/50 to-white">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-950 shrink-0 ring-1 ring-sky-300/80 shadow-xs">
            <img
              src="/assets/aistudio/Futuristic_Glass_Cube_with_Glowing_Core_fece868d.png"
              alt="BugMirror Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, scenario name, or quick action..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-slate-600 transition"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            ESC
          </kbd>
        </div>

        {/* Command List Items */}
        <div
          ref={listRef}
          className="overflow-y-auto p-2 space-y-4 divide-y divide-sky-100/60 max-h-[55vh]"
        >
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">No matching commands found</p>
              <p className="text-xs text-slate-400">
                Try searching for &quot;race condition&quot;, &quot;time machine&quot;, &quot;api&quot;, or &quot;dashboard&quot;
              </p>
            </div>
          ) : (
            categories.map((category) => {
              const itemsInCategory = filteredCommands.filter((c) => c.category === category);
              if (itemsInCategory.length === 0) return null;

              return (
                <div key={category} className="pt-2 first:pt-0 space-y-1">
                  <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-600">
                    {category}
                  </div>
                  <div className="space-y-0.5">
                    {itemsInCategory.map((item) => {
                      const globalIndex = filteredCommands.findIndex((c) => c.id === item.id);
                      const isSelected = globalIndex === selectedIndex;
                      const Icon = item.icon;

                      return (
                        <button
                          key={item.id}
                          data-selected={isSelected}
                          onClick={() => item.action()}
                          onMouseEnter={() => setSelectedIndex(globalIndex)}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-sky-50 text-slate-900 shadow-2xs border-l-4 border-sky-600'
                              : 'text-slate-700 hover:bg-slate-50 border-l-4 border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold ${isSelected ? 'text-sky-950' : 'text-slate-800'}`}>
                                  {item.title}
                                </span>
                                {item.badge && (
                                  <span
                                    className={`text-[10px] font-mono px-2 py-0.2 rounded-full border ${item.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200'}`}
                                  >
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate leading-snug">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-sky-700 font-medium">
                                <span>Press Enter</span>
                                <ArrowRight className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Bar with Keyboard Legend */}
        <div className="px-4 py-2.5 bg-slate-50/90 border-t border-sky-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">↓</kbd>
              <span className="ml-1 text-slate-600 font-sans">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">↵</kbd>
              <span className="ml-1 text-slate-600 font-sans">Select</span>
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">ESC</kbd>
              <span className="ml-1 text-slate-600 font-sans">Close</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-600">
            <Command className="w-3 h-3" />
            <span className="font-sans font-medium">BugMirror AI Quick Navigator</span>
          </div>
        </div>
      </div>
    </div>
  );
};
