# AI Integration Guide

This guide covers AI provider integration, model selection, and output generation patterns in Sageloop.

## Overview

Sageloop integrates with multiple AI providers:

- **OpenAI** (GPT-4, GPT-3.5)
- **Anthropic** (Claude models)

There are two types of AI operations:

1. **User-configured operations** - Generate outputs using user's model settings
2. **System operations** - Extractions, insights, and fixes using our configured model

## AI Provider Architecture

### Two Contexts for AI Usage

#### 1. User-Configured Models (Generating Outputs)

When generating outputs based on user's project settings:

- Use the **provider resolver** to select provider
- Respect user's model configuration
- Use user's API keys (if provided) or fallback to system keys
- User controls: model, temperature, system prompt

#### 2. System Operations (Extractions, Insights, Fixes)

When performing system tasks like pattern extraction:

- Use **centralized system model config**
- Single source of truth for system model
- Always uses system API keys
- We control: model, temperature, prompts

## User-Configured Models

### Provider Resolution

Use the provider resolver when generating outputs:

```typescript
import { resolveProvider } from "@/lib/ai/provider-resolver";
import { generateCompletion } from "@/lib/ai/generation";

// Get user's API keys from workbench
const { data: apiKeys } = await supabase
  .from("workbench_api_keys")
  .select("openai_key, anthropic_key")
  .eq("workbench_id", workbenchId)
  .single();

// Resolve which provider to use
const { provider, modelName, apiKey, usingFallback } = resolveProvider(
  modelConfig.model, // e.g., "gpt-4", "claude-3-opus-20240229"
  {
    openai: apiKeys?.openai_key,
    anthropic: apiKeys?.anthropic_key,
  },
);

// Generate completion
const { text, usage } = await generateCompletion({
  provider,
  model: modelName,
  temperature: modelConfig.temperature,
  systemPrompt: modelConfig.system_prompt,
  userMessage: scenario.input_text,
  apiKey,
});
```

### Provider Resolver Logic

The resolver follows this logic:

1. **Determine provider from model name**
   - Models starting with `gpt-` → OpenAI
   - Models starting with `claude-` → Anthropic
   - Unknown models → Default to OpenAI

2. **Check for user API key**
   - If user provided key for this provider → Use it
   - Otherwise → Fallback to system key

3. **Return resolution**
   - `provider`: 'openai' | 'anthropic'
   - `modelName`: The actual model name to use
   - `apiKey`: The key to use (user's or system's)
   - `usingFallback`: Boolean indicating if using system key

### Example: Generate Output for Scenario

```typescript
// app/api/projects/[id]/generate/route.ts

export async function POST(request: Request) {
  const { scenarioIds } = await request.json();

  // Get project and user's API keys
  const { data: project } = await supabase
    .from("projects")
    .select("model_config, workbench_id")
    .eq("id", projectId)
    .single();

  const { data: apiKeys } = await supabase.rpc("get_workbench_api_keys", {
    workbench_uuid: project.workbench_id,
  });

  // Generate output for each scenario
  for (const scenarioId of scenarioIds) {
    const { data: scenario } = await supabase
      .from("scenarios")
      .select("*")
      .eq("id", scenarioId)
      .single();

    // Resolve provider
    const { provider, modelName, apiKey } = resolveProvider(
      project.model_config.model,
      {
        openai: apiKeys?.openai_key,
        anthropic: apiKeys?.anthropic_key,
      },
    );

    // Generate
    const { text, usage } = await generateCompletion({
      provider,
      model: modelName,
      temperature: project.model_config.temperature,
      systemPrompt: project.model_config.system_prompt,
      userMessage: scenario.input_text,
      apiKey,
    });

    // Save output
    await supabase.from("outputs").insert({
      scenario_id: scenarioId,
      output_text: text,
      version: nextVersion,
      model_used: modelName,
      temperature_used: project.model_config.temperature,
    });
  }

  return NextResponse.json({ success: true });
}
```

## System Operations

### System Model Configuration

All system operations (extractions, insights, fixes) use a centralized configuration:

