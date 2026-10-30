import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { store, TestRun } from './server/store';
import { concurrencyEngine } from './server/concurrencyEngine';
import { analyzeBugLogs } from './server/aiDetective';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Environment constraint: Dev server must run on port 3000
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory sandbox state
let sandboxInventoryStock = 10;
const usedCoupons = new Set<string>();
const idempotencyStore = new Map<string, any>();

// ==========================================
// SYSTEM & DIAGNOSTICS APIS
// ==========================================

app.get('/api/system/status', (req: Request, res: Response) => {
  const hasGeminiKey =
    Boolean(process.env.GEMINI_API_KEY) &&
    process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';

  res.json({
    status: 'online',
    appName: 'BugMirror AI',
    version: '2.5.0-production',
    runtime: {
      activeEngine: 'Node.js 22 LTS / TypeScript Express Reactive Engine',
      javaSupport: {
        installedInContainer: false,
        explanation:
          'Java 21 runtime is not pre-installed in this lightweight container image. BugMirror AI provides a production-grade Spring Boot 3 / Java 21 reference architecture in `/backend-java-reference` complete with JUnit 5/Mockito tests, while running an active high-concurrency Node.js engine for real-time simulations.',
        referenceCodePath: 'backend-java-reference/',
      },
      database: {
        active: 'Transactional In-Memory & File-Backed Storage Engine with ACID isolation simulation',
        fallbackReason: 'Direct Postgres service unavailable in standard container; persistent JSON-ledger activated.',
        schemaReady: true,
      },
      aiProvider: {
        configured: hasGeminiKey,
        provider: hasGeminiKey ? 'Google Gemini (@google/genai / gemini-3.8-flash)' : 'Rule-Based Concurrency Detective Fallback',
        ruleBasedFallbackReady: true,
      },
    },
  });
});

// ==========================================
// PROJECTS APIS
// ==========================================

app.get('/api/projects', (req: Request, res: Response) => {
  res.json(store.getProjects());
});

app.post('/api/projects', (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Project name is required' });
  }
  const project = store.addProject({
    name: name.trim(),
    description: description?.trim() || '',
    status: 'active',
  });
  res.status(201).json(project);
});

// ==========================================
// SCENARIOS APIS
// ==========================================

app.get('/api/scenarios', (req: Request, res: Response) => {
  const { projectId } = req.query;
  res.json(store.getScenarios(projectId as string | undefined));
});

app.get('/api/scenarios/:id', (req: Request, res: Response) => {
  const scenario = store.getScenarioById(req.params.id);
  if (!scenario) {
    return res.status(404).json({ error: 'Scenario not found' });
  }
  res.json(scenario);
});

app.post('/api/scenarios', (req: Request, res: Response) => {
  const { projectId, name, description, category, virtualUsers, steps } = req.body;
  if (!projectId || !name) {
    return res.status(400).json({ error: 'Project ID and scenario name are required' });
  }
  const newScen = store.addScenario({
    projectId,
    name: name.trim(),
    description: description?.trim() || '',
    category: category || 'concurrency',
    virtualUsers: Number(virtualUsers) || 1,
    steps: steps || [],
  });
  res.status(201).json(newScen);
});

// ==========================================
// CONCURRENCY LAB SIMULATION APIS
// ==========================================

app.post('/api/concurrency/simulate', async (req: Request, res: Response) => {
  try {
    const {
      scenarioId,
      scenarioName,
      projectId,
      virtualUsers = 2,
      initialStock = 1,
      mode = 'defective',
      delayMs = 25,
      deterministic = true,
    } = req.body;

    const simulation = await concurrencyEngine.runSimulation({
      scenarioId,
      scenarioName: scenarioName || (mode === 'defective' ? 'Flash Sale Oversell Race Condition' : 'Flash Sale Synchronized Mode'),
      projectId: projectId || 'proj-1',
      virtualUsers: Number(virtualUsers),
      initialStock: Number(initialStock),
      mode,
      delayMs: Number(delayMs),
      deterministic: Boolean(deterministic),
    });

    // Save run to store
    store.addRun(simulation.run);

    res.json({
      run: simulation.run,
      results: simulation.results,
      invariantsViolated: simulation.invariantsViolated,
    });
  } catch (error: any) {
    console.error('Concurrency simulation error:', error);
    res.status(500).json({ error: 'Failed to execute concurrency simulation', message: error.message });
  }
});

