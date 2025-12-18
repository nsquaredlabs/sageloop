/**
 * Sanitization Security Tests
 *
 * Tests for:
 * - CWE-79: Cross-Site Scripting (XSS)
 * - CWE-22: Path Traversal
 * - CWE-93: CRLF Injection
 *
 * Based on SUSVIBES research findings
 */

import { describe, it, expect } from "vitest";
import { sanitize } from "@/lib/security/sanitize";

describe("HTML Sanitization (CWE-79)", () => {
  describe("sanitizeHtml", () => {
    it("should allow safe HTML tags", () => {
      const input = "<b>bold</b> and <i>italic</i> text";
      const result = sanitize.userContent(input);

      expect(result).toContain("<b>bold</b>");
      expect(result).toContain("<i>italic</i>");
    });

    it("should remove script tags", () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitize.userContent(input);

      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
    });

    it("should remove event handlers", () => {
      const input = "<img src=x onerror=alert(1)>";
      const result = sanitize.userContent(input);

      expect(result).not.toContain("onerror");
      expect(result).not.toContain("alert");
    });

    it("should remove javascript: protocol", () => {
      const input = '<a href="javascript:alert(1)">click</a>';
      const result = sanitize.userContent(input);

      expect(result).not.toContain("javascript:");
    });

    it("should handle empty input", () => {
      expect(sanitize.userContent("")).toBe("");
    });
  });

  describe("stripHtml", () => {
    it("should remove all HTML tags", () => {
      const input = "<b>bold</b> and <i>italic</i> text";
      const result = sanitize.plainText(input);

      expect(result).toBe("bold and italic text");
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });

    it("should remove script tags and content", () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = sanitize.plainText(input);

      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
    });
  });
});

describe("Filename Sanitization (CWE-22)", () => {
  describe("sanitizeFilename", () => {
    it("should remove path traversal sequences", () => {
      const malicious = "../../../etc/passwd";
      const result = sanitize.filename(malicious);

      expect(result).not.toContain("..");
      expect(result).toBe("etc-passwd");
    });

    it("should remove path separators", () => {
      const malicious = "path/to/file.txt";
      const result = sanitize.filename(malicious);

      expect(result).not.toContain("/");
      expect(result).toBe("path-to-file.txt");
    });

    it("should remove Windows path separators", () => {
      const malicious = "C:\\Windows\\System32";
      const result = sanitize.filename(malicious);

      expect(result).not.toContain("\\");
      expect(result).toBe("C-Windows-System32");
    });

    it("should remove dangerous characters", () => {
      const malicious = "file<script>name.txt";
      const result = sanitize.filename(malicious);

      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
      expect(result).toBe("file-script-name.txt");
    });

    it("should limit filename length", () => {
      const longName = "a".repeat(300);
      const result = sanitize.filename(longName);

      expect(result.length).toBeLessThanOrEqual(255);
    });

    it("should handle empty input", () => {
      expect(sanitize.filename("")).toBe("untitled");
    });

    it("should collapse multiple dashes", () => {
      const input = "file---name.txt";
      const result = sanitize.filename(input);

      expect(result).toBe("file-name.txt");
    });

    it("should handle the export use case", () => {
      const projectName = "My <Cool> Project!";
      const result = sanitize.filename(projectName);

      expect(result).toBe("My-Cool-Project");
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });
  });
});

describe("CRLF Injection Prevention (CWE-93)", () => {
  describe("sanitizeHeader", () => {
    it("should remove carriage returns", () => {
      const input = "header-value\rinjected";
      const result = sanitize.header(input);

      expect(result).not.toContain("\r");
      expect(result).toBe("header-valueinjected");
    });

    it("should remove line feeds", () => {
      const input = "header-value\ninjected";
      const result = sanitize.header(input);

      expect(result).not.toContain("\n");
      expect(result).toBe("header-valueinjected");
    });

    it("should remove CRLF sequences", () => {
      const input = "header-value\r\nSet-Cookie: admin=true";
      const result = sanitize.header(input);

      expect(result).not.toContain("\r");
      expect(result).not.toContain("\n");
      expect(result).toBe("header-valueSet-Cookie: admin=true");
    });

    it("should handle empty input", () => {
      expect(sanitize.header("")).toBe("");
    });
  });
});

