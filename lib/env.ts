import { getConfig } from "@/lib/config";

export const env = {
  get openai() {
    const config = getConfig();
    return {
      apiKey: config.openai_api_key,
    };
  },
  get anthropic() {
    const config = getConfig();
    return {
      apiKey: config.anthropic_api_key,
    };
  },
  nodeEnv: process.env.NODE_ENV || "development",
  isTest: process.env.NODE_ENV === "test",
  isDev: process.env.NODE_ENV !== "production",
};
