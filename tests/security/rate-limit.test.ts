/**
 * Rate Limiting Tests
 *
 * Tests for:
 * - CWE-400: Resource Exhaustion (DoS prevention)
 * - Brute force attack prevention
 * - API abuse prevention
 *
 * Based on SUSVIBES research findings
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  rateLimit,
  withRateLimit,
  RATE_LIMITS,
  clearAllRateLimits,
  resetRateLimit,
} from "@/lib/security/rate-limit";

// Helper to create mock request
function createMockRequest(ip: string = "127.0.0.1"): Request {
  return new Request("http://localhost:3000/api/test", {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("Rate Limiting (CWE-400)", () => {
  beforeEach(() => {
    // Clear rate limits before each test
    clearAllRateLimits();
  });

  describe("checkRateLimit", () => {
    it("should allow requests within limit", () => {
      const request = createMockRequest();
      const config = { maxRequests: 5, windowMs: 60000 };

      // First request
      const result1 = checkRateLimit(request, config);
      expect(result1.allowed).toBe(true);
      expect(result1.remaining).toBe(4);

      // Second request
      const result2 = checkRateLimit(request, config);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(3);
    });

    it("should block requests over limit", () => {
      const request = createMockRequest();
      const config = { maxRequests: 3, windowMs: 60000 };

      // Use up the limit
      checkRateLimit(request, config); // 1
      checkRateLimit(request, config); // 2
      checkRateLimit(request, config); // 3

      // Fourth request should be blocked
      const result = checkRateLimit(request, config);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("should track different IPs separately", () => {
      const request1 = createMockRequest("192.168.1.1");
      const request2 = createMockRequest("192.168.1.2");
      const config = { maxRequests: 2, windowMs: 60000 };

      // Use up IP1 limit
      checkRateLimit(request1, config);
      checkRateLimit(request1, config);
      const result1 = checkRateLimit(request1, config);
      expect(result1.allowed).toBe(false);

      // IP2 should still be allowed
      const result2 = checkRateLimit(request2, config);
      expect(result2.allowed).toBe(true);
    });

    it("should reset after window expires", () => {
      const request = createMockRequest();
      const config = { maxRequests: 2, windowMs: 100 }; // 100ms window

      // Use up the limit
      checkRateLimit(request, config);
      checkRateLimit(request, config);
      const result1 = checkRateLimit(request, config);
      expect(result1.allowed).toBe(false);

      // Wait for window to expire
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const result2 = checkRateLimit(request, config);
          expect(result2.allowed).toBe(true);
          expect(result2.remaining).toBe(1);
          resolve();
        }, 150);
      });
    });

    it("should use custom key generator", () => {
      const request = createMockRequest();
      const config = {
        maxRequests: 2,
        windowMs: 60000,
        keyGenerator: () => "custom-key",
      };

      // Use up the limit
      checkRateLimit(request, config);
      checkRateLimit(request, config);
      const result = checkRateLimit(request, config);

      expect(result.allowed).toBe(false);
    });
  });

  describe("rateLimit middleware", () => {
    it("should return response object when limit exceeded", async () => {
      const request = createMockRequest();
      const config = { maxRequests: 1, windowMs: 60000 };

      // Use up the limit
      await rateLimit(request, config);

      // Second request should return error response
      const result = await rateLimit(request, config);
      expect(result.allowed).toBe(false);
      expect(result.response).toBeDefined();

      if (result.response) {
        expect(result.response.status).toBe(429);
        const body = await result.response.json();
        expect(body.error).toBeDefined();
        expect(body.retryAfter).toBeDefined();
      }
    });

    it("should include rate limit headers", async () => {
      const request = createMockRequest();
      const config = { maxRequests: 2, windowMs: 60000 };

      // Use up the limit
      await rateLimit(request, config);

      // Second request should be blocked with headers
      const result = await rateLimit(request, config);

      if (!result.allowed && result.response) {
        expect(result.response.headers.get("Retry-After")).toBeDefined();
        expect(result.response.headers.get("X-RateLimit-Limit")).toBe("2");
        expect(result.response.headers.get("X-RateLimit-Remaining")).toBe("0");
        expect(result.response.headers.get("X-RateLimit-Reset")).toBeDefined();
      }
    });

    it("should use custom message", async () => {
      const request = createMockRequest();
      const config = {
        maxRequests: 1,
        windowMs: 60000,
        message: "Custom rate limit message",
      };

      // Use up the limit
      await rateLimit(request, config);

      // Second request should return custom message
      const result = await rateLimit(request, config);

      if (!result.allowed && result.response) {
        const body = await result.response.json();
        expect(body.error).toBe("Custom rate limit message");
      }
    });
  });

  describe("withRateLimit HOC", () => {
    it("should wrap handler with rate limiting", async () => {
      const config = { maxRequests: 2, windowMs: 60000 };

      const handler = withRateLimit(async (request: Request) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }, config);

      const request = createMockRequest();

      // First request succeeds
      const response1 = await handler(request);
      expect(response1.status).toBe(200);

      // Second request succeeds
      const response2 = await handler(request);
      expect(response2.status).toBe(200);

      // Third request is blocked
      const response3 = await handler(request);
      expect(response3.status).toBe(429);
    });

    it("should add rate limit headers to success responses", async () => {
      const config = { maxRequests: 5, windowMs: 60000 };

      const handler = withRateLimit(async (request: Request) => {
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }, config);

      const request = createMockRequest();
      const response = await handler(request);

      expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("4");
      expect(response.headers.get("X-RateLimit-Reset")).toBeDefined();
    });
  });

  describe("RATE_LIMITS configurations", () => {
    it("should have auth rate limit (strict)", () => {
      expect(RATE_LIMITS.auth.maxRequests).toBe(5);
      expect(RATE_LIMITS.auth.windowMs).toBe(15 * 60 * 1000); // 15 minutes
    });

    it("should have API rate limit (moderate)", () => {
      expect(RATE_LIMITS.api.maxRequests).toBe(100);
      expect(RATE_LIMITS.api.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });

    it("should have generation rate limit (strict)", () => {
      expect(RATE_LIMITS.generation.maxRequests).toBe(20);
      expect(RATE_LIMITS.generation.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });

    it("should have export rate limit (moderate)", () => {
      expect(RATE_LIMITS.export.maxRequests).toBe(30);
      expect(RATE_LIMITS.export.windowMs).toBe(60 * 60 * 1000); // 1 hour
    });
  });

  describe("resetRateLimit utility", () => {
    it("should reset rate limit for specific identifier", () => {
      const request = createMockRequest("192.168.1.1");
      const config = { maxRequests: 1, windowMs: 60000 };

      // Use up the limit
      checkRateLimit(request, config);
      const result1 = checkRateLimit(request, config);
      expect(result1.allowed).toBe(false);

      // Reset
      resetRateLimit("192.168.1.1", config.windowMs);

      // Should be allowed again
      const result2 = checkRateLimit(request, config);
      expect(result2.allowed).toBe(true);
    });
  });

  describe("Brute Force Prevention", () => {
    it("should prevent login brute force attacks", async () => {
      const request = createMockRequest();
      const authConfig = RATE_LIMITS.auth;

      // Simulate 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        const result = await rateLimit(request, authConfig);
        expect(result.allowed).toBe(true);
      }

      // 6th attempt should be blocked
      const result = await rateLimit(request, authConfig);
      expect(result.allowed).toBe(false);

      if (result.response) {
        const body = await result.response.json();
        expect(body.error).toContain("authentication");
      }
    });

    it("should allow retries after cooldown period", async () => {
      const request = createMockRequest();
      const config = { maxRequests: 1, windowMs: 100 };

      // Use up the limit
      await rateLimit(request, config);
      const result1 = await rateLimit(request, config);
      expect(result1.allowed).toBe(false);

      // Wait for cooldown
      return new Promise<void>((resolve) => {
        setTimeout(async () => {
          const result2 = await rateLimit(request, config);
          expect(result2.allowed).toBe(true);
          resolve();
        }, 150);
      });
    });
  });

  describe("DoS Prevention", () => {
    it("should prevent resource exhaustion from single IP", async () => {
      const request = createMockRequest();
      const config = { maxRequests: 10, windowMs: 60000 };

      // Simulate rapid requests
      for (let i = 0; i < 10; i++) {
        const result = await rateLimit(request, config);
        expect(result.allowed).toBe(true);
      }

      // 11th request should be blocked
      const result = await rateLimit(request, config);
      expect(result.allowed).toBe(false);
    });

    it("should not affect other users during DoS", async () => {
      const attacker = createMockRequest("10.0.0.1");
      const legitimateUser = createMockRequest("10.0.0.2");
      const config = { maxRequests: 2, windowMs: 60000 };

      // Attacker exhausts their limit
      await rateLimit(attacker, config);
      await rateLimit(attacker, config);
      const attackerResult = await rateLimit(attacker, config);
      expect(attackerResult.allowed).toBe(false);

      // Legitimate user should still work
      const userResult = await rateLimit(legitimateUser, config);
      expect(userResult.allowed).toBe(true);
    });
  });
});
