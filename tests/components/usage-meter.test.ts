/**
 * Tests for usage-meter component functions
 * Focus on the calculateNextResetDate helper that handles stale reset dates
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { calculateNextResetDate } from "@/components/subscription/usage-meter";

describe("calculateNextResetDate", () => {
  beforeEach(() => {
    // Mock the current date to a known value for consistent tests
    // Using January 15, 2026 00:00:00 UTC as the "current" date
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("when reset date is in the future", () => {
    it("should return the original reset date unchanged", () => {
      const futureDate = "2026-02-01T00:00:00.000Z";
      const result = calculateNextResetDate(futureDate);
      expect(result).toBe(futureDate);
    });

    it("should return original date when only 1 day in the future", () => {
      const tomorrow = "2026-01-16T00:00:00.000Z";
      const result = calculateNextResetDate(tomorrow);
      expect(result).toBe(tomorrow);
    });
  });

  describe("when reset date is in the past", () => {
    it("should calculate next reset date from a past month", () => {
      // Reset date was December 30, 2025 (in the past)
      const pastDate = "2025-12-30T00:00:00.000Z";
      const result = calculateNextResetDate(pastDate);

      // Should return February 1, 2026 (next month after current date)
      const expectedDate = new Date("2026-02-01T00:00:00.000Z");
      expect(new Date(result).getTime()).toBe(expectedDate.getTime());
    });

    it("should calculate next reset date when multiple months have passed", () => {
      // Reset date was October 1, 2025 (several months ago)
      const pastDate = "2025-10-01T00:00:00.000Z";
      const result = calculateNextResetDate(pastDate);

      // Should return February 1, 2026 (next month boundary)
      const expectedDate = new Date("2026-02-01T00:00:00.000Z");
      expect(new Date(result).getTime()).toBe(expectedDate.getTime());
    });

    it("should handle reset date exactly at the current time (boundary)", () => {
      // Reset date is exactly now
      const nowDate = "2026-01-15T00:00:00.000Z";
      const result = calculateNextResetDate(nowDate);

      // Should return February 1, 2026
      const expectedDate = new Date("2026-02-01T00:00:00.000Z");
      expect(new Date(result).getTime()).toBe(expectedDate.getTime());
    });

    it("should handle reset date from many months ago", () => {
      // Reset date was January 1, 2025 (over a year ago)
      const veryOldDate = "2025-01-01T00:00:00.000Z";
      const result = calculateNextResetDate(veryOldDate);

      // Should return February 1, 2026
      const expectedDate = new Date("2026-02-01T00:00:00.000Z");
      expect(new Date(result).getTime()).toBe(expectedDate.getTime());
    });
  });

  describe("edge cases", () => {
    it("should handle Jan 31 signup (leap year consideration)", () => {
      // Set current time to February 15, 2024 (leap year)
      vi.setSystemTime(new Date("2024-02-15T00:00:00.000Z"));

      // User signed up Jan 31, 2024
      const jan31 = "2024-01-31T00:00:00.000Z";
      const result = calculateNextResetDate(jan31);

      // Should return March 1, 2024 (next month boundary after Feb 15)
      const expectedDate = new Date("2024-03-01T00:00:00.000Z");
      expect(new Date(result).getTime()).toBe(expectedDate.getTime());
    });

    it("should handle December to January year transition", () => {
      // Set current time to December 15, 2025
      vi.setSystemTime(new Date("2025-12-15T00:00:00.000Z"));

      // Reset date was December 1, 2025 (in the past)
      const dec1 = "2025-12-01T00:00:00.000Z";
      const result = calculateNextResetDate(dec1);

      // Should return January 1, 2026
      const expectedDate = new Date("2026-01-01T00:00:00.000Z");
      expect(new Date(result).getTime()).toBe(expectedDate.getTime());
    });

    it("should handle midnight boundary exactly on reset day", () => {
      // Set current time to exactly midnight on February 1, 2026
      vi.setSystemTime(new Date("2026-02-01T00:00:00.000Z"));

      // Reset date is also February 1, 2026 at midnight
      const resetDay = "2026-02-01T00:00:00.000Z";
      const result = calculateNextResetDate(resetDay);

      // Since reset date === now, should advance to March 1, 2026
      const expectedDate = new Date("2026-03-01T00:00:00.000Z");
      expect(new Date(result).getTime()).toBe(expectedDate.getTime());
    });

    it("should handle timezone-aware ISO strings", () => {
      // Reset date in different timezone format
      const pastDateWithOffset = "2025-12-01T00:00:00+00:00";
      const result = calculateNextResetDate(pastDateWithOffset);

      // Should still calculate correctly
      const expectedDate = new Date("2026-02-01T00:00:00.000Z");
      expect(new Date(result).getTime()).toBe(expectedDate.getTime());
    });

    it("should always return first of month at midnight UTC", () => {
      // Reset date with non-midnight time
      const pastDate = "2025-11-15T14:30:00.000Z";
      const result = calculateNextResetDate(pastDate);

      const resultDate = new Date(result);
      expect(resultDate.getUTCDate()).toBe(1);
      expect(resultDate.getUTCHours()).toBe(0);
      expect(resultDate.getUTCMinutes()).toBe(0);
      expect(resultDate.getUTCSeconds()).toBe(0);
    });
  });

  describe("real-world bug scenario", () => {
    it("should fix stale December 30, 2025 reset date in January 2026", () => {
      // This is the exact bug reported: "Resets on Dec 30, 2025" shown in mid-January 2026
      vi.setSystemTime(new Date("2026-01-16T10:30:00.000Z"));

      const staleDate = "2025-12-30T00:00:00.000Z";
      const result = calculateNextResetDate(staleDate);

      // Should show February 1, 2026 (not December 30, 2025)
      const resultDate = new Date(result);
      expect(resultDate.getUTCFullYear()).toBe(2026);
      expect(resultDate.getUTCMonth()).toBe(1); // February (0-indexed)
      expect(resultDate.getUTCDate()).toBe(1);
    });
  });
});
