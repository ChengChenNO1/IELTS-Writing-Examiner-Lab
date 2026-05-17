import { useState } from "react";
import { KeyRound, Sparkles } from "lucide-react";
import {
  AiConfig,
  AiProviderPreset,
  DEFAULT_AI_CONFIG,
  PROVIDER_PRESETS,
  applyProviderPreset,
  isAiReady,
  loadAiConfig,
  saveAiConfig
} from "./config";

type Props = {
  config: AiConfig;
  onChange: (config: AiConfig) => void;
};

export function ApiSettingsPanel({ config, onChange }: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  function update(patch: Partial<AiConfig>) {
    const next = { ...config, ...patch };
    onChange(next);
    saveAiConfig(next);
  }

  function switchProvider(provider: AiProviderPreset) {
    update(applyProviderPreset(config, provider));
  }

  async function testConnection() {
    setTesting(true);
    setTestResult(null);
    try {
      const base = config.baseUrl.replace(/\/+$/, "");
      const res = await fetch(`${base}/models`, {
        headers: { Authorization: `Bearer ${config.apiKey.trim()}` }
      });
      if (res.ok) {
        setTestResult("连接成功，可以开始 AI 阅卷。");
      } else {
        const text = await res.text().catch(() => "");
        setTestResult(`连接失败 (${res.status})：${text.slice(0, 120)}`);
      }
    } catch (err) {
      setTestResult(err instanceof Error ? err.message : "连接失败");
    } finally {
      setTesting(false);
    }
  }

  const presetModels =
    config.provider !== "custom" ? PROVIDER_PRESETS[config.provider]?.models ?? [] : [];

  return (
    <section className="panel api-settings">
      <div className="section-title">
        <KeyRound size={18} />
        <h2>AI 阅卷设置</h2>
      </div>
      <label className="api-toggle">
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(event) => update({ enabled: event.target.checked })}
        />
        启用 AI 阅卷（润色反馈需 API）
      </label>
      <p className="bank-status">密钥仅保存在本机浏览器，不会上传到我们的服务器。</p>

      <label className="api-field">
        <span>服务商</span>
        <select
          value={config.provider}
          onChange={(event) => switchProvider(event.target.value as AiProviderPreset)}
        >
          <option value="openai">OpenAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="grok">Grok (xAI)</option>
          <option value="openrouter">OpenRouter</option>
          <option value="custom">自定义（兼容 OpenAI API）</option>
        </select>
      </label>

      <label className="api-field">
        <span>API Key</span>
        <input
          type="password"
          value={config.apiKey}
          onChange={(event) => update({ apiKey: event.target.value })}
          placeholder={config.provider === "grok" ? "xai-..." : "sk-..."}
          autoComplete="off"
        />
      </label>

      <label className="api-field">
        <span>Base URL</span>
        <input
          value={config.baseUrl}
          onChange={(event) => update({ baseUrl: event.target.value })}
          placeholder={DEFAULT_AI_CONFIG.baseUrl}
        />
      </label>

      <label className="api-field">
        <span>模型</span>
        {presetModels.length > 0 ? (
          <select value={config.model} onChange={(event) => update({ model: event.target.value })}>
            {presetModels.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
            {!presetModels.includes(config.model) && <option value={config.model}>{config.model}</option>}
          </select>
        ) : (
          <input value={config.model} onChange={(event) => update({ model: event.target.value })} placeholder="gpt-4o-mini" />
        )}
      </label>

      <div className="api-actions">
        <button className="ghost" type="button" onClick={testConnection} disabled={testing || !config.apiKey.trim()}>
          {testing ? "测试中…" : "测试连接"}
        </button>
        <span className={`api-status ${isAiReady(config) ? "ready" : ""}`}>
          <Sparkles size={14} />
          {isAiReady(config) ? "AI 已就绪" : "未配置"}
        </span>
      </div>
      {testResult && <p className="bank-status">{testResult}</p>}
    </section>
  );
}
