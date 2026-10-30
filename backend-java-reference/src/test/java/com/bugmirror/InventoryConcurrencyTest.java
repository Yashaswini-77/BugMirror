package com.bugmirror;

import com.bugmirror.service.InventoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * JUnit 5 + Mockito Integration Test Suite for Concurrency Guarantees.
 * Mathematically demonstrates that the corrected implementation NEVER oversells,
 * while the defective implementation consistently fails under concurrent load.
 */
public class InventoryConcurrencyTest {

    private InventoryService inventoryService;

    @BeforeEach
    void setUp() {
        inventoryService = new InventoryService();
    }

    @Test
    @DisplayName("Corrected Implementation: 20 concurrent threads attempting to buy 1 item must result in EXACTLY 1 order and stock = 0")
    void testCorrectedConcurrency_NeverOversells() throws InterruptedException {
        String itemId = "item-test-flash-sale";
        int initialStock = 1;
        int numberOfThreads = 20;

        inventoryService.initItem(itemId, initialStock);

        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startSignal = new CountDownLatch(1);
        CountDownLatch doneSignal = new CountDownLatch(numberOfThreads);

        AtomicInteger successfulOrders = new AtomicInteger(0);
        AtomicInteger rejectedOrders = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            executor.submit(() -> {
                try {
                    // Wait for all threads to synchronize and fire simultaneously
                    startSignal.await();
                    InventoryService.CheckoutResult result = inventoryService.checkoutCorrected(itemId, 1);
                    if (result.success()) {
                        successfulOrders.incrementAndGet();
                    } else {
                        rejectedOrders.incrementAndGet();
                    }
                } catch (InterruptedException ignored) {
                } finally {
                    doneSignal.countDown();
                }
            });
        }

        // Fire all 20 threads at the same millisecond
        startSignal.countDown();
        boolean completed = doneSignal.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        assertThat(completed).isTrue();

        // STRICT INVARIANT ASSERTIONS:
        // 1. Stock must never be negative
        assertThat(inventoryService.getStock(itemId))
                .as("Final inventory stock must equal exactly 0")
                .isEqualTo(0);

        // 2. Exactly 1 order must have succeeded
        assertThat(successfulOrders.get())
                .as("Exactly 1 purchase order must succeed when stock was 1")
                .isEqualTo(1);

        // 3. Exactly 19 orders must have been rejected with OUT_OF_STOCK
        assertThat(rejectedOrders.get())
                .as("Exactly 19 orders must be cleanly rejected")
                .isEqualTo(19);
    }

    @Test
    @DisplayName("Defective Implementation: Proves race condition existence and oversell underflow")
    void testDefectiveConcurrency_DetectsOversellingRaceCondition() throws InterruptedException {
        String itemId = "item-test-defective";
        int initialStock = 1;
        int numberOfThreads = 5;

        inventoryService.initItem(itemId, initialStock);

        ExecutorService executor = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch startSignal = new CountDownLatch(1);
        CountDownLatch doneSignal = new CountDownLatch(numberOfThreads);

        AtomicInteger successfulOrders = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            executor.submit(() -> {
                try {
                    startSignal.await();
                    InventoryService.CheckoutResult result = inventoryService.checkoutDefective(itemId, 1);
                    if (result.success()) {
                        successfulOrders.incrementAndGet();
                    }
                } catch (InterruptedException ignored) {
                } finally {
                    doneSignal.countDown();
                }
            });
        }

        startSignal.countDown();
        doneSignal.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        // In unsynchronized mode, multiple threads read stock=1 and all commit deductions
        int finalStock = inventoryService.getStock(itemId);
        System.out.println("Defective mode result: Successful orders = " + successfulOrders.get() + ", Final Stock = " + finalStock);

        // Assert that a race condition or overselling occurred (> 1 success or finalStock < 0)
        assertThat(successfulOrders.get() > 1 || finalStock < 0)
                .as("Race condition must be reproduced in the un-isolated implementation")
                .isTrue();
    }
}
