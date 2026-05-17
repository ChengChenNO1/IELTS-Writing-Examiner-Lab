import { Evaluation } from "../evaluator";
import { Topic } from "../data";
import { AiConfig } from "./config";
import { chatCompletion } from "./client";
import { buildExaminerSystemPrompt, buildExaminerUserPrompt } from "./prompt";
import { parseAiEvaluation } from "./parse";

export async function evaluateEssayWithAi(
  topic: Topic,
  essay: string,
  config: AiConfig,
  signal?: AbortSignal
): Promise<Evaluation> {
  const messages = [
    { role: "system" as const, content: buildExaminerSystemPrompt() },
    { role: "user" as const, content: buildExaminerUserPrompt(topic, essay) }
  ];

  const raw = await chatCompletion(config, messages, signal);
  return parseAiEvaluation(topic, essay, raw);
}
