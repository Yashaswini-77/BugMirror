export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  status: 'active' | 'archived';
  scenarioCount: number;
  defectCount: number;
}

export interface ScenarioStep {
  id: string;
  name: string;
  type: 'LOGIN_AUTH' | 'ADD_TO_CART' | 'UPDATE_QUANTITY' | 'CHECKOUT_PAYMENT' | 'CALL_API' | 'SUBMIT_FORM' | 'VERIFY_INVENTORY';
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  payload?: any;
  delayMs: number;
  expectedStatus: number;
  expectedAssertion?: string;
}

export interface Scenario {
  id: string;
  projectId: string;
  name: string;
  description: string;
  category: 'concurrency' | 'ecommerce' | 'security' | 'api' | 'workflow';
  virtualUsers: number;
  steps: ScenarioStep[];
  isFlaky?: boolean;
  createdAt: string;
  lastRunAt?: string;
  passRate: number;
  totalRuns: number;
}

export interface TimelineEvent {
  id: string;
  stepIndex: number;
  timestampOffsetMs: number;
  threadId: string;
  virtualUser: number;
  eventType: 'USER_ACTION' | 'API_REQUEST' | 'DB_READ' | 'MUTEX_ACQUIRE' | 'MUTEX_REJECT' | 'DB_WRITE' | 'STATE_CHANGE' | 'DEFECT_TRIGGERED' | 'ASSERTION_PASSED' | 'ASSERTION_FAILED';
  title: string;
  details: string;
  expectedState: Record<string, any>;
  actualState: Record<string, any>;
  requestData?: {
    requestId: string;
    method: string;
    endpoint: string;
    headers: Record<string, string>;
    body?: any;
  };
  responseData?: {
    status: number;
    latencyMs: number;
    body?: any;
  };
  logs: Array<{ level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'; message: string; timestamp: string }>;
  isDefectPoint?: boolean;
}

export interface TestRun {
  id: string;
  scenarioId: string;
  scenarioName: string;
  projectId: string;
  mode: 'defective' | 'corrected';
  virtualUsers: number;
  initialStock: number;
  finalStock: number;
  successOrders: number;
  failedOrders: number;
  status: 'PASSED' | 'FAILED' | 'DEFECT_DETECTED';
  startedAt: string;
  completedAt: string;
  durationMs: number;
  defectSummary?: string;
  events: TimelineEvent[];
  aiAnalysis?: {
    isAiGenerated: boolean;
    modelUsed: string;
    rootCause: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    observedEvidence: string[];
    reproductionSteps: string[];
    suggestedFix: string;
    jiraMarkdown: string;
    aiHypothesis?: string;
    architectureRecommendations?: string[];
  };
}

export interface DefectItem {
  id: string;
  runId: string;
  scenarioId: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED';
  detectedAt: string;
  rootCause: string;
}

export interface SystemStatus {
  status: string;
  appName: string;
  version: string;
  runtime: {
    activeEngine: string;
    javaSupport: {
      installedInContainer: boolean;
      explanation: string;
      referenceCodePath: string;
    };
    database: {
      active: string;
      fallbackReason: string;
      schemaReady: boolean;
    };
    aiProvider: {
      configured: boolean;
      provider: string;
      ruleBasedFallbackReady: boolean;
    };
  };
}