describe("URL Sanitization", () => {
  describe("sanitizeUrl", () => {
    it("should allow safe HTTP URLs", () => {
      const url = "https://example.com";
      const result = sanitize.url(url);

      expect(result).toBe("https://example.com");
    });

    it("should block javascript: protocol", () => {
      const url = "javascript:alert(1)";
      const result = sanitize.url(url);

      expect(result).toBe("");
    });

    it("should block data: protocol", () => {
      const url = "data:text/html,<script>alert(1)</script>";
      const result = sanitize.url(url);

      expect(result).toBe("");
    });

    it("should block vbscript: protocol", () => {
      const url = "vbscript:msgbox(1)";
      const result = sanitize.url(url);

      expect(result).toBe("");
    });

    it("should trim whitespace", () => {
      const url = "  https://example.com  ";
      const result = sanitize.url(url);

      expect(result).toBe("https://example.com");
    });

    it("should handle empty input", () => {
      expect(sanitize.url("")).toBe("");
    });
  });
});

describe("CSV Sanitization", () => {
  describe("sanitizeCsvCell", () => {
    it("should prefix formula with single quote", () => {
      const malicious = '=cmd|"/c calc"!A1';
      const result = sanitize.csv(malicious);

      expect(result).toBe('\'=cmd|"/c calc"!A1');
    });

    it("should handle + prefix", () => {
      const malicious = "+1+2";
      const result = sanitize.csv(malicious);

      expect(result).toBe("'+1+2");
    });

    it("should handle - prefix", () => {
      const malicious = "-1";
      const result = sanitize.csv(malicious);

      expect(result).toBe("'-1");
    });

    it("should handle @ prefix", () => {
      const malicious = "@SUM(A1:A10)";
      const result = sanitize.csv(malicious);

      expect(result).toBe("'@SUM(A1:A10)");
    });

    it("should allow safe values", () => {
      const safe = "normal text";
      const result = sanitize.csv(safe);

      expect(result).toBe("normal text");
    });

    it("should handle empty input", () => {
      expect(sanitize.csv("")).toBe("");
    });
  });
});

describe("Email Sanitization", () => {
  describe("sanitizeEmail", () => {
    it("should accept valid emails", () => {
      const validEmails = [
        "user@example.com",
        "test.user@example.co.uk",
        "user+tag@example.com",
      ];

      for (const email of validEmails) {
        const result = sanitize.email(email);
        expect(result).toBe(email.toLowerCase());
      }
    });

    it("should reject invalid emails", () => {
      const invalidEmails = [
        "not-an-email",
        "@example.com",
        "user@",
        "user@.com",
      ];

      for (const email of invalidEmails) {
        const result = sanitize.email(email);
        expect(result).toBeNull();
      }
    });

    it("should normalize to lowercase", () => {
      const email = "USER@EXAMPLE.COM";
      const result = sanitize.email(email);

      expect(result).toBe("user@example.com");
    });

    it("should trim whitespace", () => {
      const email = "  user@example.com  ";
      const result = sanitize.email(email);

      expect(result).toBe("user@example.com");
    });

    it("should handle empty input", () => {
      expect(sanitize.email("")).toBeNull();
    });
  });
});

describe("String Truncation", () => {
  describe("truncate", () => {
    it("should truncate long strings", () => {
      const long = "a".repeat(100);
      const result = sanitize.truncate(long, 50);

      expect(result.length).toBe(50);
      expect(result).toContain("...");
    });

    it("should not truncate short strings", () => {
      const short = "hello";
      const result = sanitize.truncate(short, 50);

      expect(result).toBe("hello");
    });

    it("should handle exact length", () => {
      const exact = "a".repeat(50);
      const result = sanitize.truncate(exact, 50);

      expect(result).toBe(exact);
      expect(result).not.toContain("...");
    });

    it("should handle empty input", () => {
      expect(sanitize.truncate("", 50)).toBe("");
    });
  });
});