```typescript
import { SYSTEM_MODEL_CONFIG } from "@/lib/ai/system-model-config";
import { generateCompletion } from "@/lib/ai/generation";

// All system operations use the same model/provider
const result = await generateCompletion({
  provider: SYSTEM_MODEL_CONFIG.provider, // 'openai' or 'anthropic'
  model: SYSTEM_MODEL_CONFIG.model, // 'gpt-4', 'claude-3-opus', etc.
  temperature: SYSTEM_MODEL_CONFIG.temperature, // Usually 0.3 for deterministic
  systemPrompt: "You are an expert at...",
  userMessage: "Analyze this data...",
  apiKey: undefined, // Uses system API key from env
});
```

### Changing the System Model

To change the system model used for all operations, edit **one file**:

```typescript
// lib/ai/system-model-config.ts

export const SYSTEM_MODEL_CONFIG = {
  provider: "openai" as const,
  model: "gpt-4o", // Change this to switch models globally
  temperature: 0.3,
} as const;
```

This affects:

- Pattern extraction
- Fix suggestion integration
- Future insights features
- Any other system-level AI operations

### Example: Extract Patterns (System Operation)

```typescript
// app/api/projects/[id]/extract/route.ts

import { SYSTEM_MODEL_CONFIG } from "@/lib/ai/system-model-config";
import { generateCompletion } from "@/lib/ai/generation";

export async function POST(request: Request) {
  // Get rated outputs
  const { data: outputs } = await supabase
    .from("outputs")
    .select("*, ratings(*)")
    .in("scenario_id", scenarioIds);

  // Use system model for extraction
  const { text } = await generateCompletion({
    provider: SYSTEM_MODEL_CONFIG.provider,
    model: SYSTEM_MODEL_CONFIG.model,
    temperature: SYSTEM_MODEL_CONFIG.temperature,

    systemPrompt: `You are an expert at analyzing AI output quality patterns.
Analyze the rated outputs and extract behavioral patterns.
Return JSON with this structure: {...}`,

    userMessage: `Analyze these ${outputs.length} rated outputs:
${JSON.stringify(outputs, null, 2)}`,

    apiKey: undefined, // Uses system key
  });

  // Parse and save extraction
  const extraction = JSON.parse(text);
  await supabase.from("extractions").insert({
    project_id: projectId,
    data: extraction,
  });

  return NextResponse.json({ success: true, data: extraction });
}
```

## Generation API

### Core Function: `generateCompletion`

```typescript
interface GenerationConfig {
  provider: "openai" | "anthropic";
  model: string;
  temperature: number;
  systemPrompt?: string;
  userMessage: string;
  apiKey?: string;
  variables?: Record<string, string>;
}

interface GenerationResult {
  text: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

async function generateCompletion(
  config: GenerationConfig,
): Promise<GenerationResult>;
```

### Variable Interpolation

Support `{{variable}}` syntax in prompts:

```typescript
const { text } = await generateCompletion({
  provider: "openai",
  model: "gpt-4",
  temperature: 0.7,
  systemPrompt: "You are helpful. Today is {{current_date}}.",
  userMessage: "Tell me about {{topic}}.",
  variables: {
    current_date: "2024-01-15",
    topic: "AI safety",
  },
});

// Interpolated prompts:
// System: "You are helpful. Today is 2024-01-15."
// User: "Tell me about AI safety."
```

### Error Handling

```typescript
try {
  const { text } = await generateCompletion(config);
} catch (error) {
  if (error.message.includes("API key")) {
    throw new Error("Invalid or missing API key");
  }
  if (error.message.includes("rate limit")) {
    throw new Error("Rate limit exceeded");
  }
  if (error.message.includes("context length")) {
    throw new Error("Input too long for model");
  }
  throw error;
}
```

## Supported Models

### OpenAI Models

```typescript
const openaiModels = [
  "gpt-4o", // Latest GPT-4 (recommended)
  "gpt-4o-mini", // Faster, cheaper GPT-4
  "gpt-4-turbo", // GPT-4 Turbo
  "gpt-4", // Original GPT-4
  "gpt-3.5-turbo", // Faster, cheaper
];
```

