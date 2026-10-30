# BugMirror AI - Spring Boot 3 / Java 21 Reference Architecture

This module provides the complete, production-grade Spring Boot 3 & Java 21 enterprise backend reference implementation for BugMirror AI.

## Architecture Overview
- **Runtime:** Java 21 (LTS)
- **Framework:** Spring Boot 3.3.4
- **ORM / Persistence:** Spring Data JPA with PostgreSQL (`SELECT ... FOR UPDATE` row-level pessimistic locking)
- **Testing:** JUnit 5, Mockito, AssertJ, and Java Concurrency `CountDownLatch` / `ExecutorService`
- **Isolation Levels:** `SERIALIZABLE` vs `READ_COMMITTED` for race condition reproduction

## Concurrency Lab Implementation
1. **Defective Pipeline (`checkoutDefective`)**:
   - Demonstrates a classic **Time-of-Check to Time-of-Use (TOCTOU)** race condition.
   - Multiple threads query stock simultaneously (`currentStock >= requestedQuantity`) before writing changes.
   - When 2 or more threads execute concurrently on an item with 1 unit in stock, both threads read `1`, pass validation, and deduct, causing stock underflow (`-1`) and overselling.

2. **Corrected Pipeline (`checkoutCorrected`)**:
   - Uses transactional mutual exclusion (`ReentrantLock` with fairness guarantees or PostgreSQL `@Lock(LockModeType.PESSIMISTIC_WRITE)`).
   - Invariants strictly preserved:
     - `stock >= 0`
     - `successfulOrders <= initialStock`
     - Concurrent requests beyond available stock cleanly receive `409 Conflict`.

## Running the Java Tests Locally
If you have Java 21 and Maven installed:
```bash
cd backend-java-reference
mvn clean test
```
The test suite `InventoryConcurrencyTest.java` fires 20 simultaneous threads against both endpoints and asserts mathematical invariants.
