import { AiConfig } from "./config";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export async function chatCompletion(config: AiConfig, messages: ChatMessage[], signal?: AbortSignal) {
  const base = normalizeBaseUrl(config.baseUrl.trim());
  const endpoint = `${base}/chat/completions`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey.trim()}`
    },
    body: JSON.stringify({
      model: config.model.trim(),
      temperature: 0.2,
      messages,
      response_format: { type: "json_object" }
    }),
    signal
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text.slice(0, 280) || res.statusText}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("API returned empty content");
  return content;
}
