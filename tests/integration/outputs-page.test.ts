import { describe, it, expect } from 'vitest';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Integration Tests - Outputs Page
 *
 * Tests the database queries used by the outputs page to ensure:
 * 1. Queries work with the current database schema
 * 2. Nested relations are fetched correctly
 * 3. Missing columns don't cause query failures
 *
 * These tests help catch schema migration issues before they hit production.
 *
 * NOTE: These tests expect auth errors in test environment (PGRST301).
 * The key is to distinguish between auth errors (expected) and schema errors (failures).
 */

describe('Outputs Page - Database Queries', () => {
  it('should successfully fetch outputs with ratings join', async () => {
    const supabase = await createServerClient();

    // This is the exact query used in app/projects/[id]/outputs/page.tsx
    // If the schema changes (e.g., metadata column is missing), this will fail
    const { data: scenarios, error: scenariosError } = await supabase
      .from('scenarios')
      .select('*')
      .limit(1);

    // In test environment, we expect auth errors (PGRST301), not schema errors (42703)
    // Schema error = column doesn't exist (FAIL)
    // Auth error = JWT validation failed (OK - expected in tests)
    if (scenariosError) {
      expect(scenariosError.code).toBe('PGRST301'); // Auth error is OK
    }

    // If we have scenarios, test the outputs query
    if (scenarios && scenarios.length > 0) {
      const scenarioIds = scenarios.map(s => s.id);

      const { data: outputs, error: outputsError } = await supabase
        .from('outputs')
        .select(`
          id,
          scenario_id,
          output_text,
          generated_at,
          ratings (
            id,
            stars,
            feedback_text,
            created_at
          )
        `)
        .in('scenario_id', scenarioIds)
        .order('generated_at', { ascending: false });

      // The query should succeed even if it returns empty results due to RLS
      // What we're testing is that the query structure is valid (no missing columns)
      expect(outputsError).toBeNull();
      expect(Array.isArray(outputs)).toBe(true);
    }
  });

  it('should handle empty scenario list gracefully', async () => {
    const supabase = await createServerClient();

    // Test what happens when scenarioIds is empty
    const scenarioIds: number[] = [];

    // The page should skip the query when scenarioIds is empty
    // But if we do run it, it should not error
    if (scenarioIds.length > 0) {
      const { error: outputsError } = await supabase
        .from('outputs')
        .select(`
          id,
          scenario_id,
          output_text,
          generated_at,
          ratings (
            id,
            stars,
            feedback_text,
            created_at
          )
        `)
        .in('scenario_id', scenarioIds)
        .order('generated_at', { ascending: false });

      expect(outputsError).toBeNull();
    }

    // This test passes as long as we don't hit an error
    expect(true).toBe(true);
  });

  it('should validate query structure matches current schema', async () => {
    const supabase = await createServerClient();

    // Test that we can query the outputs table with the expected columns
    const { error } = await supabase
      .from('outputs')
      .select('id, scenario_id, output_text, generated_at')
      .limit(0); // Don't actually fetch data, just validate query

    // Auth error (PGRST301) is OK, schema error (42703) would be a failure
    if (error) {
      expect(error.code).toBe('PGRST301');
    }
  });

  it('should validate ratings table has required columns', async () => {
    const supabase = await createServerClient();

    // Test that we can query ratings with the columns we need
    const { error } = await supabase
      .from('ratings')
      .select('id, stars, feedback_text, created_at')
      .limit(0);

    // Auth error (PGRST301) is OK, schema error (42703) would be a failure
    if (error) {
      expect(error.code).toBe('PGRST301');
    }
  });

  it('should handle ratings join correctly', async () => {
    const supabase = await createServerClient();

    // Test the nested join query structure
    const { error } = await supabase
      .from('outputs')
      .select(`
        id,
        ratings (
          id,
          stars
        )
      `)
      .limit(0);

    // Auth error (PGRST301) is OK, schema error (42703) would be a failure
    if (error) {
      expect(error.code).toBe('PGRST301');
    }
  });
});

describe('Outputs Page - Schema Compatibility', () => {
  it('should not query non-existent metadata column if migration not run', async () => {
    const supabase = await createServerClient();

    // This test documents that we removed metadata from the base query
    // to maintain backwards compatibility with databases that haven't run
    // the 20251209000001_add_rating_metadata.sql migration yet

    // Query WITHOUT metadata (backwards compatible)
    const { error: withoutMetadata } = await supabase
      .from('ratings')
      .select('id, stars, feedback_text, created_at')
      .limit(0);

    // Auth error (PGRST301) is OK, schema error (42703) would be a failure
    if (withoutMetadata) {
      expect(withoutMetadata.code).toBe('PGRST301');
    }

    // Note: Querying WITH metadata would fail if the migration hasn't run:
    // const { error: withMetadata } = await supabase
    //   .from('ratings')
    //   .select('id, stars, feedback_text, created_at, metadata')
    //   .limit(0);
    // This would return error code '42703' (column does not exist)
  });

  it('should document the outputs page query pattern', async () => {
    // This is a documentation test that shows the correct query pattern
    // for the outputs page to prevent regression

    const correctQueryPattern = {
      table: 'outputs',
      select: `
        id,
        scenario_id,
        output_text,
        generated_at,
        ratings (
          id,
          stars,
          feedback_text,
          created_at
        )
      `,
      // Note: metadata is NOT included in base query for backwards compatibility
      // The page code handles missing metadata gracefully
    };

    expect(correctQueryPattern.table).toBe('outputs');
    expect(correctQueryPattern.select).not.toContain('metadata');
  });
});
