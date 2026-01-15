/**
 * Example Project Templates for Onboarding
 *
 * Pre-configured project templates that help new users
 * understand Sageloop quickly.
 */

import { DEFAULT_MODEL_FOR_ONBOARDING } from "@/lib/ai/default-models";

export interface ExampleProjectTemplate {
  name: string;
  description: string;
  model_config: {
    model: string;
    system_prompt: string;
  };
  example_scenarios: string[];
}

/**
 * Customer Support Chatbot example project
 *
 * Why this template:
 * - Universal relevance: Every company has customer support
 * - Clear good/bad outputs: Easy to rate (helpful vs. unhelpful)
 * - Short outputs: Fast generation, low cost (~$0.05 for 10)
 * - Actionable patterns: Length, tone, escalation handling are clear dimensions
 */
export const EXAMPLE_PROJECT: ExampleProjectTemplate = {
  name: "Customer Support Chatbot (Example)",
  description: "Pre-configured example to help you learn Sageloop",
  model_config: {
    model: DEFAULT_MODEL_FOR_ONBOARDING,
    system_prompt: `You are a helpful customer support agent for an e-commerce company.

Your role:
- Answer questions about orders, shipping, returns
- Be friendly, professional, and concise
- If you don't know something, offer to escalate to a human agent

Current date: ${new Date().toISOString().split("T")[0]}`,
  },
  example_scenarios: [
    "Where is my order? Tracking number: ABC123",
    "How do I return a damaged item?",
    "Can I change my shipping address after ordering?",
    "What's your refund policy?",
    "My item arrived broken, what do I do?",
    "How long does shipping usually take?",
    "Do you ship internationally?",
    "Can I cancel my order?",
    "I was charged twice, help!",
    "How do I track my order?",
  ],
};

/**
 * Get example project with fresh current date in system prompt
 */
export function getExampleProject(): ExampleProjectTemplate {
  return {
    ...EXAMPLE_PROJECT,
    model_config: {
      ...EXAMPLE_PROJECT.model_config,
      system_prompt: `You are a helpful customer support agent for an e-commerce company.

Your role:
- Answer questions about orders, shipping, returns
- Be friendly, professional, and concise
- If you don't know something, offer to escalate to a human agent

Current date: ${new Date().toISOString().split("T")[0]}`,
    },
  };
}

/**
 * Re-export SUPPORTED_MODELS from centralized config
 * for backwards compatibility with existing imports
 */
export { SUPPORTED_MODELS } from "@/lib/ai/default-models";