// Automated Verification Suite (Runs 20 batch tests proving invariant guarantees)
app.post('/api/concurrency/verify-tests', async (req: Request, res: Response) => {
  try {
    const verification = await concurrencyEngine.runAutomatedVerificationSuite();
    res.json(verification);
  } catch (error: any) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Automated verification test suite failed', message: error.message });
  }
});

// ==========================================
// TEST RUNS & BUG TIME MACHINE APIS
// ==========================================

app.get('/api/runs', (req: Request, res: Response) => {
  const { projectId, status } = req.query;
  const runs = store.getRuns({
    projectId: projectId as string | undefined,
    status: status as string | undefined,
  });
  res.json(runs);
});

app.get('/api/runs/:id', (req: Request, res: Response) => {
  const run = store.getRunById(req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Test run not found' });
  }
  res.json(run);
});

// Run AI Bug Detective on a test run
app.post('/api/runs/:id/ai-analyze', async (req: Request, res: Response) => {
  const run = store.getRunById(req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Test run not found' });
  }

  try {
    const { userPrompt } = req.body;
    const analysis = await analyzeBugLogs(run, userPrompt);

    // Save analysis on run
    run.aiAnalysis = {
      isAiGenerated: analysis.isAiGenerated,
      modelUsed: analysis.modelUsed,
      rootCause: analysis.rootCause,
      severity: analysis.severity,
      observedEvidence: analysis.observedEvidence,
      reproductionSteps: analysis.reproductionSteps,
      suggestedFix: analysis.suggestedFix,
      jiraMarkdown: analysis.jiraMarkdown,
    };
    store.save();

    res.json(analysis);
  } catch (err: any) {
    console.error('AI analysis error:', err);
    res.status(500).json({ error: 'Failed to analyze test run', message: err.message });
  }
});

// List defects
app.get('/api/defects', (req: Request, res: Response) => {
  res.json(store.getDefects());
});

// ==========================================
// API TESTING WORKSPACE & MOCK SANDBOX
// ==========================================

// Safe built-in sandbox endpoints
app.post('/api/sandbox/users/login', (req: Request, res: Response) => {
  const { username = 'developer@bugmirror.ai', password } = req.body;
  res.json({
    token: `bm_jwt_${Date.now()}_secure_session`,
    user: {
      id: 'usr_dev_402',
      username,
      role: 'QA_LEAD',
      permissions: ['EXECUTE_TESTS', 'MANAGE_SCENARIOS', 'VIEW_TIME_MACHINE'],
    },
    expiresInSeconds: 3600,
  });
});

app.get('/api/sandbox/inventory/:id', (req: Request, res: Response) => {
  res.json({
    itemId: req.params.id,
    name: 'UltraSpeed Mechanical Keyboard V2',
    stock: sandboxInventoryStock,
    unitPrice: 129.99,
    status: sandboxInventoryStock > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
  });
});

app.post('/api/sandbox/inventory/checkout', (req: Request, res: Response) => {
  const { itemId = 'item-99', quantity = 1 } = req.body;
  const qty = Number(quantity);

  if (qty <= 0) {
    return res.status(400).json({ error: 'INVALID_QUANTITY', message: 'Quantity must be positive integer.' });
  }

  if (sandboxInventoryStock >= qty) {
    sandboxInventoryStock -= qty;
    return res.json({
      success: true,
      orderId: `ORD-${Date.now().toString().slice(-6)}`,
      itemId,
      quantity: qty,
      remainingStock: sandboxInventoryStock,
      timestamp: new Date().toISOString(),
    });
  } else {
    return res.status(409).json({
      success: false,
      error: 'OUT_OF_STOCK',
      message: `Requested ${qty} item(s), but only ${sandboxInventoryStock} available.`,
      remainingStock: sandboxInventoryStock,
    });
  }
});

