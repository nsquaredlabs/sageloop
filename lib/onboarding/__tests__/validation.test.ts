import { describe, it, expect } from "vitest";
import {
  projectSetupSchema,
  parseBulkScenarios,
  validateBulkScenarios,
} from "../validation";

describe("projectSetupSchema", () => {
  it("validates a valid project setup", () => {
    const validData = {
      name: "My Test Project",
      description: "A test project",
      model: "gpt-3.5-turbo",
      systemPrompt: "You are a helpful assistant.",
    };

    const result = projectSetupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("rejects project name that is too short", () => {
    const invalidData = {
      name: "ab", // Too short (min 3)
      model: "gpt-3.5-turbo",
      systemPrompt: "You are a helpful assistant.",
    };

    const result = projectSetupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects project name that is too long", () => {
    const invalidData = {
      name: "a".repeat(101), // Too long (max 100)
      model: "gpt-3.5-turbo",
      systemPrompt: "You are a helpful assistant.",
    };

    const result = projectSetupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects empty model", () => {
    const invalidData = {
      name: "My Project",
      model: "",
      systemPrompt: "You are a helpful assistant.",
    };

    const result = projectSetupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects system prompt that is too short", () => {
    const invalidData = {
      name: "My Project",
      model: "gpt-3.5-turbo",
      systemPrompt: "Hi", // Too short (min 10)
    };

    const result = projectSetupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("rejects system prompt that is too long", () => {
    const invalidData = {
      name: "My Project",
      model: "gpt-3.5-turbo",
      systemPrompt: "a".repeat(10001), // Too long (max 10000)
    };

    const result = projectSetupSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("validates without temperature (temperature has been removed)", () => {
    // Temperature is no longer part of project setup - GPT-5 models don't accept it
    const validData = {
      name: "My Project",
      model: "gpt-3.5-turbo",
      systemPrompt: "You are a helpful assistant.",
    };

    const result = projectSetupSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe("parseBulkScenarios", () => {
  it("splits scenarios by double newlines", () => {
    const input = "Scenario 1\n\nScenario 2\n\nScenario 3";
    const result = parseBulkScenarios(input);

    expect(result).toEqual(["Scenario 1", "Scenario 2", "Scenario 3"]);
  });

  it("preserves single newlines within scenarios (Shift+Enter behavior)", () => {
    const input = "Scenario 1\nwith multiple lines\n\nScenario 2\n\nScenario 3";
    const result = parseBulkScenarios(input);

    expect(result).toEqual([
      "Scenario 1\nwith multiple lines",
      "Scenario 2",
      "Scenario 3",
    ]);
  });

  it("handles multi-line scenarios with bullet points", () => {
    const input =
      "Customer complaint:\n- Order delayed\n- No tracking info\n- Need refund\n\nSimple question about returns\n\nMulti-part request:\n1. Check status\n2. Update address";
    const result = parseBulkScenarios(input);

    expect(result).toEqual([
      "Customer complaint:\n- Order delayed\n- No tracking info\n- Need refund",
      "Simple question about returns",
      "Multi-part request:\n1. Check status\n2. Update address",
    ]);
  });

  it("trims whitespace from scenarios", () => {
    const input = "  Scenario 1  \n\n  Scenario 2  \n\n  Scenario 3  ";
    const result = parseBulkScenarios(input);

    expect(result).toEqual(["Scenario 1", "Scenario 2", "Scenario 3"]);
  });

  it("handles multiple consecutive blank lines as single separator", () => {
    const input = "Scenario 1\n\n\n\nScenario 2\n\n\nScenario 3";
    const result = parseBulkScenarios(input);

    expect(result).toEqual(["Scenario 1", "Scenario 2", "Scenario 3"]);
  });

  it("filters out scenarios that are too long", () => {
    const longScenario = "a".repeat(501); // Over 500 chars
    const input = `Scenario 1\n\n${longScenario}\n\nScenario 3`;
    const result = parseBulkScenarios(input);

    expect(result).toEqual(["Scenario 1", "Scenario 3"]);
  });

  it("returns empty array for empty input", () => {
    const result = parseBulkScenarios("");
    expect(result).toEqual([]);
  });

  it("returns empty array for whitespace-only input", () => {
    const result = parseBulkScenarios("   \n\n   \n   ");
    expect(result).toEqual([]);
  });

  it("treats single scenario with no double newlines as one scenario", () => {
    const input =
      "This is a single scenario\nwith multiple lines\nno blank lines";
    const result = parseBulkScenarios(input);

    expect(result).toEqual([
      "This is a single scenario\nwith multiple lines\nno blank lines",
    ]);
  });
});

describe("validateBulkScenarios", () => {
  it("validates valid scenarios separated by double newlines", () => {
    const input = "Scenario 1\n\nScenario 2\n\nScenario 3";
    const result = validateBulkScenarios(input);

    expect(result.valid).toBe(true);
    expect(result.scenarios).toHaveLength(3);
    expect(result.errors).toHaveLength(0);
  });

  it("validates multi-line scenarios", () => {
    const input =
      "Scenario 1\nwith extra line\n\nScenario 2\n\nScenario 3\nwith bullets:\n- item 1\n- item 2";
    const result = validateBulkScenarios(input);

    expect(result.valid).toBe(true);
    expect(result.scenarios).toHaveLength(3);
    expect(result.scenarios[0]).toBe("Scenario 1\nwith extra line");
    expect(result.scenarios[2]).toBe(
      "Scenario 3\nwith bullets:\n- item 1\n- item 2",
    );
  });

  it("returns error for empty input", () => {
    const result = validateBulkScenarios("");

    expect(result.valid).toBe(false);
    expect(result.scenarios).toHaveLength(0);
    expect(result.errors).toContain("At least 1 scenario is required");
  });

  it("warns about truncated scenarios", () => {
    const longScenario = "a".repeat(501);
    const input = `Scenario 1\n\n${longScenario}\n\nScenario 3`;
    const result = validateBulkScenarios(input);

    expect(result.valid).toBe(false);
    expect(result.scenarios).toHaveLength(2);
    expect(result.errors.some((e) => e.includes("exceed 500 characters"))).toBe(
      true,
    );
  });

  it("returns error for more than 1000 scenarios", () => {
    const scenarios = Array(1001).fill("Scenario").join("\n\n");
    const result = validateBulkScenarios(scenarios);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain("Maximum 1000 scenarios allowed");
  });
});
