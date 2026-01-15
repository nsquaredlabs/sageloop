import { describe, it, expect } from "vitest";
import {
  getExampleProject,
  EXAMPLE_PROJECT,
  SUPPORTED_MODELS,
} from "../templates";
import { DEFAULT_MODEL_FOR_ONBOARDING } from "@/lib/ai/default-models";

describe("EXAMPLE_PROJECT", () => {
  it("has a valid name", () => {
    expect(EXAMPLE_PROJECT.name).toBeTruthy();
    expect(EXAMPLE_PROJECT.name.length).toBeGreaterThan(0);
  });

  it("has a valid description", () => {
    expect(EXAMPLE_PROJECT.description).toBeTruthy();
    expect(EXAMPLE_PROJECT.description.length).toBeGreaterThan(0);
  });

  it("has valid model config", () => {
    expect(EXAMPLE_PROJECT.model_config).toBeTruthy();
    expect(EXAMPLE_PROJECT.model_config.model).toBe(
      DEFAULT_MODEL_FOR_ONBOARDING,
    );
    expect(EXAMPLE_PROJECT.model_config.system_prompt).toBeTruthy();
    // Temperature has been removed - GPT-5 models don't accept it
    expect(EXAMPLE_PROJECT.model_config).not.toHaveProperty("temperature");
  });

  it("has 10 example scenarios", () => {
    expect(EXAMPLE_PROJECT.example_scenarios).toHaveLength(10);
  });

  it("all scenarios are non-empty strings", () => {
    EXAMPLE_PROJECT.example_scenarios.forEach((scenario) => {
      expect(typeof scenario).toBe("string");
      expect(scenario.length).toBeGreaterThan(0);
    });
  });
});

describe("getExampleProject", () => {
  it("returns a fresh copy with updated date", () => {
    const project = getExampleProject();

    expect(project.name).toBe(EXAMPLE_PROJECT.name);
    expect(project.description).toBe(EXAMPLE_PROJECT.description);
    expect(project.example_scenarios).toEqual(
      EXAMPLE_PROJECT.example_scenarios,
    );

    // System prompt should contain current date
    const today = new Date().toISOString().split("T")[0];
    expect(project.model_config.system_prompt).toContain(today);
  });

  it("returns consistent data on multiple calls", () => {
    const project1 = getExampleProject();
    const project2 = getExampleProject();

    expect(project1.name).toBe(project2.name);
    expect(project1.model_config.model).toBe(project2.model_config.model);
  });
});

describe("SUPPORTED_MODELS", () => {
  it("has at least one model", () => {
    expect(SUPPORTED_MODELS.length).toBeGreaterThan(0);
  });

  it("all models have required properties", () => {
    SUPPORTED_MODELS.forEach((model) => {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.provider).toBeTruthy();
      expect(["openai", "anthropic"]).toContain(model.provider);
    });
  });

  it("includes default onboarding model", () => {
    const hasDefault = SUPPORTED_MODELS.some(
      (m) => m.id === DEFAULT_MODEL_FOR_ONBOARDING,
    );
    expect(hasDefault).toBe(true);
  });

  it("has no duplicate model IDs", () => {
    const ids = SUPPORTED_MODELS.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });
});
