import { Evaluation } from "../evaluator";
import { Topic } from "../data";
import { AiConfig, resolveEffectiveConfig } from "./config";
import { chatCompletion } from "./client";
import { buildExaminerSystemPrompt, buildExaminerUserPrompt } from "./prompt";
import { parseAiEvaluation } from "./parse";

export async function evaluateEssayWithAi(
  topic: Topic,
  essay: string,
  config: AiConfig,
  signal?: AbortSignal
): Promise<Evaluation> {
  const effective = resolveEffectiveConfig(config);
  if (!effective.apiKey) {
    throw new Error("未配置 API 密钥。请填写自己的 Key，或在本地 .env.local 配置内置密钥。");
  }

  const messages = [
    { role: "system" as const, content: buildExaminerSystemPrompt() },
    { role: "user" as const, content: buildExaminerUserPrompt(topic, essay) }
  ];

  const raw = await chatCompletion(effective, messages, signal);
  return parseAiEvaluation(topic, essay, raw);
}
