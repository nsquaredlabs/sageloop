import { describe, it, expect } from 'vitest';
import { calculateSimilarity, areSimilar } from '@/lib/utils/string-similarity';

describe('String Similarity Utilities', () => {
  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical strings', () => {
      expect(calculateSimilarity('hello', 'hello')).toBe(1.0);
      expect(calculateSimilarity('test string', 'test string')).toBe(1.0);
      expect(calculateSimilarity('', '')).toBe(1.0);
    });

    it('should return 0.0 for completely different strings', () => {
      expect(calculateSimilarity('abc', 'xyz')).toBe(0.0);
    });

    it('should return 0.0 when one string is empty', () => {
      expect(calculateSimilarity('', 'hello')).toBe(0.0);
      expect(calculateSimilarity('hello', '')).toBe(0.0);
    });

    it('should handle single character differences', () => {
      const similarity = calculateSimilarity('hello', 'helo');
      expect(similarity).toBeGreaterThan(0.7);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should calculate similarity for similar strings', () => {
      const similarity = calculateSimilarity(
        'The quick brown fox',
        'The quick brown dog'
      );
      expect(similarity).toBeGreaterThan(0.8);
      expect(similarity).toBeLessThan(1.0);
    });

    it('should calculate similarity for case-sensitive comparisons', () => {
      const similarity = calculateSimilarity('Hello', 'hello');
      expect(similarity).toBeLessThan(1.0);
      expect(similarity).toBeGreaterThanOrEqual(0.8); // Only one character different (1 out of 5)
    });

    it('should handle longer strings', () => {
      const str1 = 'This is a longer test string with multiple words';
      const str2 = 'This is a longer test string with several words';
      const similarity = calculateSimilarity(str1, str2);
      expect(similarity).toBeGreaterThan(0.8);
    });

    it('should calculate correct Levenshtein distance', () => {
      // "kitten" -> "sitting" requires 3 edits (substitute k->s, substitute e->i, append g)
      const similarity = calculateSimilarity('kitten', 'sitting');
      const expected = 1 - (3 / 7); // 3 edits out of max length 7
      expect(similarity).toBeCloseTo(expected, 2);
    });
  });

  describe('areSimilar', () => {
    it('should return true for identical strings', () => {
      expect(areSimilar('hello', 'hello')).toBe(true);
    });

    it('should return false for completely different strings', () => {
      expect(areSimilar('abc', 'xyz')).toBe(false);
    });

    it('should use default threshold of 0.9', () => {
      // 9 out of 10 characters the same (90% similar)
      expect(areSimilar('hello world', 'hello worle')).toBe(true);

      // Only 50% similar
      expect(areSimilar('hello', 'world')).toBe(false);
    });

    it('should respect custom threshold', () => {
      const str1 = 'hello';
      const str2 = 'helo'; // 80% similar (1 deletion out of 5 chars)

      expect(areSimilar(str1, str2, 0.7)).toBe(true);  // 70% threshold
      expect(areSimilar(str1, str2, 0.9)).toBe(false); // 90% threshold
    });

    it('should work with the retest use case', () => {
      // Simulate carrying forward ratings when output is very similar
      const oldOutput = 'The capital of France is Paris.';
      const newOutput = 'The capital of France is Paris!'; // Only punctuation changed

      expect(areSimilar(oldOutput, newOutput, 0.9)).toBe(true);
    });

    it('should not carry forward when output significantly changed', () => {
      const oldOutput = 'The capital of France is Paris.';
      const newOutput = 'The largest city in France is Paris.';

      expect(areSimilar(oldOutput, newOutput, 0.9)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle unicode characters', () => {
      expect(calculateSimilarity('café', 'cafe')).toBeLessThan(1.0);
      expect(calculateSimilarity('日本', '日本')).toBe(1.0);
    });

    it('should handle very long strings efficiently', () => {
      const longString1 = 'a'.repeat(1000);
      const longString2 = 'a'.repeat(999) + 'b';

      const similarity = calculateSimilarity(longString1, longString2);
      expect(similarity).toBeGreaterThan(0.99);
    });

    it('should handle special characters', () => {
      expect(calculateSimilarity('hello@world.com', 'hello@world.com')).toBe(1.0);
      expect(calculateSimilarity('test\nwith\nnewlines', 'test\nwith\nnewlines')).toBe(1.0);
    });
  });
});
