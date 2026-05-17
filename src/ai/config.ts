export type AiProviderPreset = "ark" | "openai" | "deepseek" | "grok" | "openrouter" | "custom";

export type AiConfig = {
  enabled: boolean;
  provider: AiProviderPreset;
  apiKey: string;
  baseUrl: string;
  model: string;
  /** Use built-in key from .env.local (never committed). User key overrides when set. */
  useBuiltin: boolean;
};

const STORAGE_KEY = "ielts-ai-config";

export const PROVIDER_PRESETS: Record<
  Exclude<AiProviderPreset, "custom">,
  { label: string; baseUrl: string; models: string[]; keyPrefix?: string }
> = {
  ark: {
    label: "火山方舟 Ark（内置可选）",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    models: ["deepseek-v3-2-251201", "doubao-1-5-pro-32k", "doubao-1-5-lite-32k"],
    keyPrefix: "ark-"
  },
  openai: {
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "gpt-4.1"],
    keyPrefix: "sk-"
  },
  deepseek: {
    label: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    models: ["deepseek-chat", "deepseek-reasoner"],
    keyPrefix: "sk-"
  },
  grok: {
    label: "Grok (xAI)",
    baseUrl: "https://api.x.ai/v1",
    models: ["grok-3-mini", "grok-3", "grok-2-latest"],
    keyPrefix: "xai-"
  },
  openrouter: {
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    models: ["openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet", "google/gemini-2.0-flash-001"],
    keyPrefix: "sk-or-"
  }
};

export function getBuiltinArkKey(): string {
  const key = import.meta.env.VITE_BUILTIN_ARK_API_KEY?.trim() ?? "";
  return key;
}

export function hasBuiltinApi(): boolean {
  return getBuiltinArkKey().length > 12;
}

export function freshAiConfig(): AiConfig {
  if (hasBuiltinApi()) {
    const ark = PROVIDER_PRESETS.ark;
    return {
      enabled: true,
      provider: "ark",
      apiKey: "",
      baseUrl: ark.baseUrl,
      model: ark.models[0],
      useBuiltin: true
    };
  }
  return {
    enabled: false,
    provider: "openai",
    apiKey: "",
    baseUrl: PROVIDER_PRESETS.openai.baseUrl,
    model: PROVIDER_PRESETS.openai.models[0],
    useBuiltin: false
  };
}

export const DEFAULT_AI_CONFIG: AiConfig = freshAiConfig();

export function loadAiConfig(): AiConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshAiConfig();
    const parsed = JSON.parse(raw) as Partial<AiConfig>;
    const provider =
      parsed.provider && (parsed.provider === "custom" || parsed.provider in PROVIDER_PRESETS)
        ? parsed.provider
        : DEFAULT_AI_CONFIG.provider;
    return {
      ...freshAiConfig(),
      ...parsed,
      provider,
      enabled: Boolean(parsed.enabled),
      apiKey: String(parsed.apiKey ?? ""),
      baseUrl: String(parsed.baseUrl ?? PROVIDER_PRESETS[provider === "custom" ? "ark" : provider].baseUrl),
      model: String(parsed.model ?? PROVIDER_PRESETS[provider === "custom" ? "ark" : provider].models[0]),
      useBuiltin: parsed.useBuiltin !== false
    };
  } catch {
    return freshAiConfig();
  }
}

export function saveAiConfig(config: AiConfig) {
  const toSave = { ...config, apiKey: config.apiKey.trim() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
}

/** Never persist built-in key to localStorage — only env or user-typed key. */
export function resolveEffectiveConfig(config: AiConfig): AiConfig {
  const userKey = config.apiKey.trim();
  if (userKey) {
    return { ...config, apiKey: userKey };
  }
  if (config.useBuiltin && hasBuiltinApi()) {
    const ark = PROVIDER_PRESETS.ark;
    return {
      ...config,
      provider: config.provider === "custom" ? "ark" : config.provider,
      apiKey: getBuiltinArkKey(),
      baseUrl: config.baseUrl.trim() || ark.baseUrl,
      model: config.model.trim() || ark.models[0]
    };
  }
  return { ...config, apiKey: "" };
}

export function isAiReady(config: AiConfig) {
  const effective = resolveEffectiveConfig(config);
  return (
    config.enabled &&
    effective.apiKey.length > 8 &&
    effective.baseUrl.trim().length > 0 &&
    effective.model.trim().length > 0
  );
}

export function apiKeyHint(config: AiConfig): string | null {
  const key = config.apiKey.trim();
  if (!key) {
    if (config.useBuiltin && hasBuiltinApi()) return null;
    if (config.useBuiltin && !hasBuiltinApi()) {
      return "已勾选内置 API，但未检测到 .env.local 中的 VITE_BUILTIN_ARK_API_KEY。请复制 env.example 为 .env.local 并填入密钥。";
    }
    return null;
  }

  if (config.provider === "ark" && !key.startsWith("ark-")) {
    return "火山方舟密钥通常以 ark- 开头。";
  }

  if (config.provider === "grok") {
    if (!key.startsWith("xai-")) {
      return "Grok (xAI) 密钥应以 xai- 开头，不是 sk-。";
    }
    if (config.baseUrl && !config.baseUrl.includes("x.ai")) {
      return "Grok 的 Base URL 应为 https://api.x.ai/v1";
    }
  }

  if (config.provider === "openai" && key.startsWith("xai-")) {
    return "OpenAI 密钥通常以 sk- 开头，不是 xai-。";
  }

  if (config.provider === "openrouter" && !key.startsWith("sk-or-")) {
    return "OpenRouter 密钥通常以 sk-or- 开头。";
  }

  return null;
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
