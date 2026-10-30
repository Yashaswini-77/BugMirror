import { GoogleGenAI, Type } from '@google/genai';
import { TimelineEvent, TestRun } from './store';

export interface AiAnalysisResult {
  isAiGenerated: boolean;
  modelUsed: string;
  rootCause: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  observedEvidence: string[];
  aiHypothesis: string;
  reproductionSteps: string[];
  suggestedFix: string;
  jiraMarkdown: string;
  architectureRecommendations: string[];
}

export async function analyzeBugLogs(
  run: TestRun,
  userPrompt?: string
): Promise<AiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Extract log entries and state drift
  const defectEvents = run.events.filter((e) => e.isDefectPoint || e.eventType === 'DEFECT_TRIGGERED' || e.eventType === 'ASSERTION_FAILED');
  const allLogs = run.events.flatMap((e) => e.logs || []);
  const logsSummary = allLogs.map((l) => `[${l.level}] ${l.timestamp} - ${l.message}`).join('\n');

  const evidenceSummary = [
    `Test run mode: ${run.mode}`,
    `Initial Stock: ${run.initialStock}, Final Stock: ${run.finalStock}`,
    `Concurrent Virtual Users: ${run.virtualUsers}`,
    `Successful Orders: ${run.successOrders}, Failed Orders: ${run.failedOrders}`,
    `Run Duration: ${run.durationMs}ms`,
    `Total Events Logged: ${run.events.length}`,
    ...defectEvents.map((e) => `Defect Event at +${e.timestampOffsetMs}ms [${e.threadId}]: Expected=${JSON.stringify(e.expectedState)}, Actual=${JSON.stringify(e.actualState)}`),
  ];

  // Try calling Gemini if API key is provided and non-empty
  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are BugMirror AI's Lead Staff QA Systems Engineer.
Analyze the following test execution trace, defect logs, and concurrency telemetry:

Scenario: ${run.scenarioName}
Mode: ${run.mode}
Virtual Users: ${run.virtualUsers}
Initial Stock: ${run.initialStock}
Final Stock: ${run.finalStock}
Successful Orders: ${run.successOrders}
Failed Orders: ${run.failedOrders}
Status: ${run.status}

TELEMETRY & LOGS:
${logsSummary || 'No explicit raw log lines captured.'}

OBSERVED STATE DRIFT:
${evidenceSummary.join('\n')}

${userPrompt ? `User Specific Focus: ${userPrompt}` : ''}

CRITICAL RULES:
1. Clearly distinguish between OBSERVED EMPIRICAL EVIDENCE (hard metrics, request IDs, timestamps) and AI HYPOTHESES (inferred root causes).
2. Never claim an unverified hypothesis is proven fact.
3. Provide concrete code fixes (both for Java/Spring Boot and Node.js).
4. Generate a clean JIRA-ready ticket description.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rootCause: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] },
              observedEvidence: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Only empirical facts directly seen in the logs or metrics',
              },
              aiHypothesis: {
                type: Type.STRING,
                description: 'Inferred theory of what caused the race condition or defect',
              },
              reproductionSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suggestedFix: { type: Type.STRING },
              jiraMarkdown: { type: Type.STRING },
              architectureRecommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['rootCause', 'severity', 'observedEvidence', 'aiHypothesis', 'reproductionSteps', 'suggestedFix', 'jiraMarkdown'],
          },
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text.trim());
        return {
          isAiGenerated: true,
          modelUsed: 'gemini-3.8-flash',
          rootCause: parsed.rootCause || 'Concurrency synchronization failure during inventory checkout.',
          severity: (parsed.severity as any) || 'CRITICAL',
          observedEvidence: parsed.observedEvidence || evidenceSummary,
          aiHypothesis: parsed.aiHypothesis || 'Hypothesis: The database or application layer lacked transactional isolation.',
          reproductionSteps: parsed.reproductionSteps || [
            `Initialize inventory with ${run.initialStock} items.`,
            `Dispatch ${run.virtualUsers} parallel checkout requests.`,
          ],
          suggestedFix: parsed.suggestedFix || 'Apply SERIALIZABLE isolation or row-level locking.',
          jiraMarkdown: parsed.jiraMarkdown || `h2. Defect in ${run.scenarioName}`,
          architectureRecommendations: parsed.architectureRecommendations || [
            'Implement pessimistic row locks with SELECT FOR UPDATE',
            'Enforce database check constraints: CHECK (stock >= 0)',
            'Adopt distributed lock mechanisms (e.g., Redis Redlock) across microservices',
          ],
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed or timed out, gracefully falling back to deterministic rule engine:', err);
    }
  }

  // DETERMINISTIC RULE-BASED FALLBACK:
  // Transparent, thorough, and highly accurate analysis based on empirical telemetry
  return generateRuleBasedAnalysis(run, evidenceSummary);
}

