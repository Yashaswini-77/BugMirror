import fs from 'fs';
import path from 'path';

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

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

interface StoreData {
  projects: Project[];
  scenarios: Scenario[];
  runs: TestRun[];
  defects: DefectItem[];
}

// Initial Seed Data
const DEFAULT_STORE: StoreData = {
  projects: [
    {
      id: 'proj-1',
      name: 'OmniStore E-Commerce Core',
      description: 'High-throughput shopping cart, stock management, and flash-sale checkout APIs.',
      createdAt: '2026-10-10T10:00:00.000Z',
      status: 'active',
      scenarioCount: 4,
      defectCount: 2,
    },
    {
      id: 'proj-2',
      name: 'PayFlow Banking Gateway',
      description: 'Microservice handling balance transfers, double-spend prevention, and payment tokens.',
      createdAt: '2026-10-12T14:30:00.000Z',
      status: 'active',
      scenarioCount: 3,
      defectCount: 1,
    },
    {
      id: 'proj-3',
      name: 'TicketSprint Global Ticketing',
      description: 'Seat reservation lock manager and burst concurrent seat allocation.',
      createdAt: '2026-10-15T09:15:00.000Z',
      status: 'active',
      scenarioCount: 2,
      defectCount: 1,
    },
  ],
  scenarios: [
    {
      id: 'scen-race-inventory',
      projectId: 'proj-1',
      name: 'Flash Sale: 2 Concurrent Users On 1 Last Item (Race Condition)',
      description: 'Simulates two virtual buyers submitting concurrent purchase requests for a single unit of stock. Detects overselling and dirty reads.',
      category: 'concurrency',
      virtualUsers: 2,
      passRate: 50,
      totalRuns: 14,
      createdAt: '2026-10-10T11:00:00.000Z',
      lastRunAt: '2026-10-20T07:15:00.000Z',
      steps: [
        {
          id: 'step-1',
          name: 'Concurrent User Authentication',
          type: 'LOGIN_AUTH',
          endpoint: '/api/sandbox/users/login',
          method: 'POST',
          delayMs: 20,
          expectedStatus: 200,
          expectedAssertion: 'token != null',
        },
        {
          id: 'step-2',
          name: 'Inspect Stock Availability',
          type: 'VERIFY_INVENTORY',
          endpoint: '/api/sandbox/inventory/item-99',
          method: 'GET',
          delayMs: 15,
          expectedStatus: 200,
          expectedAssertion: 'stock >= 1',
        },
        {
          id: 'step-3',
          name: 'Simultaneous Checkout Request',
          type: 'CHECKOUT_PAYMENT',
          endpoint: '/api/sandbox/inventory/checkout',
          method: 'POST',
          payload: { itemId: 'item-99', quantity: 1 },
          delayMs: 0,
          expectedStatus: 200,
          expectedAssertion: 'exactly_one_success_and_stock_non_negative',
        },
      ],
    },
    {
      id: 'scen-coupon-double-spend',
      projectId: 'proj-1',
      name: 'Promo Code Double-Spend Under Parallel Submissions',
      description: 'Validates that a single-use $50 welcome coupon cannot be applied in parallel checkout sessions by the same customer.',
      category: 'concurrency',
      virtualUsers: 5,
      passRate: 75,
      totalRuns: 8,
      createdAt: '2026-10-12T16:00:00.000Z',
      lastRunAt: '2026-10-19T18:40:00.000Z',
      steps: [
        {
          id: 'step-c1',
          name: 'Load Cart State',
          type: 'ADD_TO_CART',
          endpoint: '/api/sandbox/cart/items',
          method: 'POST',
          delayMs: 10,
          expectedStatus: 200,
        },
        {
          id: 'step-c2',
          name: 'Parallel Coupon Redemption',
          type: 'CALL_API',
          endpoint: '/api/sandbox/cart/apply-coupon',
          method: 'POST',
          payload: { couponCode: 'SAVE50-SINGLE-USE' },
          delayMs: 0,
          expectedStatus: 200,
          expectedAssertion: 'only_one_successful_redemption',
        },
      ],
    },
    {
      id: 'scen-negative-inventory-injection',
      projectId: 'proj-1',
      name: 'Cart Quantity Underflow & Boundary Validation',
      description: 'Attempts to supply negative integer quantities (-1, 0, 9999999) to verify server-side defensive input guards.',
      category: 'ecommerce',
      virtualUsers: 1,
      passRate: 100,
      totalRuns: 19,
      createdAt: '2026-10-13T08:00:00.000Z',
      lastRunAt: '2026-10-20T06:00:00.000Z',
      steps: [
        {
          id: 'step-u1',
          name: 'Negative Quantity Update',
          type: 'UPDATE_QUANTITY',
          endpoint: '/api/sandbox/cart/update-quantity',
          method: 'POST',
          payload: { itemId: 'item-99', quantity: -5 },
          delayMs: 25,
          expectedStatus: 400,
          expectedAssertion: 'status == 400 && error == "INVALID_QUANTITY"',
        },
      ],
    },
    {
      id: 'scen-idempotency-replay',
      projectId: 'proj-2',
      name: 'Payment Webhook Idempotency & Network Retry Storm',
      description: 'Simulates payment gateway webhook duplicate dispatches with identical Idempotency-Key headers.',
      category: 'api',
      virtualUsers: 10,
      passRate: 90,
      totalRuns: 12,
      createdAt: '2026-10-14T12:00:00.000Z',
      lastRunAt: '2026-10-19T21:10:00.000Z',
      steps: [
        {
          id: 'step-i1',
          name: 'Duplicate Payment Dispatch',
          type: 'CALL_API',
          endpoint: '/api/sandbox/payments/charge',
          method: 'POST',
          payload: { amount: 49.99, idempotencyKey: 'idem_9901_fixed' },
          delayMs: 5,
          expectedStatus: 200,
          expectedAssertion: 'duplicate_requests_return_cached_receipt',
        },
      ],
    },
  ],
  runs: [],
  defects: [],
};

