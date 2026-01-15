import { describe, it, expect } from "vitest";
import {
  DEFAULT_MODEL_BY_PLAN,
  DEFAULT_MODEL_FOR_ONBOARDING,
  DEFAULT_MODEL_FALLBACK,
  SUPPORTED_MODELS,
  getDefaultModelForPlan,
  getModelsForPlan,
} from "@/lib/ai/default-models";
import { MODEL_TIER_MAP, getModelTier } from "@/lib/ai/model-tiers";

/**
 * Default Model Configuration Tests
 *
 * Verifies the centralized model configuration aligns with:
 * - Marketing pricing tiers (PricingTiers.tsx)
 * - Model tier definitions (model-tiers.ts)
 */

describe("Default Model Configuration", () => {
  describe("DEFAULT_MODEL_BY_PLAN", () => {
    it("should use gpt-5-nano for free tier", () => {
      expect(DEFAULT_MODEL_BY_PLAN.free).toBe("gpt-5-nano");
    });

    it("should use gpt-5-mini for paid tiers", () => {
      expect(DEFAULT_MODEL_BY_PLAN.pro).toBe("gpt-5-mini");
      expect(DEFAULT_MODEL_BY_PLAN.team).toBe("gpt-5-mini");
      expect(DEFAULT_MODEL_BY_PLAN.enterprise).toBe("gpt-5-mini");
    });

    it("should have all plan types defined", () => {
      const plans = ["free", "pro", "team", "enterprise"] as const;
      plans.forEach((plan) => {
        expect(DEFAULT_MODEL_BY_PLAN[plan]).toBeDefined();
        expect(typeof DEFAULT_MODEL_BY_PLAN[plan]).toBe("string");
      });
    });
  });

  describe("DEFAULT_MODEL_FOR_ONBOARDING", () => {
    it("should be gpt-5-nano (new users start on free tier)", () => {
      expect(DEFAULT_MODEL_FOR_ONBOARDING).toBe("gpt-5-nano");
    });

    it("should be classified as free tier in model-tiers", () => {
      const tier = getModelTier(DEFAULT_MODEL_FOR_ONBOARDING);
      expect(tier).toBe("free");
    });

    it("should be included in SUPPORTED_MODELS", () => {
      const found = SUPPORTED_MODELS.some(
        (m) => m.id === DEFAULT_MODEL_FOR_ONBOARDING,
      );
      expect(found).toBe(true);
    });
  });

  describe("DEFAULT_MODEL_FALLBACK", () => {
    it("should be a safe fallback (free tier model)", () => {
      expect(DEFAULT_MODEL_FALLBACK).toBe("gpt-5-nano");
      expect(getModelTier(DEFAULT_MODEL_FALLBACK)).toBe("free");
    });
  });

  // Note: DEFAULT_TEMPERATURE has been removed as GPT-5 models don't accept temperature parameters

  describe("getDefaultModelForPlan", () => {
    it("should return correct default for each plan", () => {
      expect(getDefaultModelForPlan("free")).toBe("gpt-5-nano");
      expect(getDefaultModelForPlan("pro")).toBe("gpt-5-mini");
      expect(getDefaultModelForPlan("team")).toBe("gpt-5-mini");
      expect(getDefaultModelForPlan("enterprise")).toBe("gpt-5-mini");
    });

    it("should return fallback for unknown plan", () => {
      // @ts-expect-error - Testing invalid input
      expect(getDefaultModelForPlan("invalid")).toBe(DEFAULT_MODEL_FALLBACK);
    });
  });

  describe("SUPPORTED_MODELS", () => {
    it("should have at least one model", () => {
      expect(SUPPORTED_MODELS.length).toBeGreaterThan(0);
    });

    it("should have required properties for all models", () => {
      SUPPORTED_MODELS.forEach((model) => {
        expect(model.id).toBeDefined();
        expect(model.name).toBeDefined();
        expect(model.provider).toBeDefined();
        expect(model.tier).toBeDefined();
        expect(["openai", "anthropic"]).toContain(model.provider);
        expect(["free", "standard", "premium", "enterprise"]).toContain(
          model.tier,
        );
      });
    });

    it("should have no duplicate model IDs", () => {
      const ids = SUPPORTED_MODELS.map((m) => m.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it("should have free tier models first (for better UX)", () => {
      const firstModel = SUPPORTED_MODELS[0];
      expect(firstModel.tier).toBe("free");
    });

    it("should include all models from marketing pricing tiers", () => {
      // From PricingTiers.tsx - Free tier
      expect(SUPPORTED_MODELS.some((m) => m.id === "gpt-5-nano")).toBe(true);

      // From PricingTiers.tsx - Pro tier (standard)
      expect(SUPPORTED_MODELS.some((m) => m.id === "gpt-5-mini")).toBe(true);

      // From PricingTiers.tsx - Pro tier (premium)
      expect(SUPPORTED_MODELS.some((m) => m.id === "gpt-5.1")).toBe(true);
    });
  });

  describe("getModelsForPlan", () => {
    it("should return only free tier models for free plan", () => {
      const models = getModelsForPlan("free");
      models.forEach((model) => {
        expect(model.tier).toBe("free");
      });
    });

    it("should return free, standard, and premium models for pro plan", () => {
      const models = getModelsForPlan("pro");
      const tiers = new Set(models.map((m) => m.tier));

      expect(tiers.has("free")).toBe(true);
      expect(tiers.has("standard")).toBe(true);
      expect(tiers.has("premium")).toBe(true);
      expect(tiers.has("enterprise")).toBe(false);
    });

    it("should return all models for enterprise plan", () => {
      const models = getModelsForPlan("enterprise");
      const tiers = new Set(models.map((m) => m.tier));

      expect(tiers.has("free")).toBe(true);
      expect(tiers.has("standard")).toBe(true);
      expect(tiers.has("premium")).toBe(true);
      expect(tiers.has("enterprise")).toBe(true);
    });

    it("should return same models for pro and team plans", () => {
      const proModels = getModelsForPlan("pro");
      const teamModels = getModelsForPlan("team");

      expect(proModels.length).toBe(teamModels.length);
      proModels.forEach((proModel) => {
        const found = teamModels.some(
          (teamModel) => teamModel.id === proModel.id,
        );
        expect(found).toBe(true);
      });
    });
  });

  describe("Model tier alignment", () => {
    it("should align SUPPORTED_MODELS tiers with MODEL_TIER_MAP", () => {
      SUPPORTED_MODELS.forEach((model) => {
        const tierInMap = MODEL_TIER_MAP[model.id];
        if (tierInMap) {
          expect(model.tier).toBe(tierInMap);
        }
      });
    });
  });
});

describe("Marketing Pricing Alignment", () => {
  /**
   * These tests verify that default-models.ts aligns with
   * the marketing pricing tiers in PricingTiers.tsx
   */

  it("Free tier should have gpt-5-nano as default", () => {
    // Marketing: "GPT-5-nano (standard)"
    expect(DEFAULT_MODEL_BY_PLAN.free).toBe("gpt-5-nano");
    expect(getModelTier("gpt-5-nano")).toBe("free");
  });

  it("Pro tier should have gpt-5-mini as default", () => {
    // Marketing: "GPT-5-mini (standard)"
    expect(DEFAULT_MODEL_BY_PLAN.pro).toBe("gpt-5-mini");
    expect(getModelTier("gpt-5-mini")).toBe("standard");
  });

  it("should support premium models for Pro+ tiers", () => {
    // Marketing: "GPT-5.1 or Claude Sonnet 4.5 (premium)"
    const proModels = getModelsForPlan("pro");
    const premiumIds = proModels
      .filter((m) => m.tier === "premium")
      .map((m) => m.id);

    expect(premiumIds.includes("gpt-5.1")).toBe(true);
    expect(
      premiumIds.includes("claude-3-5-sonnet-20241022") ||
        premiumIds.includes("claude-sonnet-4-5"),
    ).toBe(true);
  });
});
