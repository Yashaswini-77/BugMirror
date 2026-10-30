import { Project, Scenario, TestRun, DefectItem, SystemStatus } from '../types';

export const api = {
  async getSystemStatus(): Promise<SystemStatus> {
    const res = await fetch('/api/system/status');
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async getProjects(): Promise<Project[]> {
    const res = await fetch('/api/projects');
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  async createProject(name: string, description: string): Promise<Project> {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  async getScenarios(projectId?: string): Promise<Scenario[]> {
    const url = projectId ? `/api/scenarios?projectId=${projectId}` : '/api/scenarios';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch scenarios');
    return res.json();
  },

  async createScenario(scenario: Partial<Scenario>): Promise<Scenario> {
    const res = await fetch('/api/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scenario),
    });
    if (!res.ok) throw new Error('Failed to create scenario');
    return res.json();
  },

  async getRuns(projectId?: string, status?: string): Promise<TestRun[]> {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (status) params.append('status', status);
    const res = await fetch(`/api/runs?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch runs');
    return res.json();
  },

  async getRunById(id: string): Promise<TestRun> {
    const res = await fetch(`/api/runs/${id}`);
    if (!res.ok) throw new Error('Failed to fetch run details');
    return res.json();
  },

  async runSimulation(options: {
    scenarioId?: string;
    scenarioName?: string;
    projectId?: string;
    virtualUsers: number;
    initialStock: number;
    mode: 'defective' | 'corrected';
    delayMs?: number;
    deterministic?: boolean;
  }): Promise<{ run: TestRun; results: any[]; invariantsViolated: boolean }> {
    const res = await fetch('/api/concurrency/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Simulation execution failed');
    }
    return res.json();
  },

  async runVerificationSuite(): Promise<any> {
    const res = await fetch('/api/concurrency/verify-tests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Failed to run verification suite');
    return res.json();
  },

  async analyzeRun(runId: string, userPrompt?: string): Promise<any> {
    const res = await fetch(`/api/runs/${runId}/ai-analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userPrompt }),
    });
    if (!res.ok) throw new Error('Failed to analyze run');
    return res.json();
  },

  async getDefects(): Promise<DefectItem[]> {
    const res = await fetch('/api/defects');
    if (!res.ok) throw new Error('Failed to fetch defects');
    return res.json();
  },

  async executeApiTest(params: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
  }): Promise<any> {
    const res = await fetch('/api/api-workspace/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'API test execution failed');
    }
    return res.json();
  },
};