### Anthropic Models

```typescript
const anthropicModels = [
  "claude-3-5-sonnet-20241022", // Latest Claude (recommended)
  "claude-3-5-haiku-20241022", // Fast and efficient
  "claude-3-opus-20240229", // Most capable
  "claude-3-sonnet-20240229", // Balanced
  "claude-3-haiku-20240307", // Fast and cheap
];
```

### Model Selection Guidelines

**For user outputs (user-configured)**:

- Let users choose their preferred model
- Default to `gpt-4o` (good balance of quality/cost)
- Support fallback if user's chosen model unavailable

**For system operations**:

- Use `gpt-4o` or `claude-3-5-sonnet-20241022`
- Prioritize accuracy over cost (we control costs)
- Lower temperature (0.3) for deterministic results

## API Key Management

### User API Keys

Stored encrypted in `workbench_api_keys` table:

```typescript
// Set keys (encrypted automatically)
await supabase.rpc("set_workbench_api_keys", {
  workbench_uuid: workbenchId,
  api_keys_json: {
    openai_key: "sk-proj-...",
    anthropic_key: "sk-ant-...",
  },
});

// Get keys (decrypted automatically)
const { data: apiKeys } = await supabase.rpc("get_workbench_api_keys", {
  workbench_uuid: workbenchId,
});

// Check if keys exist (returns booleans, not actual keys)
const { data: keyStatus } = await supabase.rpc("check_workbench_api_keys", {
  workbench_uuid: workbenchId,
});
// Returns: { openai: true, anthropic: false }
```

### System API Keys

Stored in environment variables:

```typescript
import { env } from "@/lib/env";

const openaiKey = env.openai.apiKey; // Optional
const anthropicKey = env.anthropic.apiKey; // Optional
```

See [Environment Guide](environment.md) for details.

## Common Patterns

### Pattern 1: Generate with Fallback

```typescript
const { provider, modelName, apiKey, usingFallback } = resolveProvider(
  requestedModel,
  userApiKeys,
);

const { text } = await generateCompletion({
  provider,
  model: modelName,
  temperature: 0.7,
  systemPrompt: prompt,
  userMessage: input,
  apiKey,
});

// Optionally notify user if fallback was used
if (usingFallback) {
  console.log("Used system API key as fallback");
}
```

### Pattern 2: Batch Generation

```typescript
const outputs = await Promise.all(
  scenarios.map(async (scenario) => {
    const { text } = await generateCompletion({
      provider,
      model: modelName,
      temperature: 0.7,
      systemPrompt: systemPrompt,
      userMessage: scenario.input_text,
      apiKey,
    });

    return {
      scenario_id: scenario.id,
      output_text: text,
      version: nextVersion,
    };
  }),
);

await supabase.from("outputs").insert(outputs);
```

### Pattern 3: Streaming Responses (Future)

Currently not implemented, but can be added:

```typescript
// Future: Stream responses for long-running generations
const stream = await generateCompletionStream({
  provider,
  model: modelName,
  systemPrompt: prompt,
  userMessage: input,
});

for await (const chunk of stream) {
  // Send chunk to client via Server-Sent Events
  yield chunk;
}
```

### Pattern 4: JSON Output Parsing

````typescript
const { text } = await generateCompletion({
  provider: SYSTEM_MODEL_CONFIG.provider,
  model: SYSTEM_MODEL_CONFIG.model,
  temperature: 0.3,
  systemPrompt: "You are a JSON generator. Return valid JSON only.",
  userMessage: "Generate analysis...",
});

// Parse JSON response
let parsed;
try {
  // Try direct parse
  parsed = JSON.parse(text);
} catch {
  // Try extracting JSON from markdown code block
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (match) {
    parsed = JSON.parse(match[1].trim());
  } else {
    throw new Error("Invalid JSON response");
  }
}
````

## Cost Tracking

Track token usage for billing and optimization:

```typescript
const { text, usage } = await generateCompletion(config);

// Log usage
console.log("Tokens used:", usage);
// {
//   promptTokens: 150,
//   completionTokens: 300,
//   totalTokens: 450
// }

// Store in database for analytics
await supabase.from("ai_usage_logs").insert({
  project_id: projectId,
  model: config.model,
  prompt_tokens: usage.promptTokens,
  completion_tokens: usage.completionTokens,
  total_tokens: usage.totalTokens,
});
```

### Cost Estimation

Rough pricing (as of 2024):

| Model             | Input ($/1M tokens) | Output ($/1M tokens) |
| ----------------- | ------------------- | -------------------- |
| GPT-4o            | $2.50               | $10.00               |
| GPT-4o-mini       | $0.15               | $0.60                |
| GPT-4             | $30.00              | $60.00               |
| Claude 3.5 Sonnet | $3.00               | $15.00               |
| Claude 3.5 Haiku  | $0.80               | $4.00                |

## Testing AI Integration

### Mock AI Responses

```typescript
// tests/unit/ai/generation.test.ts

import { vi } from "vitest";
import { generateCompletion } from "@/lib/ai/generation";

// Mock fetch to return fake AI responses
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: { content: "Mocked AI response" },
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    }),
  } as Response),
);

describe("generateCompletion", () => {
  it("should generate completion", async () => {
    const result = await generateCompletion({
      provider: "openai",
      model: "gpt-4",
      temperature: 0.7,
      systemPrompt: "You are helpful",
      userMessage: "Hello",
    });

    expect(result.text).toBe("Mocked AI response");
    expect(result.usage.totalTokens).toBe(30);
  });
});
```

### Integration Tests

For integration tests, use real API calls with test keys:

```typescript
// .env.test.local
OPENAI_API_KEY=sk-test-...
ANTHROPIC_API_KEY=sk-ant-test-...
```

## Prompt Engineering Best Practices

### 1. Clear Instructions

```typescript
// ❌ Vague
systemPrompt: "Be helpful";

// ✅ Clear
systemPrompt: "You are a customer service agent. Respond professionally and concisely. Include order number in response.";
```

### 2. Structured Output

```typescript
// ❌ Unstructured
systemPrompt: "Analyze the outputs";

// ✅ Structured
systemPrompt: `Analyze the outputs and return JSON:
{
  "summary": "Brief summary",
  "patterns": ["Pattern 1", "Pattern 2"],
  "suggestions": ["Fix 1", "Fix 2"]
}`;
```

### 3. Few-Shot Examples

```typescript
systemPrompt: `You are a sentiment analyzer. Examples:

Input: "Great service!"
Output: { "sentiment": "positive", "score": 0.9 }

Input: "Terrible experience"
Output: { "sentiment": "negative", "score": 0.1 }

Now analyze the user's input.`;
```

## Security Considerations

### 1. Prompt Injection Prevention

See [Prompt Injection Analysis](../security/PROMPT_INJECTION_ANALYSIS.md) for comprehensive defense strategy.

### 2. API Key Security

- Never log full API keys
- Use masked versions for debugging
- Store user keys encrypted
- Don't expose keys in responses

### 3. Rate Limiting

Apply rate limits to generation endpoints:

```typescript
export const POST = withRateLimit(
  async (request: Request) => {
    // Generation logic
  },
  RATE_LIMITS.generation, // 20 per hour
);
```

## Troubleshooting

### "Invalid API key"

- Check environment variables are set
- Verify user API key is correct format
- Ensure key has proper permissions

### "Rate limit exceeded"

- User or system key hit provider rate limits
- Implement backoff and retry logic
- Consider upgrading API tier

### "Context length exceeded"

- Input + output exceeds model's context window
- Truncate input or use model with larger context
- GPT-4o: 128K tokens
- Claude 3.5: 200K tokens

### "Model not found"

- Check model name spelling
- Verify model is available for your API tier
- Some models require special access

## Related Documentation

- [Environment Guide](environment.md) - API key configuration
- [Security Checklist](../security/SECURITY_CHECKLIST.md) - API key security
- [Prompt Injection Analysis](../security/PROMPT_INJECTION_ANALYSIS.md) - Prompt security
