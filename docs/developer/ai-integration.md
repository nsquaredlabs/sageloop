# AI Integration

Sageloop calls OpenAI and Anthropic APIs directly. API keys come from `sageloop.config.yaml` (see [environment.md](environment.md)).

## Two Contexts for AI Usage

### 1. User-configured output generation

When generating outputs for scenarios, the model and API key are taken from the project's `model_config` and resolved through `lib/ai/provider-resolver.ts`.

### 2. System operations

Extraction, fix integration, and other internal AI calls use a fixed model defined in `lib/ai/system-model-config.ts`. This model is independent of the user's project settings.

## Generating Outputs

```typescript
import { resolveProvider } from "@/lib/ai/provider-resolver";
import { generateCompletion } from "@/lib/ai/generation";
import { getConfig } from "@/lib/config";

const config = getConfig();
const modelConfig = JSON.parse(project.model_config);

// Resolve provider from model name (e.g. "gpt-4o-mini" → openai)
const { provider, modelName, apiKey } = resolveProvider(modelConfig.model, {
  openai: config.openai_api_key,
  anthropic: config.anthropic_api_key,
});

const { text, usage } = await generateCompletion({
  provider,
  model: modelName,
  temperature: modelConfig.temperature ?? 0.7,
  systemPrompt: modelConfig.system_prompt,
  userMessage: scenario.input_text,
  apiKey,
});
```

### How `resolveProvider` works

1. Inspects the model name prefix:
   - `gpt-` → OpenAI
   - `claude-` → Anthropic
   - unknown → defaults to OpenAI
2. Returns the matching key from the config. If the key is missing, `apiKey` is `undefined` and the call will fail with an invalid-key error — surface this to the user.

## System Operations (Extraction etc.)

Use the centralized system model config for all internal AI calls:

```typescript
import { SYSTEM_MODEL_CONFIG } from "@/lib/ai/system-model-config";
import { generateCompletion } from "@/lib/ai/generation";

const { text } = await generateCompletion({
  provider: SYSTEM_MODEL_CONFIG.provider,
  model: SYSTEM_MODEL_CONFIG.model,
  temperature: SYSTEM_MODEL_CONFIG.temperature,
  systemPrompt: "You are an expert at analyzing AI output quality patterns...",
  userMessage: analysisData,
});
```

To change the model used for all system operations, edit one file:

```typescript
// lib/ai/system-model-config.ts
export const SYSTEM_MODEL_CONFIG = {
  provider: "anthropic" as const,
  model: "claude-haiku-4-5-20251001",
  temperature: 0.3,
} as const;
```

This affects extraction, fix integration, and any other internal AI task.

## generateCompletion API

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
```

### Variable interpolation

Use `{{variable}}` in prompts:

```typescript
const { text } = await generateCompletion({
  provider: "openai",
  model: "gpt-4o-mini",
  temperature: 0.7,
  systemPrompt: "Today is {{date}}. Be concise.",
  userMessage: "What is {{topic}}?",
  variables: { date: "2026-03-12", topic: "prompt engineering" },
  apiKey,
});
```

### Parsing JSON responses

System operations often request JSON output. Parse defensively:

````typescript
let parsed;
try {
  parsed = JSON.parse(text);
} catch {
  // Strip markdown code fences if present
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (match) {
    parsed = JSON.parse(match[1].trim());
  } else {
    throw new Error("AI returned invalid JSON");
  }
}
````

### Error handling

```typescript
try {
  const { text } = await generateCompletion(config);
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes("API key")) {
      // Surface "no API key configured" to the user
    }
    if (error.message.includes("rate limit")) {
      // Retry after delay or surface to user
    }
    if (error.message.includes("context length")) {
      // Input too long for model
    }
  }
  throw error;
}
```

## Supported Models

### OpenAI

- `gpt-4o` — Latest GPT-4, best quality
- `gpt-4o-mini` — Faster and cheaper, good default
- `gpt-4-turbo` — GPT-4 Turbo
- `gpt-3.5-turbo` — Cheapest option

### Anthropic

- `claude-3-5-sonnet-20241022` — Balanced (recommended)
- `claude-3-5-haiku-20241022` — Fast and efficient
- `claude-haiku-4-5-20251001` — Default system model
- `claude-3-opus-20240229` — Most capable, most expensive

The available models list shown in the UI comes from `app/api/models/route.ts`.

## Batch Generation

For generating outputs across multiple scenarios in parallel:

```typescript
const results = await Promise.all(
  scenarios.map(async (scenario) => {
    const { text } = await generateCompletion({
      provider,
      model: modelName,
      temperature: modelConfig.temperature,
      systemPrompt: modelConfig.system_prompt,
      userMessage: scenario.input_text,
      apiKey,
    });

    return {
      scenario_id: scenario.id,
      output_text: text,
      model_snapshot: JSON.stringify({ model: modelName }),
    };
  }),
);

db.insert(schema.outputs).values(results).run();
```

For large batches, consider queuing (see `lib/queue/generation-queue.ts`) rather than `Promise.all` to avoid hitting provider rate limits.

## Security Notes

System prompts are validated for injection attempts before being stored or used. See [prompt-injection.md](prompt-injection.md) for the full analysis and defense strategy.

Never log full API keys. If you need to log which key was used, mask it:

```typescript
const masked = key.slice(0, 7) + "..." + key.slice(-4);
console.log("Using key:", masked);
```