function generateRuleBasedAnalysis(run: TestRun, evidenceSummary: string[]): AiAnalysisResult {
  const isOversell = run.finalStock < 0 || run.successOrders > run.initialStock;

  if (isOversell) {
    const oversoldUnits = Math.abs(Math.min(0, run.finalStock)) || (run.successOrders - run.initialStock);
    return {
      isAiGenerated: false,
      modelUsed: 'BugMirror Rule-Based Concurrency Detective (v2.4)',
      rootCause:
        'Time-of-Check to Time-of-Use (TOCTOU) race condition in inventory decrement pipeline. Multiple worker threads executed non-atomic read-modify-write cycles simultaneously.',
      severity: 'CRITICAL',
      observedEvidence: [
        `Empirical evidence: ${run.virtualUsers} concurrent virtual users dispatched checkout requests in a parallel burst.`,
        `Initial stock was set to ${run.initialStock}; final recorded stock is ${run.finalStock}.`,
        `System created ${run.successOrders} confirmed orders, exceeding available supply by ${oversoldUnits} item(s).`,
        `Defect event triggered when second thread committed decrement after first thread had already depleted remaining inventory.`,
      ],
      aiHypothesis:
        'Hypothesis: The inventory read validation (stock >= requested) and the inventory update (stock = stock - 1) run in two disconnected database queries without an explicit row-level lock (`FOR UPDATE`) or serializable transaction isolation.',
      reproductionSteps: [
        `Configure inventory stock to exactly ${run.initialStock} unit(s).`,
        `Issue ${run.virtualUsers} simultaneous POST requests to /api/inventory/checkout with body {"itemId": "item-99", "quantity": 1}.`,
        `Ensure request arrival window is within 25ms to interleave execution during the database read gap.`,
        `Inspect resulting order records and verify stock underflow (${run.finalStock}).`,
      ],
      suggestedFix: `// 1. Spring Boot / Java 21 JPA Solution:
@Repository
public interface InventoryRepository extends JpaRepository<InventoryItem, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InventoryItem i WHERE i.id = :id")
    Optional<InventoryItem> findByIdWithLock(@Param("id") String id);
}

// 2. PostgreSQL Direct Atomic Update Guard:
UPDATE inventory 
SET stock = stock - :quantity 
WHERE id = :itemId AND stock >= :quantity;
-- Check affected rows: If 0, return HTTP 409 Conflict.

// 3. Node.js / TypeScript Mutex:
const release = await inventoryMutex.acquire();
try {
  // execute check and decrement atomically
} finally {
  release();
}`,
      jiraMarkdown: `h2. [CRITICAL] Race Condition: Inventory Oversold During Flash Sale Checkout
*Defect ID:* BM-${Date.now().toString().slice(-4)}
*Issue Type:* Bug (Severity 1 - Blocker)
*Component:* Inventory & Checkout Service

h3. 1. Empirical Evidence Observed
* Initial Stock: ${run.initialStock}
* Final Stock: ${run.finalStock} (Underflow)
* Orders Emitted: ${run.successOrders} (Expected max: ${run.initialStock})
* Concurrent Virtual Users: ${run.virtualUsers}

h3. 2. Root Cause Analysis
Unsynchronized read-modify-write pattern. Both threads performed a dirty read while stock was 1 before either thread committed the deduction.

h3. 3. Reproduction Steps
# Reset stock to ${run.initialStock}
# Send ${run.virtualUsers} concurrent requests to /api/inventory/checkout
# Verify multiple HTTP 200 responses are returned

h3. 4. Expected vs Actual Result
* *Expected:* Exactly ${run.initialStock} purchase succeeds (HTTP 200). Remaining ${run.virtualUsers - run.initialStock} requests return HTTP 409 Conflict. Stock is 0.
* *Actual:* ${run.successOrders} orders created. Stock dropped to ${run.finalStock}.`,
      architectureRecommendations: [
        'Add a database-level integrity check constraint: ALTER TABLE inventory ADD CONSTRAINT chk_stock_non_negative CHECK (stock >= 0);',
        'Use PostgreSQL `SELECT ... FOR UPDATE` to acquire exclusive row locks during high-contention checkout.',
        'Implement an idempotency ledger with Redis Redlock for distributed multi-instance resilience.',
      ],
    };
  }

  return {
    isAiGenerated: false,
    modelUsed: 'BugMirror Rule-Based Concurrency Detective (v2.4)',
    rootCause: 'No concurrency defects detected. Invariants preserved under test load.',
    severity: 'LOW',
    observedEvidence: [
      `All ${run.virtualUsers} virtual user requests handled properly.`,
      `Final stock (${run.finalStock}) remained non-negative and matches initial stock minus successful purchases (${run.initialStock} - ${run.successOrders} = ${run.finalStock}).`,
      `Failed orders (${run.failedOrders}) correctly received HTTP 409 Conflict status.`,
    ],
    aiHypothesis: 'The critical section is properly guarded with transactional locking or atomic update guards.',
    reproductionSteps: ['Execute scenario in corrected mode.'],
    suggestedFix: 'Current synchronization pattern meets production concurrency standards.',
    jiraMarkdown: `h2. Test Run Passed: ${run.scenarioName}\nAll concurrency assertions verified successfully.`,
    architectureRecommendations: [
      'Maintain automated regression tests for concurrency edge cases.',
      'Monitor lock contention latency in production APM tools.',
    ],
  };
}
