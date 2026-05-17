import { Criterion, CriterionResult, Evaluation, PolishFeedback, essaySurfaceStats, productionPrompt } from "../evaluator";
import { Topic } from "../data";

type RawCriterion = {
  id?: string;
  name?: string;
  band?: number;
  rationale?: string;
  evidence?: string[];
  rubricAnchor?: string;
};

type RawAiPayload = {
  overall?: number;
  criteria?: RawCriterion[];
  argument?: {
    title?: string;
    claims?: string[];
    evidence?: string[];
    gaps?: string[];
    counterargument?: string;
  };
  risks?: string[];
  rewrite?: string;
  polish?: {
    summary?: string;
    summaryZh?: string;
    paragraphEdits?: Array<{
      original?: string;
      revised?: string;
      note?: string;
      noteZh?: string;
    }>;
    nativeExpressions?: string[];
    avoidPhrases?: string[];
    modelParagraph?: string;
  };
};

function stripJsonFence(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function clampBand(value: number) {
  return Math.max(1, Math.min(9, Math.round(value * 2) / 2));
}

const CRITERION_NAMES: Record<Criterion, string> = {
  TR: "Task Response / Achievement",
  CC: "Coherence & Cohesion",
  LR: "Lexical Resource",
  GRA: "Grammar Range & Accuracy"
};

function parseCriterion(item: RawCriterion | undefined, id: Criterion, trName: string): CriterionResult {
  return {
    id,
    name: id === "TR" ? trName : String(item?.name ?? CRITERION_NAMES[id]),
    band: clampBand(Number(item?.band) || 5),
    rationale: String(item?.rationale ?? "No rationale provided."),
    evidence: Array.isArray(item?.evidence) && item.evidence.length ? item.evidence.map(String) : ["No evidence quoted."],
    rubricAnchor: String(item?.rubricAnchor ?? "")
  };
}

function parsePolish(raw: RawAiPayload["polish"]): PolishFeedback | undefined {
  if (!raw) return undefined;
  const edits = Array.isArray(raw.paragraphEdits)
    ? raw.paragraphEdits
        .filter((e) => e?.original && e?.revised)
        .map((e) => ({
          original: String(e.original),
          revised: String(e.revised),
          note: String(e.note ?? ""),
          noteZh: e.noteZh ? String(e.noteZh) : undefined
        }))
    : [];

  return {
    summary: String(raw.summary ?? ""),
    summaryZh: raw.summaryZh ? String(raw.summaryZh) : undefined,
    paragraphEdits: edits,
    nativeExpressions: Array.isArray(raw.nativeExpressions) ? raw.nativeExpressions.map(String) : [],
    avoidPhrases: Array.isArray(raw.avoidPhrases) ? raw.avoidPhrases.map(String) : [],
    modelParagraph: raw.modelParagraph ? String(raw.modelParagraph) : undefined
  };
}

export function parseAiEvaluation(topic: Topic, essay: string, rawText: string): Evaluation {
  const parsed = JSON.parse(stripJsonFence(rawText)) as RawAiPayload;
  const stats = essaySurfaceStats(essay);
  const trName = topic.task === "task1" ? "Task Achievement" : "Task Response";

  const criteriaRaw = Array.isArray(parsed.criteria) ? parsed.criteria : [];
  const order: Criterion[] = ["TR", "CC", "LR", "GRA"];
  const criteria: CriterionResult[] = order.map((id, index) => {
    const found = criteriaRaw.find((c) => c.id === id) ?? criteriaRaw[index];
    return parseCriterion(found ?? { id, band: 5 }, id, trName);
  });

  const bands = criteria.map((c) => c.band);
  const overall = clampBand(
    typeof parsed.overall === "number" && !Number.isNaN(parsed.overall)
      ? parsed.overall
      : bands.reduce((a, b) => a + b, 0) / bands.length
  );

  return {
    overall,
    ...stats,
    criteria,
    argument: {
      title: String(parsed.argument?.title ?? (topic.task === "task1" ? "Task 1 feature analysis" : "Argument mining")),
      claims: Array.isArray(parsed.argument?.claims) ? parsed.argument!.claims!.map(String) : [],
      evidence: Array.isArray(parsed.argument?.evidence) ? parsed.argument!.evidence!.map(String) : [],
      gaps: Array.isArray(parsed.argument?.gaps) ? parsed.argument!.gaps!.map(String) : [],
      counterargument: String(parsed.argument?.counterargument ?? "")
    },
    risks: Array.isArray(parsed.risks) ? parsed.risks.map(String) : [],
    rewrite: String(parsed.rewrite ?? ""),
    promptBlueprint: productionPrompt(topic, essay),
    mode: "ai",
    polish: parsePolish(parsed.polish)
  };
}
