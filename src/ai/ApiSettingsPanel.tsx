import { useState } from "react";
import { KeyRound, Sparkles } from "lucide-react";
import {
  AiConfig,
  AiProviderPreset,
  PROVIDER_PRESETS,
  applyProviderPreset,
  apiKeyHint,
  configForApiKeyInput,
  hasBuiltinApi,
  isAiReady,
  resolveEffectiveConfig,
  saveAiConfig
} from "./config";

type Props = {
  config: AiConfig;
  onChange: (config: AiConfig) => void;
};

export function ApiSettingsPanel({ config, onChange }: Props) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const builtinAvailable = hasBuiltinApi();
  const usingBuiltin = builtinAvailable && config.useBuiltin && !config.apiKey.trim();
  const keyHint = apiKeyHint(config);

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
      const effective = resolveEffectiveConfig(config);
      if (!effective.apiKey) {
        setTestResult("没有可用密钥。请配置 .env.local 或填写自己的 API Key。");
        return;
      }
      const base = effective.baseUrl.replace(/\/+$/, "");
      const res = await fetch(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${effective.apiKey}`
        },
        body: JSON.stringify({
          model: effective.model,
          max_tokens: 16,
          messages: [{ role: "user", content: "Reply with OK only." }]
        })
      });
      if (res.ok) {
        setTestResult(usingBuiltin ? "连接成功（使用本地内置密钥）。" : "连接成功，可以开始 AI 阅卷。");
      } else {
        const text = await res.text().catch(() => "");
        setTestResult(`连接失败 (${res.status})：${text.slice(0, 160)}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "连接失败";
      if (
        config.provider === "ark" &&
        /failed to fetch|networkerror|load failed/i.test(msg)
      ) {
        setTestResult(
          `${msg}。若仅在 GitHub Pages 上出现，可能是浏览器跨域限制；请在本机 npm run dev 使用，或确认方舟控制台已允许浏览器调用。`
        );
      } else {
        setTestResult(msg);
      }
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
        <input type="checkbox" checked={config.enabled} onChange={(event) => update({ enabled: event.target.checked })} />
        启用 AI 阅卷
      </label>

      {builtinAvailable ? (
        <label className="api-toggle">
          <input
            type="checkbox"
            checked={config.useBuiltin}
            onChange={(event) => update({ useBuiltin: event.target.checked })}
          />
          使用内置 API（仅本机 .env.local，不会上传 GitHub）
        </label>
      ) : (
        <p className="bank-status">
          内置 API：在项目根目录创建 <code>.env.local</code>，参考 <code>env.example</code> 填入{" "}
          <code>VITE_BUILTIN_ARK_API_KEY</code>，然后重启 <code>npm run dev</code>。
        </p>
      )}

      {usingBuiltin && (
        <p className="bank-status api-builtin-ready">已加载内置密钥（本地环境）。填写下方自定义 Key 可覆盖。</p>
      )}

      {!builtinAvailable && (
        <p className="bank-status api-online-hint">
          线上版（GitHub Pages）无内置密钥。请选择「火山方舟 Ark」，在下方粘贴以 <code>ark-</code> 开头的密钥。
        </p>
      )}

      <p className="bank-status">自定义密钥只保存在浏览器，不会进入 Git 仓库。</p>

      <label className="api-field">
        <span>服务商</span>
        <select value={config.provider} onChange={(event) => switchProvider(event.target.value as AiProviderPreset)}>
          <option value="ark">火山方舟 Ark（DeepSeek 等）</option>
          <option value="openai">OpenAI</option>
          <option value="deepseek">DeepSeek</option>
          <option value="grok">Grok (xAI)</option>
          <option value="openrouter">OpenRouter</option>
          <option value="custom">自定义（OpenAI 兼容）</option>
        </select>
      </label>

      <label className="api-field">
        <span>{builtinAvailable ? "自定义 API Key（可选，覆盖内置）" : "API Key"}</span>
        <input
          type="password"
          value={config.apiKey}
          onChange={(event) => update(configForApiKeyInput(config, event.target.value))}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text");
            if (pasted.trim().startsWith("ark-")) {
              event.preventDefault();
              update(configForApiKeyInput(config, pasted));
            }
          }}
          placeholder={
            config.provider === "grok"
              ? "xai-..."
              : config.provider === "ark"
                ? builtinAvailable
                  ? "ark-...（留空则用内置）"
                  : "ark-..."
                : "sk-... 或 ark-..."
          }
          autoComplete="off"
          spellCheck={false}
        />
      </label>
      {keyHint && <p className="eval-error">{keyHint}</p>}

      <label className="api-field">
        <span>Base URL</span>
        <input value={config.baseUrl} onChange={(event) => update({ baseUrl: event.target.value })} />
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
          <input value={config.model} onChange={(event) => update({ model: event.target.value })} />
        )}
      </label>

      <div className="api-actions">
        <button className="ghost" type="button" onClick={testConnection} disabled={testing}>
          {testing ? "测试中…" : "测试连接"}
        </button>
        <span className={`api-status ${isAiReady(config) ? "ready" : ""}`}>
          <Sparkles size={14} />
          {isAiReady(config) ? (usingBuiltin ? "内置 AI 就绪" : "AI 已就绪") : "未配置"}
        </span>
      </div>
      {testResult && <p className="bank-status">{testResult}</p>}
    </section>
  );
}
