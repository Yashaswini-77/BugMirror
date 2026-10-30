# BugMirror AI - Intelligent QA Engineering & Bug Time Machine

BugMirror AI is an intelligent QA engineering platform that helps developers and testers discover hidden software defects by simulating realistic user behavior, concurrent API requests, and unusual user journeys.

---

## 🌟 Core Differentiator: The Visual "Bug Time Machine"
- **Interactive Event Scrubber:** Replay simulated defects step by step across parallel worker threads.
- **State Drift Inspector:** Side-by-side comparison of **Expected State** vs **Actual State** at any millisecond offset.
- **Deep Observability:** Detailed inspection of HTTP requests, responses, DB lock acquisitions, and line-level server logs.
- **Defect Pinpointing:** Explicit flags on the exact microsecond where invariants were violated (e.g. inventory underflow).
- **1-Click AI Bug Detective & JIRA Export:** Automated root cause analysis with code fix suggestions and exportable bug reports (JSON, CSV, JIRA markdown).

---

## 🏛️ System Architecture & Dual-Stack Design

### Active Runtime Architecture (In-Container Deployment)
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend Server:** Node.js 22 LTS / Express / TypeScript running in `server.ts` with real multi-threaded simulated concurrency (`server/concurrencyEngine.ts`).
- **Data Persistence:** Transactional in-memory and persistent file-backed JSON ledger (`server/store.ts`) with realistic seed data across projects, scenarios, and defect runs.
- **AI Intelligence:** Server-side Google Gemini SDK (`@google/genai` with model `gemini-3.8-flash`) for log analysis, with an automatic, transparent rule-based heuristic fallback if `GEMINI_API_KEY` is not configured.

### Enterprise Java 21 / Spring Boot Reference Architecture (`/backend-java-reference`)
To support enterprise Java environments, a complete Spring Boot 3 & Java 21 implementation is provided:
- `backend-java-reference/src/main/java/com/bugmirror/service/InventoryService.java`: Shows both the defective un-isolated TOCTOU pattern and the production-hardened `@Transactional(isolation = Isolation.SERIALIZABLE)` / `ReentrantLock` pattern.
- `backend-java-reference/src/test/java/com/bugmirror/InventoryConcurrencyTest.java`: JUnit 5 + Mockito 20-thread concurrency integration test suite proving mathematical zero-overselling.

---

## 🚀 Key Feature Modules

1. **Interactive Recruiter Demo:**
   - 1-click **"Reproduce a Race Condition"** demo requiring no account or setup.
   - Shows 2 concurrent virtual users purchasing the last item (`stock = 1`), resulting in overselling (`final stock = -1`).
   - Side-by-side 1-click **"Run Corrected Implementation"** verifying atomic locking where exactly 1 succeeds and 1 gets `HTTP 409 Conflict`.
2. **Dashboard:** Live QA metrics (total runs, pass rate, flakiness index, critical defects, MTTD) with filters for project, severity, and status.
3. **Scenario Builder:** Visual drag-and-drop step sequencer (`LOGIN_AUTH`, `ADD_TO_CART`, `UPDATE_QUANTITY`, `CHECKOUT_PAYMENT`, `CALL_API`, `SUBMIT_FORM`, `VERIFY_INVENTORY`). Includes starter templates.
4. **Concurrency Lab:** Interactive stress lab for 2, 5, 10, or 20 concurrent virtual users with deterministic or randomized jitter. Contains an automated test suite verifying invariants.
5. **Bug Time Machine:** Granular interactive timeline scrubber, log inspector, network waterfall, and state diff viewer.
6. **AI Bug Detective:** High-precision telemetry analysis distinguishing observed empirical evidence from AI hypotheses.
7. **API Testing Workspace:** Postman-style workspace with methods, headers, payload, latency counters, assertion validation, and built-in safe sandbox endpoints.
8. **Automatic Bug Report Generator:** JIRA markdown, GitHub markdown, JSON, and CSV exports with editable fields.
9. **Test Quality Center:** Coverage matrix, flakiness detection, repeated failure tracking.
10. **Project Management:** Project workspaces, persistent scenario libraries, and defect resolution tracking.

---

## 🛠️ REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/system/status` | Runtime engine status and architecture transparency info |
| `GET` | `/api/projects` | List active projects |
| `POST` | `/api/projects` | Create a new project workspace |
| `GET` | `/api/scenarios` | List test scenarios (optional `?projectId=...`) |
| `POST` | `/api/scenarios` | Create a new test scenario with custom steps |
| `POST` | `/api/concurrency/simulate` | Run concurrent user simulation (`defective` or `corrected`) |
| `POST` | `/api/concurrency/verify-tests`| Run 20-batch automated verification test suite |
| `GET` | `/api/runs` | List test execution history |
| `GET` | `/api/runs/:id` | Fetch full test run with Bug Time Machine timeline events |
| `POST` | `/api/runs/:id/ai-analyze` | Run AI Bug Detective analysis on run logs |
| `POST` | `/api/api-workspace/execute` | Safely execute API test requests with latency & assertions |
| `POST` | `/api/sandbox/inventory/checkout` | Safe built-in sandbox e-commerce checkout endpoint |
| `POST` | `/api/sandbox/users/login` | Mock authentication endpoint |
| `POST` | `/api/sandbox/cart/apply-coupon`| Single-use coupon idempotency endpoint |

---

## 🧪 Testing Instructions

### Run In-App Automated Concurrency Verification Suite
Click the **"Run Automated Invariant Tests"** button in the Concurrency Lab or invoke:
```bash
curl -X POST http://localhost:3000/api/concurrency/verify-tests
```
This runs 200 concurrent simulated transactions and outputs mathematical proof of zero overselling in the corrected mode.

### Local Java Spring Boot Tests (when Java 21 is installed)
```bash
cd backend-java-reference
mvn test
```

---

## 🔒 Limitations & Security Transparency
- **External API Restrictions:** External API calls from the API Workspace are restricted to prevent Server-Side Request Forgery (SSRF) against private RFC 1918 subnets.
- **Stress Testing Safety:** Concurrency simulations are scoped to controlled sandboxes and do not perform unauthorized load testing against external web targets.
- **AI Attribution:** AI root-cause hypotheses are clearly demarcated from factual log observations.
