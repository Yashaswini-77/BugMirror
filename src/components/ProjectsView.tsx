import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  Check,
  ChevronRight,
  Shield,
  Layers
} from 'lucide-react';
import { Project } from '../types';
import { api } from '../services/api';

interface ProjectsViewProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  onRefreshProjects: () => void;
  onNavigate: (tab: any) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onRefreshProjects,
  onNavigate,
}) => {
  const [showNewModal, setShowNewModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const newProj = await api.createProject(name, description);
      onRefreshProjects();
      onSelectProject(newProj.id);
      setName('');
      setDescription('');
      setShowNewModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 mb-1">
            <span className="text-sky-600 font-semibold flex items-center gap-1">
              <FolderGit2 className="w-3.5 h-3.5" /> Project Scopes
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Workspaces</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Project Workspaces</h1>
          <p className="text-xs text-slate-500">
            Organize high-concurrency test suites, defect ledgers, and team scopes.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* RBAC ROLE BANNER */}
      <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-sky-600" />
          <span className="text-slate-800 font-semibold">Active Session Role:</span>
          <span className="font-mono font-bold text-sky-700">QA Lead / Systems Architect</span>
        </div>
        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
          FULL ACCESS
        </span>
      </div>

      {/* PROJECTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((proj) => {
          const isSelected = proj.id === selectedProjectId;
          return (
            <div
              key={proj.id}
              className={`p-5 rounded-xl border transition flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-sky-50/40 border-sky-300 ring-2 ring-sky-500/20 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-slate-500">{proj.id}</span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-sky-700 bg-sky-100 px-2.5 py-0.5 rounded border border-sky-200">
                      <Check className="w-3 h-3" /> ACTIVE SCOPE
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900">{proj.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {proj.description || 'No description provided.'}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-sans font-medium">Scenarios</span>
                    <span className="font-bold text-slate-900 text-sm">{proj.scenarioCount}</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 text-[10px] block font-sans font-medium">Critical Defects</span>
                    <span className="font-bold text-rose-600 text-sm">{proj.defectCount}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onSelectProject(proj.id)}
                    disabled={isSelected}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                      isSelected
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    {isSelected ? 'Current Scope' : 'Select Project'}
                  </button>

                  <button
                    onClick={() => {
                      onSelectProject(proj.id);
                      onNavigate('dashboard');
                    }}
                    className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800 font-semibold transition"
                  >
                    <span>View Hub</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-900 text-base">Create Project Workspace</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-medium block mb-1">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe Checkout Gateway"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 font-medium"
                />
              </div>

              <div>
                <label className="text-slate-700 font-medium block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Target services and concurrency constraints..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-md p-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none font-sans"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white font-semibold shadow-xs transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