app.post('/api/sandbox/cart/items', (req: Request, res: Response) => {
  const { itemId = 'item-99', quantity = 1 } = req.body;
  res.json({
    cartId: 'cart_session_881',
    items: [{ itemId, quantity, price: 129.99 }],
    subtotal: 129.99 * Number(quantity),
    currency: 'USD',
  });
});

app.post('/api/sandbox/cart/apply-coupon', (req: Request, res: Response) => {
  const { couponCode } = req.body;
  if (!couponCode) {
    return res.status(400).json({ error: 'COUPON_CODE_REQUIRED' });
  }
  if (usedCoupons.has(couponCode)) {
    return res.status(409).json({
      success: false,
      error: 'COUPON_ALREADY_USED',
      message: `Coupon ${couponCode} has already been claimed and is single-use only.`,
    });
  }
  usedCoupons.add(couponCode);
  res.json({
    success: true,
    couponCode,
    discountAmount: 50.0,
    appliedAt: new Date().toISOString(),
  });
});

app.post('/api/sandbox/cart/update-quantity', (req: Request, res: Response) => {
  const { itemId, quantity } = req.body;
  const qty = Number(quantity);
  if (isNaN(qty) || qty < 0) {
    return res.status(400).json({
      error: 'INVALID_QUANTITY',
      message: `Quantity cannot be negative (${quantity}). Guard condition enforced.`,
    });
  }
  res.json({ success: true, itemId, updatedQuantity: qty });
});

app.post('/api/sandbox/payments/charge', (req: Request, res: Response) => {
  const idempotencyKey = (req.headers['idempotency-key'] as string) || req.body.idempotencyKey;
  if (idempotencyKey && idempotencyStore.has(idempotencyKey)) {
    return res.json({
      ...idempotencyStore.get(idempotencyKey),
      cached: true,
      message: 'Idempotent replay: Returned previous transaction receipt.',
    });
  }

  const receipt = {
    chargeId: `ch_${Date.now()}_sec`,
    amount: req.body.amount || 49.99,
    status: 'succeeded',
    createdAt: new Date().toISOString(),
  };

  if (idempotencyKey) {
    idempotencyStore.set(idempotencyKey, receipt);
  }

  res.json(receipt);
});

// API Workspace Execution Proxy (Executes against internal sandbox or authorized targets)
app.post('/api/api-workspace/execute', async (req: Request, res: Response) => {
  const { method = 'GET', url, headers = {}, body } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Target URL is required' });
  }

  const startTime = Date.now();

  try {
    // If it is an internal sandbox URL, route internally or invoke via fetch
    let targetUrl = url;
    if (url.startsWith('/')) {
      targetUrl = `http://127.0.0.1:${PORT}${url}`;
    } else {
      // Validate external URL to prevent local network scanning
      const parsed = new URL(url);
      if (
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname.startsWith('10.') ||
        parsed.hostname.startsWith('192.168.') ||
        parsed.hostname === '169.254.169.254'
      ) {
        if (!url.includes(`:${PORT}/api/sandbox/`)) {
          return res.status(403).json({
            error: 'SECURITY_RESTRICTION',
            message: 'External requests to private internal network IPs are prohibited for safety.',
          });
        }
      }
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'User-Agent': 'BugMirror-AI-TestEngine/2.5',
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetchOptions.signal = controller.signal;

    const response = await fetch(targetUrl, fetchOptions);
    clearTimeout(timeout);

    const latencyMs = Date.now() - startTime;
    const contentType = response.headers.get('content-type') || '';
    let responseBody: any;

    if (contentType.includes('application/json')) {
      responseBody = await response.json();
    } else {
      responseBody = await response.text();
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    res.json({
      status: response.status,
      statusText: response.statusText,
      latencyMs,
      headers: responseHeaders,
      body: responseBody,
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    res.status(500).json({
      error: 'EXECUTION_FAILED',
      message: error.message || 'Request failed or timed out',
      latencyMs,
    });
  }
});

// ==========================================
// VITE INTEGRATION / STATIC SERVING
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BugMirror AI] Server active and listening on port ${PORT}`);
  });
}

startServer();
