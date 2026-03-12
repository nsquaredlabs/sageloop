# Environment & Configuration

Sageloop uses a YAML config file instead of environment variables for API keys and model selection. This keeps configuration portable and easy to edit without restarting the server.

## sageloop.config.yaml

Create this file in the project root (same directory as `package.json`):

```yaml
openai_api_key: sk-proj-...
anthropic_api_key: sk-ant-...
output_model: gpt-4o-mini
system_model: claude-haiku-4-5-20251001
```

The file is optional. If it does not exist, the app starts without API keys and users can set them through the Settings UI.

### Config fields

| Field               | Type   | Description                                                                                              |
| ------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| `openai_api_key`    | string | OpenAI API key. Required if using OpenAI models.                                                         |
| `anthropic_api_key` | string | Anthropic API key. Required if using Claude models.                                                      |
| `output_model`      | string | Default model for generating outputs. Defaults to `gpt-4o-mini`.                                         |
| `system_model`      | string | Model used for system operations (extraction, fix integration). Defaults to `claude-haiku-4-5-20251001`. |

Empty string values (`""`) are treated as unset.

## Reading Config in Code

Use `getConfig()` from `lib/config.ts`:

```typescript
import { getConfig } from "@/lib/config";

const config = getConfig();
const openaiKey = config.openai_api_key; // string | undefined
const model = config.output_model; // string | undefined
```

`getConfig()` caches the parsed YAML on first call. To clear the cache (useful in tests), call `resetConfigCache()`.

## Saving Config via the Settings UI

The settings route uses `saveConfig()` to write changes back to `sageloop.config.yaml`:

```typescript
import { saveConfig } from "@/lib/config";

saveConfig({
  openai_api_key: "sk-proj-...",
  anthropic_api_key: "",
  output_model: "gpt-4o-mini",
  system_model: "claude-haiku-4-5-20251001",
});
```

`saveConfig()` always writes all four fields (empty string for unset values) and clears the cache so the next `getConfig()` reads the new file.

## Checking if any key is configured

```typescript
import { hasAnyApiKey } from "@/lib/config";

if (!hasAnyApiKey()) {
  // Redirect to settings
}
```

## .env Files

Sageloop does not require a `.env.local` file for normal operation. The only reason to use one is if you want to override Next.js internals or add build-time constants.

`lib/env.ts` still exists and is used in a few places for things like `NODE_ENV`. Do not add Supabase or API key variables there — they belong in `sageloop.config.yaml`.

## gitignore

Add `sageloop.config.yaml` to `.gitignore` so API keys are not committed:

```
sageloop.config.yaml
sageloop.db
sageloop.db-shm
sageloop.db-wal
```

## Testing

In tests, use `resetConfigCache()` before each test that reads config, then set the environment to whatever state you need:

```typescript
import { resetConfigCache } from "@/lib/config";
import * as fs from "fs";

beforeEach(() => {
  resetConfigCache();
});

it("returns empty config when file missing", () => {
  // Ensure file doesn't exist in test environment
  const config = getConfig();
  expect(config.openai_api_key).toBeUndefined();
});
```

For tests that need a specific config, write a temp file or mock the `fs` module:

```typescript
import { vi } from "vitest";

vi.mock("fs", () => ({
  existsSync: vi.fn(() => true),
  readFileSync: vi.fn(() => "openai_api_key: sk-test\n"),
  writeFileSync: vi.fn(),
}));
```
