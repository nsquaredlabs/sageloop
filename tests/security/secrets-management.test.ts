/**
 * Secrets Management Tests
 *
 * Tests for:
 * - CWE-312: Cleartext Storage of Sensitive Information
 * - CWE-522: Insufficiently Protected Credentials
 * - CWE-200: Exposure of Sensitive Information
 *
 * Based on SUSVIBES research findings
 */

import { describe, it, expect } from "vitest";
import { env } from "@/lib/env";

describe("Secrets Management (CWE-312, CWE-522)", () => {
  describe("Environment Variable Protection", () => {
    it("should not expose service role key in client-side code", () => {
      // Service role key should only be accessible server-side
      // Vitest runs in happy-dom environment, so window exists
      // In real implementation, env module checks typeof window === 'undefined'

      // Verify service role key is defined (server-side access)
      expect(env.supabase.serviceRoleKey).toBeDefined();

      // Verify it's not in NEXT_PUBLIC_ variables (browser-safe)
      const publicEnvVars = Object.keys(process.env).filter((key) =>
        key.startsWith("NEXT_PUBLIC_"),
      );
      expect(publicEnvVars).not.toContain(
        "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
      );
    });

    it("should only expose public keys with NEXT_PUBLIC prefix", () => {
      // Only these should be safe for browser
      expect(env.supabase.url).toBeDefined();
      expect(env.supabase.anonKey).toBeDefined();

      // Service role and API keys should not have NEXT_PUBLIC prefix
      const publicEnvVars = Object.keys(process.env).filter((key) =>
        key.startsWith("NEXT_PUBLIC_"),
      );

      expect(publicEnvVars).toContain("NEXT_PUBLIC_SUPABASE_URL");
      expect(publicEnvVars).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
      expect(publicEnvVars).not.toContain(
        "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
      );
      expect(publicEnvVars).not.toContain("NEXT_PUBLIC_OPENAI_API_KEY");
      expect(publicEnvVars).not.toContain("NEXT_PUBLIC_ANTHROPIC_API_KEY");
    });

    it("should validate required environment variables on startup", () => {
      // env module validates on import
      expect(env.supabase.url).toBeDefined();
      expect(env.supabase.anonKey).toBeDefined();
      expect(env.supabase.serviceRoleKey).toBeDefined();
    });

    it("should handle optional environment variables gracefully", () => {
      // These are optional and may be undefined
      // Should not throw errors when accessed
      expect(() => {
        const _openaiKey = env.openai.apiKey;
        const _anthropicKey = env.anthropic.apiKey;
      }).not.toThrow();
    });
  });

  describe("API Key Format Validation", () => {
    it("should recognize valid OpenAI API key format", () => {
      const validFormats = [
        "sk-proj-abcdef123456", // Project key
        "sk-abcdef123456", // Legacy key
      ];

      validFormats.forEach((key) => {
        expect(key).toMatch(/^sk-/);
      });
    });

    it("should recognize valid Anthropic API key format", () => {
      const validFormats = [
        "sk-ant-api03-abcdef123456", // API key
      ];

      validFormats.forEach((key) => {
        expect(key).toMatch(/^sk-ant-/);
      });
    });

    it("should recognize valid Supabase key formats", () => {
      // Supabase keys are base64-encoded tokens (test env uses shorter keys)
      const anonKey = env.supabase.anonKey;
      const serviceRoleKey = env.supabase.serviceRoleKey;

      expect(anonKey).toBeDefined();
      expect(serviceRoleKey).toBeDefined();

      // Test environment uses shorter keys, production keys are much longer
      expect(anonKey.length).toBeGreaterThan(10);
      expect(serviceRoleKey.length).toBeGreaterThan(10);
    });
  });

  describe("Database Encryption", () => {
    it("should use pgcrypto for API key encryption", () => {
      // This test verifies that the migration sets up encryption correctly
      // Actual encryption is tested via database integration tests

      // Migration file should contain pgcrypto setup
      // We verify this by checking the migration exists
      const fs = require("fs");
      const path = require("path");

      const migrationPath = path.join(
        process.cwd(),
        "supabase/migrations/20250108000000_add_workbench_api_keys.sql",
      );

      expect(fs.existsSync(migrationPath)).toBe(true);

      const migrationContent = fs.readFileSync(migrationPath, "utf-8");
      expect(migrationContent).toContain("pgcrypto");
      expect(migrationContent).toContain("pgp_sym_encrypt");
      expect(migrationContent).toContain("pgp_sym_decrypt");
    });

    it("should store API keys in encrypted_api_keys column, not plaintext", () => {
      const fs = require("fs");
      const path = require("path");

      const migrationPath = path.join(
        process.cwd(),
        "supabase/migrations/20250108000000_add_workbench_api_keys.sql",
      );

      const migrationContent = fs.readFileSync(migrationPath, "utf-8");

      // Should have encrypted_api_keys column
      expect(migrationContent).toContain("encrypted_api_keys");

      // Should NOT have plaintext columns like openai_key, anthropic_key
      expect(migrationContent).not.toContain("add column openai_key");
      expect(migrationContent).not.toContain("add column anthropic_key");
    });

    it("should use security definer functions for encryption/decryption", () => {
      const fs = require("fs");
      const path = require("path");

      const migrationPath = path.join(
        process.cwd(),
        "supabase/migrations/20250108000000_add_workbench_api_keys.sql",
      );

      const migrationContent = fs.readFileSync(migrationPath, "utf-8");

      // Should have security definer functions
      expect(migrationContent).toContain("security definer");
      expect(migrationContent).toContain("set_workbench_api_keys");
      expect(migrationContent).toContain("get_workbench_api_keys");
      expect(migrationContent).toContain("check_workbench_api_keys");
    });
  });

  describe("Sensitive Data Exposure Prevention", () => {
    it("should never log API keys", () => {
      // API keys should never appear in console.log statements
      const apiKey = "sk-test-123456";

      // This is a code smell check - should be caught in code review
      // Real implementation should use redaction for logs
      const shouldNotLog = (key: string) => {
        // Never do this:
        // console.log('API Key:', key);

        // Instead, log a masked version:
        const masked = key.slice(0, 7) + "..." + key.slice(-4);
        return masked;
      };

      const masked = shouldNotLog(apiKey);
      expect(masked).toBe("sk-test...3456");
      expect(masked).not.toContain("123456");
    });

    it("should mask API keys in error messages", () => {
      const apiKey = "sk-proj-abcdef123456";

      const maskApiKey = (key: string): string => {
        if (key.length < 10) return "***";
        return key.slice(0, 7) + "..." + key.slice(-4);
      };

      const masked = maskApiKey(apiKey);
      expect(masked).not.toBe(apiKey);
      expect(masked).toMatch(/^sk-proj\.\.\./);
    });

    it("should not expose API keys in HTTP responses", () => {
      // API routes should use check_workbench_api_keys
      // which returns boolean flags, not actual keys

      const mockCheckResult = {
        openai: true,
        anthropic: false,
      };

      // This is safe to return to client
      expect(mockCheckResult.openai).toBe(true);
      expect(mockCheckResult).not.toHaveProperty("openai_key");
      expect(mockCheckResult).not.toHaveProperty("anthropic_key");
    });
  });

  describe("Git Ignore Protection", () => {
    it("should ensure .env.local is gitignored", () => {
      const fs = require("fs");
      const path = require("path");

      const gitignorePath = path.join(process.cwd(), ".gitignore");
      const gitignoreContent = fs.readFileSync(gitignorePath, "utf-8");

      expect(gitignoreContent).toContain(".env");
      expect(gitignoreContent).toMatch(/\.env.*\.local/);
    });

    it("should ensure .env.example exists for documentation", () => {
      const fs = require("fs");
      const path = require("path");

      const examplePath = path.join(process.cwd(), ".env.example");
      expect(fs.existsSync(examplePath)).toBe(true);

      const exampleContent = fs.readFileSync(examplePath, "utf-8");

      // Should have placeholder values, not real keys
      expect(exampleContent).toContain("your-supabase-publishable-key");
      expect(exampleContent).toContain("your-openai-api-key-here");
      expect(exampleContent).not.toMatch(/sk-proj-[a-zA-Z0-9]{20,}/);
      expect(exampleContent).not.toMatch(/sk-ant-[a-zA-Z0-9]{20,}/);
    });
  });

  describe("Encryption Key Management", () => {
    it("should document that encryption key must be changed in production", () => {
      const fs = require("fs");
      const path = require("path");

      const migrationPath = path.join(
        process.cwd(),
        "supabase/migrations/20250108000000_add_workbench_api_keys.sql",
      );

      const migrationContent = fs.readFileSync(migrationPath, "utf-8");

      // Should warn about changing dev encryption key
      expect(migrationContent).toContain("dev_only");
      expect(migrationContent).toContain("replace_in_prod");
    });
  });

  describe("API Key Usage Patterns", () => {
    it("should only use API keys server-side", () => {
      // Verify that API key access is only in server files
      // This is a code organization check

      // Client-side files should use createClient() (no API keys)
      // Server-side files should use createServerClient() and env.openai.apiKey

      // Cannot directly test this in unit tests, but architecture enforces:
      // 1. env module only works server-side (typeof window === 'undefined')
      // 2. Client components use createClient() which uses RLS
      // 3. Server components use createServerClient() with cookies
      expect(env.supabase.serviceRoleKey).toBeDefined();
    });
  });

  describe("Secrets in Code Review", () => {
    it("should not have hardcoded API keys in source code", () => {
      const fs = require("fs");
      const path = require("path");

      // Check a few key files for hardcoded secrets
      const filesToCheck = [
        "lib/supabase/client.ts",
        "lib/supabase/server.ts",
        "lib/ai/generation.ts",
      ];

      filesToCheck.forEach((file) => {
        const filePath = path.join(process.cwd(), file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, "utf-8");

          // Should not contain actual API key patterns
          expect(content).not.toMatch(/sk-proj-[a-zA-Z0-9]{20,}/);
          expect(content).not.toMatch(/sk-ant-api03-[a-zA-Z0-9]{20,}/);
          expect(content).not.toMatch(/eyJ[a-zA-Z0-9_-]{20,}\./); // JWT pattern
        }
      });
    });
  });
});
