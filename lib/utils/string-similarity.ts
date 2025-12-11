/**
 * String similarity utilities using Levenshtein distance algorithm
 */

/**
 * Calculates similarity between two strings using Levenshtein distance
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @returns Number between 0 (completely different) and 1 (identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1.0;
  if (!str1 || !str2) return 0.0;

  // Calculate Levenshtein distance (minimum edits needed to transform str1 into str2)
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix with edit distances
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);

  // Convert distance to similarity (0 = different, 1 = identical)
  return 1 - (distance / maxLen);
}

/**
 * Checks if two strings are similar enough to be considered the same
 * @param str1 - First string to compare
 * @param str2 - Second string to compare
 * @param threshold - Similarity threshold (0-1), default 0.9
 * @returns True if similarity is above threshold
 */
export function areSimilar(
  str1: string,
  str2: string,
  threshold: number = 0.9
): boolean {
  return calculateSimilarity(str1, str2) >= threshold;
}