class Store {
  private data: StoreData;

  constructor() {
    this.data = this.load();
    if (this.data.runs.length === 0) {
      this.seedInitialRuns();
    }
  }

  private load(): StoreData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not load data file, using default store in-memory:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STORE));
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not save data file:', e);
    }
  }

  public getProjects(): Project[] {
    return this.data.projects;
  }

  public addProject(project: Omit<Project, 'id' | 'createdAt' | 'scenarioCount' | 'defectCount'>): Project {
    const newProj: Project = {
      ...project,
      id: `proj-${Date.now()}`,
      createdAt: new Date().toISOString(),
      scenarioCount: 0,
      defectCount: 0,
    };
    this.data.projects.unshift(newProj);
    this.save();
    return newProj;
  }

  public getScenarios(projectId?: string): Scenario[] {
    if (projectId) {
      return this.data.scenarios.filter((s) => s.projectId === projectId);
    }
    return this.data.scenarios;
  }

  public getScenarioById(id: string): Scenario | undefined {
    return this.data.scenarios.find((s) => s.id === id);
  }

  public addScenario(scenario: Omit<Scenario, 'id' | 'createdAt' | 'totalRuns' | 'passRate'>): Scenario {
    const newScen: Scenario = {
      ...scenario,
      id: `scen-${Date.now()}`,
      createdAt: new Date().toISOString(),
      totalRuns: 0,
      passRate: 100,
    };
    this.data.scenarios.unshift(newScen);
    // increment project scenarioCount
    const p = this.data.projects.find((proj) => proj.id === scenario.projectId);
    if (p) p.scenarioCount += 1;
    this.save();
    return newScen;
  }

  public updateScenario(id: string, updates: Partial<Scenario>): Scenario | undefined {
    const idx = this.data.scenarios.findIndex((s) => s.id === id);
    if (idx === -1) return undefined;
    this.data.scenarios[idx] = { ...this.data.scenarios[idx], ...updates };
    this.save();
    return this.data.scenarios[idx];
  }

  public getRuns(filter?: { projectId?: string; status?: string }): TestRun[] {
    let list = this.data.runs;
    if (filter?.projectId) {
      list = list.filter((r) => r.projectId === filter.projectId);
    }
    if (filter?.status) {
      list = list.filter((r) => r.status === filter.status);
    }
    return list;
  }

  public getRunById(id: string): TestRun | undefined {
    return this.data.runs.find((r) => r.id === id);
  }

  public addRun(run: TestRun): void {
    this.data.runs.unshift(run);
    // update scenario metadata
    const scen = this.data.scenarios.find((s) => s.id === run.scenarioId);
    if (scen) {
      scen.totalRuns += 1;
      scen.lastRunAt = run.completedAt;
      const allScenRuns = this.data.runs.filter((r) => r.scenarioId === scen.id);
      const passedCount = allScenRuns.filter((r) => r.status === 'PASSED').length;
      scen.passRate = Math.round((passedCount / allScenRuns.length) * 100);
      if (allScenRuns.some((r) => r.status === 'PASSED') && allScenRuns.some((r) => r.status === 'DEFECT_DETECTED' || r.status === 'FAILED')) {
        scen.isFlaky = true;
      }
    }

    // if defect detected, log defect item
    if (run.status === 'DEFECT_DETECTED' && run.defectSummary) {
      const defect: DefectItem = {
        id: `DEF-${Date.now().toString().slice(-6)}`,
        runId: run.id,
        scenarioId: run.scenarioId,
        title: run.defectSummary,
        severity: 'CRITICAL',
        category: 'Concurrency Race Condition',
        status: 'OPEN',
        detectedAt: run.completedAt,
        rootCause: run.aiAnalysis?.rootCause || 'Unsynchronized non-atomic check-then-act execution.',
      };
      this.data.defects.unshift(defect);
      const proj = this.data.projects.find((p) => p.id === run.projectId);
      if (proj) proj.defectCount += 1;
    }

    this.save();
  }

  public getDefects(): DefectItem[] {
    return this.data.defects;
  }

  private seedInitialRuns(): void {
    // Generate a rich seeded defective test run and a corrected test run for immediate recruiter exploration
    const defectiveRunId = 'run-seed-defective-race';
    const correctedRunId = 'run-seed-corrected-atomic';

    const defectiveRun: TestRun = {
      id: defectiveRunId,
      scenarioId: 'scen-race-inventory',
      scenarioName: 'Flash Sale: 2 Concurrent Users On 1 Last Item (Race Condition)',
      projectId: 'proj-1',
      mode: 'defective',
      virtualUsers: 2,
      initialStock: 1,
      finalStock: -1,
      successOrders: 2,
      failedOrders: 0,
      status: 'DEFECT_DETECTED',
      startedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 2 + 320).toISOString(),
      durationMs: 320,
      defectSummary: 'Race Condition Detected: 2 orders succeeded for 1 available stock unit (Inventory underflow: final stock = -1)',
      events: [
        {
          id: 'evt-1',
          stepIndex: 0,
          timestampOffsetMs: 0,
          threadId: 'Thread-Worker-1',
          virtualUser: 1,
          eventType: 'USER_ACTION',
          title: 'User 1 Dispatches Checkout Request',
          details: 'Buyer 1 initiated POST /api/inventory/checkout with itemId: "item-99", quantity: 1',
          expectedState: { stock: 1, user1Cart: 1, user2Cart: 1 },
          actualState: { stock: 1, user1Cart: 1, user2Cart: 1 },
          requestData: {
            requestId: 'req_u1_a9f24',
            method: 'POST',
            endpoint: '/api/inventory/checkout',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': 'user_alpha' },
            body: { itemId: 'item-99', quantity: 1 },
          },
          logs: [
            { level: 'INFO', message: 'HTTP POST /api/inventory/checkout received from client IP 192.168.1.101', timestamp: '14:20:00.002' },
          ],
        },
        {
          id: 'evt-2',
          stepIndex: 0,
          timestampOffsetMs: 2,
          threadId: 'Thread-Worker-2',
          virtualUser: 2,
          eventType: 'USER_ACTION',
          title: 'User 2 Dispatches Concurrent Checkout Request',
          details: 'Buyer 2 initiated POST /api/inventory/checkout with itemId: "item-99", quantity: 1',
          expectedState: { stock: 1, user1Cart: 1, user2Cart: 1 },
          actualState: { stock: 1, user1Cart: 1, user2Cart: 1 },
          requestData: {
            requestId: 'req_u2_c81d0',
            method: 'POST',
            endpoint: '/api/inventory/checkout',
            headers: { 'Content-Type': 'application/json', 'X-User-Id': 'user_beta' },
            body: { itemId: 'item-99', quantity: 1 },
          },
          logs: [
            { level: 'INFO', message: 'HTTP POST /api/inventory/checkout received from client IP 192.168.1.102', timestamp: '14:20:00.004' },
          ],
        },
        {
          id: 'evt-3',
          stepIndex: 1,
          timestampOffsetMs: 14,
          threadId: 'Thread-Worker-1',
          virtualUser: 1,
          eventType: 'DB_READ',
          title: 'Thread 1 Reads Inventory State',
          details: 'SELECT stock FROM inventory WHERE item_id = "item-99" -> Result: 1. Condition (stock >= 1) EVALUATES TRUE.',
          expectedState: { stock: 1, thread1Checked: true },
          actualState: { stock: 1, thread1Checked: true },
          logs: [
            { level: 'DEBUG', message: '[Thread-1] DB query SELECT stock FROM items WHERE id="item-99" returned 1', timestamp: '14:20:00.016' },
            { level: 'INFO', message: '[Thread-1] Validation passed: currentStock (1) >= requested (1)', timestamp: '14:20:00.018' },
          ],
        },
        {
          id: 'evt-4',
          stepIndex: 1,
          timestampOffsetMs: 16,
          threadId: 'Thread-Worker-2',
          virtualUser: 2,
          eventType: 'DB_READ',
          title: 'Thread 2 Reads Stale Inventory (Dirty Read Hazard)',
          details: 'SELECT stock FROM inventory WHERE item_id = "item-99" -> Result: 1. Thread 1 has NOT yet committed its deduction! Condition (stock >= 1) EVALUATES TRUE.',
          expectedState: { stock: 0, thread2Checked: false },
          actualState: { stock: 1, thread2Checked: true },
          logs: [
            { level: 'WARN', message: '[Thread-2] DB query returned stock=1 without acquiring a lock (READ_COMMITTED gap)', timestamp: '14:20:00.020' },
            { level: 'INFO', message: '[Thread-2] Validation passed: currentStock (1) >= requested (1)', timestamp: '14:20:00.022' },
          ],
        },
        {
          id: 'evt-5',
          stepIndex: 2,
          timestampOffsetMs: 38,
          threadId: 'Thread-Worker-1',
          virtualUser: 1,
          eventType: 'DB_WRITE',
          title: 'Thread 1 Decrements Stock and Emits Order',
          details: 'UPDATE inventory SET stock = stock - 1 (1 - 1 = 0). Order #ORD-8801 confirmed.',
          expectedState: { stock: 0, ordersCreated: 1 },
          actualState: { stock: 0, ordersCreated: 1 },
          responseData: {
            status: 200,
            latencyMs: 38,
            body: { success: true, orderId: 'ORD-8801', remainingStock: 0 },
          },
          logs: [
            { level: 'INFO', message: '[Thread-1] UPDATE inventory SET stock = 0 WHERE id="item-99"', timestamp: '14:20:00.040' },
            { level: 'INFO', message: '[Thread-1] Order ORD-8801 persisted to database. HTTP 200 returned.', timestamp: '14:20:00.042' },
          ],
        },
        {
          id: 'evt-6',
          stepIndex: 2,
          timestampOffsetMs: 44,
          threadId: 'Thread-Worker-2',
          virtualUser: 2,
          eventType: 'DEFECT_TRIGGERED',
          title: 'CRITICAL DEFECT: Thread 2 Decrements Depleted Stock (Underflow)',
          details: 'Thread 2 executes UPDATE inventory SET stock = stock - 1 (0 - 1 = -1)! Stock drops to negative. Order #ORD-8802 confirmed.',
          expectedState: { stock: 0, ordersCreated: 1, thread2Status: 409 },
          actualState: { stock: -1, ordersCreated: 2, thread2Status: 200 },
          isDefectPoint: true,
          responseData: {
            status: 200,
            latencyMs: 42,
            body: { success: true, orderId: 'ORD-8802', remainingStock: -1 },
          },
          logs: [
            { level: 'ERROR', message: '[Thread-2] Invariant violation! Stock reduced below zero: -1', timestamp: '14:20:00.046' },
            { level: 'ERROR', message: '[BugMirror Monitor] RACE CONDITION DETECTED! Oversold item "item-99" by 1 unit.', timestamp: '14:20:00.048' },
          ],
        },
        {
          id: 'evt-7',
          stepIndex: 3,
          timestampOffsetMs: 50,
          threadId: 'Monitor-Thread',
          virtualUser: 0,
          eventType: 'ASSERTION_FAILED',
          title: 'Assertion Failed: Inventory Invariant Violated',
          details: 'Assertion [stock >= 0 && successfulOrders <= initialStock] failed. Expected <= 1 orders, got 2. Expected stock >= 0, got -1.',
          expectedState: { stock: 0, totalPurchases: 1, oversold: false },
          actualState: { stock: -1, totalPurchases: 2, oversold: true },
          isDefectPoint: true,
          logs: [
            { level: 'ERROR', message: 'Test execution failed invariant test: NonNegativeInventoryConstraint', timestamp: '14:20:00.052' },
          ],
        },
      ],
      aiAnalysis: {
        isAiGenerated: false,
        modelUsed: 'BugMirror Rule-Based Concurrency Detective',
        rootCause: 'Time-of-Check to Time-of-Use (TOCTOU) race condition in InventoryService.checkout() without database row lock or transaction isolation.',
        severity: 'CRITICAL',
        observedEvidence: [
          'Two concurrent HTTP POST requests arrived within 2.1ms of each other (req_u1_a9f24 and req_u2_c81d0).',
          'Both Thread 1 and Thread 2 read stock=1 prior to any database write occurring.',
          'Thread 2 committed an inventory decrement (0 - 1 = -1) after Thread 1 already purchased the final unit.',
          'Database persisted a negative integer stock value (-1) and generated two successful order confirmations (ORD-8801, ORD-8802).',
        ],
        reproductionSteps: [
          'Reset item "item-99" stock to exactly 1.',
          'Send 2 simultaneous HTTP POST requests to /api/inventory/checkout with payload {"itemId": "item-99", "quantity": 1}.',
          'Ensure request execution interleaves between the stock validation query and the update query.',
          'Observe that both requests receive HTTP 200 OK and database stock drops to -1.',
        ],
        suggestedFix: `// Java / Spring Boot Fix:
@Transactional(isolation = Isolation.SERIALIZABLE)
// Or use pessimistic row-level locking:
@Query("SELECT i FROM Inventory i WHERE i.id = :id FOR UPDATE")
Optional<Inventory> findByIdWithPessimisticLock(@Param("id") String id);

// In Node.js / TypeScript:
// Use an atomic SQL update with a guard:
// UPDATE inventory SET stock = stock - :qty WHERE id = :id AND stock >= :qty;
// Or wrap the critical section in an async Mutex.`,
        jiraMarkdown: `h2. [CRITICAL] Race Condition: Flash Sale Overselling on item-99
*Defect ID:* BM-2026-084
*Severity:* Critical (Financial & Fulfillment Impact)
*Preconditions:* Item stock = 1 unit
*Reproduction Steps:*
# Dispatch 2 concurrent POST requests to /api/inventory/checkout
# Observe both requests return 200 OK
*Expected Result:* Exactly 1 order succeeds (HTTP 200), 2nd order fails with HTTP 409 Conflict.
*Actual Result:* 2 orders created, stock dropped to -1.`,
      },
    };

    const correctedRun: TestRun = {
      id: correctedRunId,
      scenarioId: 'scen-race-inventory',
      scenarioName: 'Flash Sale: 2 Concurrent Users On 1 Last Item (Corrected Synchronized Mode)',
      projectId: 'proj-1',
      mode: 'corrected',
      virtualUsers: 2,
      initialStock: 1,
      finalStock: 0,
      successOrders: 1,
      failedOrders: 1,
      status: 'PASSED',
      startedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 1 + 280).toISOString(),
      durationMs: 280,
      events: [
        {
          id: 'cevt-1',
          stepIndex: 0,
          timestampOffsetMs: 0,
          threadId: 'Thread-Worker-1',
          virtualUser: 1,
          eventType: 'USER_ACTION',
          title: 'User 1 Dispatches Checkout Request',
          details: 'Buyer 1 initiated POST /api/inventory/checkout (stock: 1)',
          expectedState: { stock: 1 },
          actualState: { stock: 1 },
          logs: [{ level: 'INFO', message: 'POST /api/inventory/checkout received from User 1', timestamp: '15:10:00.001' }],
        },
        {
          id: 'cevt-2',
          stepIndex: 0,
          timestampOffsetMs: 2,
          threadId: 'Thread-Worker-2',
          virtualUser: 2,
          eventType: 'USER_ACTION',
          title: 'User 2 Dispatches Concurrent Checkout Request',
          details: 'Buyer 2 initiated POST /api/inventory/checkout (stock: 1)',
          expectedState: { stock: 1 },
          actualState: { stock: 1 },
          logs: [{ level: 'INFO', message: 'POST /api/inventory/checkout received from User 2', timestamp: '15:10:00.003' }],
        },
        {
          id: 'cevt-3',
          stepIndex: 1,
          timestampOffsetMs: 12,
          threadId: 'Thread-Worker-1',
          virtualUser: 1,
          eventType: 'MUTEX_ACQUIRE',
          title: 'Thread 1 Acquires Transactional Mutex Lock',
          details: 'Thread 1 successfully locked row for "item-99". Mutex active.',
          expectedState: { lockOwner: 'Thread-1' },
          actualState: { lockOwner: 'Thread-1' },
          logs: [{ level: 'INFO', message: '[Thread-1] Acquired exclusive lock for item-99', timestamp: '15:10:00.014' }],
        },
        {
          id: 'cevt-4',
          stepIndex: 1,
          timestampOffsetMs: 15,
          threadId: 'Thread-Worker-2',
          virtualUser: 2,
          eventType: 'MUTEX_REJECT',
          title: 'Thread 2 Queued Behind Lock (Synchronized Queue)',
          details: 'Thread 2 waits for Thread 1 transaction commit before reading.',
          expectedState: { thread2Waiting: true },
          actualState: { thread2Waiting: true },
          logs: [{ level: 'DEBUG', message: '[Thread-2] Row locked by Thread-1. Waiting for lock release...', timestamp: '15:10:00.016' }],
        },
        {
          id: 'cevt-5',
          stepIndex: 2,
          timestampOffsetMs: 35,
          threadId: 'Thread-Worker-1',
          virtualUser: 1,
          eventType: 'DB_WRITE',
          title: 'Thread 1 Decrements Stock to 0 & Commits',
          details: 'Stock 1 -> 0. Order #ORD-9910 issued. Lock released.',
          expectedState: { stock: 0, order1: 'CONFIRMED' },
          actualState: { stock: 0, order1: 'CONFIRMED' },
          responseData: { status: 200, latencyMs: 35, body: { success: true, orderId: 'ORD-9910', remainingStock: 0 } },
          logs: [
            { level: 'INFO', message: '[Thread-1] Stock decremented to 0. Transaction committed.', timestamp: '15:10:00.036' },
            { level: 'INFO', message: '[Thread-1] Lock released.', timestamp: '15:10:00.038' },
          ],
        },
        {
          id: 'cevt-6',
          stepIndex: 2,
          timestampOffsetMs: 40,
          threadId: 'Thread-Worker-2',
          virtualUser: 2,
          eventType: 'STATE_CHANGE',
          title: 'Thread 2 Reads Fresh Stock (0) & Fails Gracefully',
          details: 'Thread 2 acquires lock, reads stock=0, evaluates (0 >= 1) FALSE. Returns HTTP 409 Insufficient Stock.',
          expectedState: { stock: 0, thread2Status: 409 },
          actualState: { stock: 0, thread2Status: 409 },
          responseData: { status: 409, latencyMs: 38, body: { success: false, error: 'OUT_OF_STOCK', message: 'Item sold out during checkout.' } },
          logs: [
            { level: 'WARN', message: '[Thread-2] Insufficient inventory. Current stock: 0. Refusing purchase.', timestamp: '15:10:00.042' },
            { level: 'INFO', message: '[Thread-2] HTTP 409 Conflict returned safely to User 2.', timestamp: '15:10:00.044' },
          ],
        },
        {
          id: 'cevt-7',
          stepIndex: 3,
          timestampOffsetMs: 48,
          threadId: 'Monitor-Thread',
          virtualUser: 0,
          eventType: 'ASSERTION_PASSED',
          title: 'Assertion Passed: Zero Oversell Invariant Verified',
          details: 'All invariants satisfied: Stock >= 0 (0), exactly 1 purchase succeeded, 0 inventory leakage.',
          expectedState: { stock: 0, totalPurchases: 1, oversold: false },
          actualState: { stock: 0, totalPurchases: 1, oversold: false },
          logs: [{ level: 'INFO', message: 'Validation successful: Invariants maintained.', timestamp: '15:10:00.050' }],
        },
      ],
    };

    this.data.runs.push(defectiveRun);
    this.data.runs.push(correctedRun);

    this.data.defects.push({
      id: 'DEF-880201',
      runId: defectiveRunId,
      scenarioId: 'scen-race-inventory',
      title: 'Flash Sale Overselling: 2 orders succeeded for 1 available stock unit',
      severity: 'CRITICAL',
      category: 'Concurrency Race Condition',
      status: 'OPEN',
      detectedAt: defectiveRun.completedAt,
      rootCause: 'Time-of-Check to Time-of-Use (TOCTOU) race condition in InventoryService.checkout() without database row lock or transaction isolation.',
    });

    this.save();
  }
}

export const store = new Store();
