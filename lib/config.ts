import fs from "fs";
import path from "path";
import yaml from "js-yaml";

export interface SageloopConfig {
  openai_api_key?: string;
  anthropic_api_key?: string;
  default_model?: string;
}

const CONFIG_PATH = path.join(process.cwd(), "sageloop.config.yaml");

let _config: SageloopConfig | null = null;

export function getConfig(): SageloopConfig {
  if (_config) return _config;

  if (!fs.existsSync(CONFIG_PATH)) {
    // Return empty config - user can set keys via UI
    _config = {};
    return _config;
  }

  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  const parsed = yaml.load(raw) as Record<string, unknown> | null;

  _config = {
    openai_api_key: parsed?.openai_api_key as string | undefined,
    anthropic_api_key: parsed?.anthropic_api_key as string | undefined,
    default_model: parsed?.default_model as string | undefined,
  };

  // Filter out empty strings
  for (const key of Object.keys(_config) as (keyof SageloopConfig)[]) {
    if (_config[key] === "") {
      _config[key] = undefined;
    }
  }

  return _config;
}

export function saveConfig(config: SageloopConfig): void {
  const content = yaml.dump({
    openai_api_key: config.openai_api_key || "",
    anthropic_api_key: config.anthropic_api_key || "",
    default_model: config.default_model || "gpt-4o-mini",
  });
  fs.writeFileSync(CONFIG_PATH, content, "utf-8");
  _config = null; // Clear cache so next read picks up changes
}

export function hasAnyApiKey(): boolean {
  const config = getConfig();
  return !!(config.openai_api_key || config.anthropic_api_key);
}

// Reset cache (useful for testing)
export function resetConfigCache(): void {
  _config = null;
}
