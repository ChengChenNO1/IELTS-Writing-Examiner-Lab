export type AiProviderPreset = "openai" | "deepseek" | "grok" | "openrouter" | "custom";

export type AiConfig = {
  enabled: boolean;
  provider: AiProviderPreset;
  apiKey: string;
  baseUrl: string;
  model: string;
};

const STORAGE_KEY = "ielts-ai-config";

export const PROVIDER_PRESETS: Record<
  Exclude<AiProviderPreset, "custom">,
  { label: string; baseUrl: string; models: string[] }
> = {
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"]
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-reasoner"]
  },
  grok: {
    label: "Grok (xAI)",
    baseUrl: "https://api.x.ai/v1",
    models: ["grok-3-mini", "grok-3", "grok-2-latest"]
  },
  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    models: ["openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet", "google/gemini-2.0-flash-001"]
  }
};

export const DEFAULT_AI_CONFIG: AiConfig = {
  enabled: false,
  provider: "openai",
  apiKey: "",
  baseUrl: PROVIDER_PRESETS.openai.baseUrl,
  model: PROVIDER_PRESETS.openai.models[0]
};

export function loadAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_AI_CONFIG };
    const parsed = JSON.parse(raw) as Partial<AiConfig>;
    const provider =
      parsed.provider && (parsed.provider === "custom" || parsed.provider in PROVIDER_PRESETS)
        ? parsed.provider
        : DEFAULT_AI_CONFIG.provider;
    return {
      ...DEFAULT_AI_CONFIG,
      ...parsed,
      provider,
      enabled: Boolean(parsed.enabled),
      apiKey: String(parsed.apiKey ?? ""),
      baseUrl: String(parsed.baseUrl ?? DEFAULT_AI_CONFIG.baseUrl),
      model: String(parsed.model ?? DEFAULT_AI_CONFIG.model)
    };
  } catch {
    return { ...DEFAULT_AI_CONFIG };
  }
}

export function saveAiConfig(config: AiConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function isAiReady(config: AiConfig) {
  return config.enabled && config.apiKey.trim().length > 8 && config.baseUrl.trim().length > 0 && config.model.trim().length > 0;
}

export function applyProviderPreset(config: AiConfig, provider: AiProviderPreset): AiConfig {
  if (provider === "custom") {
    return { ...config, provider };
  }
  const preset = PROVIDER_PRESETS[provider];
  return {
    ...config,
    provider,
    baseUrl: preset.baseUrl,
    model: preset.models[0]
  };
}
