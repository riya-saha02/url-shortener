package com.riya.urlshortener.service;

import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Simple in-memory token-bucket rate limiter, keyed per user/IP.
 * Caps how many short links a single caller can create per minute,
 * protecting the service from abuse/spam without needing external
 * infra like Redis for a resume-scale project. Swappable for a
 * Redis-backed bucket (e.g. Bucket4j + Redis) for a distributed deployment.
 */
@Service
public class RateLimiterService {

    private static final int MAX_REQUESTS_PER_WINDOW = 20;
    private static final long WINDOW_MILLIS = 60_000; // 1 minute

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();

    public boolean tryConsume(String key) {
        Bucket bucket = buckets.computeIfAbsent(key, k -> new Bucket());
        return bucket.tryConsume();
    }

    private static class Bucket {
        private final AtomicInteger count = new AtomicInteger(0);
        private volatile long windowStart = System.currentTimeMillis();

        synchronized boolean tryConsume() {
            long now = System.currentTimeMillis();
            if (now - windowStart > WINDOW_MILLIS) {
                windowStart = now;
                count.set(0);
            }
            if (count.get() < MAX_REQUESTS_PER_WINDOW) {
                count.incrementAndGet();
                return true;
            }
            return false;
        }
    }
}
