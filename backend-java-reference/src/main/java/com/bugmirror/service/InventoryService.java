package com.bugmirror.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Service providing both intentionally defective and production-hardened
 * synchronized checkout routines for concurrency benchmarking and testing.
 */
@Service
public class InventoryService {

    // Simulated database record: itemId -> stock level
    private final ConcurrentHashMap<String, Integer> database = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, AtomicInteger> orderCounters = new ConcurrentHashMap<>();

    // Reentrant lock for pessimistic locking implementation
    private final ReentrantLock lock = new ReentrantLock(true);

    public void initItem(String itemId, int stock) {
        database.put(itemId, stock);
        orderCounters.put(itemId, new AtomicInteger(0));
    }

    public int getStock(String itemId) {
        return database.getOrDefault(itemId, 0);
    }

    public int getOrderCount(String itemId) {
        return orderCounters.getOrDefault(itemId, new AtomicInteger(0)).get();
    }

    /**
     * DEFECTIVE IMPLEMENTATION:
     * Unsynchronized "Check-Then-Act" (Time-of-Check to Time-of-Use).
     * Simulates a dirty read / lost update race condition common in default READ COMMITTED transactions.
     * When multiple threads check (stock >= requested) simultaneously, both pass, decrement,
     * and produce overselling with negative inventory.
     */
    public CheckoutResult checkoutDefective(String itemId, int requestedQuantity) {
        int currentStock = database.getOrDefault(itemId, 0);

        // Artificial processing delay simulating network I/O or token verification
        try {
            Thread.sleep(15);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        if (currentStock >= requestedQuantity) {
            // Unsynchronized write hazard
            int newStock = currentStock - requestedQuantity;
            database.put(itemId, newStock);
            int orderId = orderCounters.get(itemId).incrementAndGet();

            return new CheckoutResult(true, "ORD-" + orderId, newStock, null);
        } else {
            return new CheckoutResult(false, null, currentStock, "OUT_OF_STOCK");
        }
    }

    /**
     * CORRECTED IMPLEMENTATION:
     * Uses atomic mutual exclusion and transactional isolation (SERIALIZABLE / PESSIMISTIC LOCK).
     * Guarantees that only 1 thread can read and decrement simultaneously.
     * Invariants guaranteed:
     * 1. stock >= 0
     * 2. total orders <= initial stock
     */
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public CheckoutResult checkoutCorrected(String itemId, int requestedQuantity) {
        lock.lock();
        try {
            int currentStock = database.getOrDefault(itemId, 0);

            if (currentStock >= requestedQuantity) {
                int newStock = currentStock - requestedQuantity;
                database.put(itemId, newStock);
                int orderId = orderCounters.get(itemId).incrementAndGet();

                return new CheckoutResult(true, "ORD-" + orderId, newStock, null);
            } else {
                return new CheckoutResult(false, null, currentStock, "OUT_OF_STOCK");
            }
        } finally {
            lock.unlock();
        }
    }

    public record CheckoutResult(boolean success, String orderId, int remainingStock, String error) {}
}
