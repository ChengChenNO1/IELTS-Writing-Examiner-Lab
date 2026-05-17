import { rubric, Topic } from "./data";
import { productionPrompt } from "./ai/prompt";

export { productionPrompt };

export type Criterion = "TR" | "CC" | "LR" | "GRA";

export type CriterionResult = {
  id: Criterion;
  name: string;
  band: number;
  rationale: string;
  evidence: string[];
  rubricAnchor: string;
};

export type PolishEdit = {
  original: string;
  revised: string;
  note: string;
  noteZh?: string;
};

export type PolishFeedback = {
  summary: string;
  summaryZh?: string;
  paragraphEdits: PolishEdit[];
  nativeExpressions: string[];
  avoidPhrases: string[];
  modelParagraph?: string;
};

export type Evaluation = {
  overall: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  criteria: CriterionResult[];
  argument: {
    title: string;
    claims: string[];
    evidence: string[];
    gaps: string[];
    counterargument: string;
  };
  risks: string[];
  rewrite: string;
  promptBlueprint: string;
  mode: "local" | "ai";
  polish?: PolishFeedback;
};

const criterionNames: Record<Criterion, string> = {
  TR: "Task Response / Achievement",
  CC: "Coherence & Cohesion",
  LR: "Lexical Resource",
  GRA: "Grammar Range & Accuracy"
};

const connectors = [
  "however",
  "therefore",
  "moreover",
  "furthermore",
  "nevertheless",
  "for example",
  "for instance",
  "in contrast",
  "as a result",
  "on the other hand",
  "although",
  "because",
  "while"
];

const task1FeatureMarkers = ["overall", "respectively", "compared", "whereas", "increased", "decreased", "remained", "rose", "fell", "highest", "lowest"];
const stanceMarkers = ["i believe", "i think", "in my view", "my opinion", "i would argue", "this essay"];
const supportMarkers = ["for example", "for instance", "such as", "because", "as a result", "evidence", "study", "data"];
const templatePhrases = [
  "in this modern era",
  "nowadays",
  "with the development of society",
  "there are two sides to every coin",
  "this essay will discuss",
  "last but not least"
];
const complexMarkers = ["although", "while", "whereas", "because", "which", "that", "if", "when", "despite"];

function words(text: string) {
  return text.toLowerCase().match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
}

function sentences(text: string) {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function clampBand(value: number) {
  return Math.max(1, Math.min(9, Math.round(value * 2) / 2));
}

function quote(items: string[], fallback: string) {
  return items.slice(0, 2).map((item) => item.length > 150 ? `${item.slice(0, 147)}...` : item) || [fallback];
}

function keywordCoverage(allWords: string[], topic: Topic) {
  const set = new Set(allWords);
  return topic.keywords.filter((keyword) => set.has(keyword.toLowerCase())).length / topic.keywords.length;
}

export function essaySurfaceStats(essay: string) {
  const clean = essay.trim();
  const allWords = words(clean);
  return {
    wordCount: allWords.length,
    sentenceCount: sentences(clean).length,
    paragraphCount: paragraphs(clean).length
  };
}

export function evaluateEssay(topic: Topic, essay: string): Evaluation {
  const clean = essay.trim();
  const allWords = words(clean);
  const uniqueRatio = allWords.length ? new Set(allWords).size / allWords.length : 0;
  const sent = sentences(clean);
  const paras = paragraphs(clean);
  const lower = clean.toLowerCase();
  const coverage = keywordCoverage(allWords, topic);
  const connectorHits = connectors.filter((c) => lower.includes(c));
  const task1FeatureHits = task1FeatureMarkers.filter((m) => lower.includes(m));
  const supportHits = topic.task === "task1" ? task1FeatureHits : supportMarkers.filter((m) => lower.includes(m));
  const stanceHits = stanceMarkers.filter((m) => lower.includes(m));
  const complexHits = complexMarkers.filter((m) => lower.includes(m));
  const templateHits = templatePhrases.filter((p) => lower.includes(p));
  const avgSentenceLength = sent.length ? allWords.length / sent.length : 0;
  const longSentences = sent.filter((s) => words(s).length > 32);
  const shortSentences = sent.filter((s) => words(s).length < 8);
  const examples = sent.filter((s) => supportMarkers.some((m) => s.toLowerCase().includes(m)));
  const task1Features = sent.filter((s) => task1FeatureMarkers.some((m) => s.toLowerCase().includes(m)));
  const claims = sent.filter((s) => stanceMarkers.some((m) => s.toLowerCase().includes(m)) || /\bshould|must|need to|important|benefit|problem\b/i.test(s));
  const minimumWords = topic.task === "task1" ? 150 : 250;
  const underlengthThreshold = topic.task === "task1" ? 130 : 230;
  const taskCriterionName = topic.task === "task1" ? "Task Achievement" : "Task Response";

  if (allWords.length <= 20) {
    const criteria = (["TR", "CC", "LR", "GRA"] as Criterion[]).map((id) => ({
      id,
      name: id === "TR" ? taskCriterionName : criterionNames[id],
      band: 1,
      rationale: "The response is too short to provide rateable evidence.",
      evidence: [clean || "No essay submitted."],
      rubricAnchor: rubric[id][1 as keyof typeof rubric[typeof id]]
    }));
    return {
      overall: 1,
      wordCount: allWords.length,
      sentenceCount: sent.length,
      paragraphCount: paras.length,
      criteria,
      argument: {
        title: topic.task === "task1" ? "Task 1 feature analysis" : "Argument mining",
        claims: [],
        evidence: [],
        gaps: [topic.task === "task1" ? "The answer is too short to identify an overview or key features." : "The answer is too short to establish an argument."],
        counterargument: topic.task === "task1" ? "Not applicable for Task 1." : "Not present."
      },
      risks: ["Underlength response"],
      rewrite:
        topic.task === "task1"
          ? "Write at least 150 words with a clear overview, selected key features, and relevant comparisons."
          : "Write at least 250 words with a clear position, two developed body paragraphs, and specific support.",
      promptBlueprint: productionPrompt(topic, clean),
      mode: "local"
    };
  }

  let tr = 5 + coverage * 1.6 + Math.min(supportHits.length, 3) * 0.25 + Math.min(stanceHits.length, 2) * 0.3;
  if (topic.task === "task1") {
    tr += lower.includes("overall") ? 0.5 : -0.7;
    tr += task1Features.length >= 3 ? 0.4 : -0.4;
    tr += stanceHits.length ? -0.6 : 0.2;
  }
  if (allWords.length < underlengthThreshold) tr -= 0.8;
  if (topic.task === "task2" && examples.length === 0) tr -= 0.6;
  if (topic.task === "task2" && claims.length > examples.length + 4) tr -= 0.4;
  if (templateHits.length) tr -= 0.3;

  let cc = 4.8 + Math.min(paras.length, 4) * 0.35 + Math.min(connectorHits.length, 5) * 0.22;
  if (paras.length < 3) cc -= 0.7;
  if (connectorHits.length > 8) cc -= 0.4;
  if (longSentences.length > sent.length / 3) cc -= 0.3;

  let lr = 4.8 + uniqueRatio * 2.4 + Math.min(allWords.length / (topic.task === "task1" ? 190 : 280), 1) * 0.6;
  if (templateHits.length) lr -= 0.5;
  if (/\butilize|ameliorate|plethora|ubiquitous|paradigm\b/i.test(clean) && supportHits.length < 2) lr -= 0.3;
  if (allWords.length < underlengthThreshold) lr -= 0.4;

  let gra = 4.7 + Math.min(complexHits.length, 7) * 0.22 + Math.min(sent.length, 12) * 0.08;
  if (avgSentenceLength > 28) gra -= 0.5;
  if (shortSentences.length > sent.length / 3) gra -= 0.3;
  if (/\b(is|are|was|were) have\b|\bpeople is\b|\bstudents has\b/i.test(clean)) gra -= 0.6;

  const bands = {
    TR: clampBand(tr),
    CC: clampBand(cc),
    LR: clampBand(lr),
    GRA: clampBand(gra)
  };
  const overall = clampBand((bands.TR + bands.CC + bands.LR + bands.GRA) / 4);

  const risks = [
    allWords.length < minimumWords ? `Below the usual ${topic.task === "task1" ? "Task 1" : "Task 2"} target length; evidence may be insufficient.` : "",
    templateHits.length ? `Template-like phrasing detected: ${templateHits.join(", ")}.` : "",
    topic.task === "task2" && examples.length === 0 ? "Claims are not supported by specific examples or evidence." : "",
    topic.task === "task1" && !lower.includes("overall") ? "No clear overview detected; Task 1 scripts usually need an overview of the main trends/features." : "",
    topic.task === "task1" && stanceHits.length ? "Opinion language detected; Task 1 should report data/features rather than argue a personal position." : "",
    coverage < 0.45 ? "Several prompt keywords are not clearly addressed." : "",
    connectorHits.length > 8 ? "Cohesive devices may be overused or mechanical." : ""
  ].filter(Boolean);

  const criteria: CriterionResult[] = [
    {
      id: "TR",
      name: taskCriterionName,
      band: bands.TR,
      rationale:
        topic.task === "task1"
          ? bands.TR >= 7
            ? "The response selects key features and includes an overview, though comparisons may still need sharper prioritisation."
            : "The response reports the task, but the overview, key feature selection, or comparisons limit the band."
          : bands.TR >= 7
            ? "The response addresses the main prompt parts with a clear position, though some supporting material may need sharper focus."
            : "The response is relevant, but the position or support is not developed enough for a higher band.",
      evidence: topic.task === "task1" ? quote(task1Features.length ? task1Features : sent, "No clear overview or key feature was detected.") : quote(claims.length ? claims : sent, "No clear claim was detected."),
      rubricAnchor: rubric.TR[Math.floor(bands.TR) as keyof typeof rubric.TR]
    },
    {
      id: "CC",
      name: criterionNames.CC,
      band: bands.CC,
      rationale:
        bands.CC >= 7
          ? "Ideas show a logical route through the response, with only minor risk of mechanical linking."
          : "Organisation is visible, but paragraphing or sentence-to-sentence progression limits coherence.",
      evidence: quote(paras, "Paragraphing is not visible."),
      rubricAnchor: rubric.CC[Math.floor(bands.CC) as keyof typeof rubric.CC]
    },
    {
      id: "LR",
      name: criterionNames.LR,
      band: bands.LR,
      rationale:
        bands.LR >= 7
          ? "Vocabulary is flexible enough for the task, though precision and natural collocation still matter."
          : "Vocabulary communicates the message, but range and precision are not yet strong enough for a higher band.",
      evidence: templateHits.length ? templateHits : quote(sent, "No lexical evidence available."),
      rubricAnchor: rubric.LR[Math.floor(bands.LR) as keyof typeof rubric.LR]
    },
    {
      id: "GRA",
      name: criterionNames.GRA,
      band: bands.GRA,
      rationale:
        bands.GRA >= 7
          ? "There is evidence of complex structure control, with remaining errors unlikely to block communication."
          : "The response relies on a limited range or contains sentence-control issues that restrict the band.",
      evidence: quote(longSentences.length ? longSentences : sent, "No grammar evidence available."),
      rubricAnchor: rubric.GRA[Math.floor(bands.GRA) as keyof typeof rubric.GRA]
    }
  ];

  const gaps = [
    topic.task === "task1" && !lower.includes("overall") ? "Add a clear overview sentence that summarises the dominant trend or most important contrast." : "",
    topic.task === "task1" && task1Features.length < 3 ? "Select more key features and compare them directly instead of listing details mechanically." : "",
    topic.task === "task2" && examples.length < 2 ? "Add concrete examples that prove the main claims instead of only asserting them." : "",
    topic.task === "task2" && claims.length > examples.length + 3 ? "Several claims are not connected to evidence or reasoning." : "",
    topic.task === "task2" && !/however|although|while|on the other hand|critics|opponents/i.test(clean) ? "Counterargument or concession is weak or absent." : ""
  ].filter(Boolean);

  const rewrite =
    topic.task === "task1"
      ? [
          "Polished reference direction:",
          "Start with a paraphrase of the visual task, then give a clear overview of the most important trend, contrast, stage, or change.",
          "Group details by meaningful comparison instead of listing every number.",
          "Use neutral reporting verbs such as increased, decreased, remained stable, accounted for, and was followed by.",
          `Possible overview: Overall, the most noticeable feature is the change in ${topic.keywords[0]}, while the remaining categories show a less dramatic pattern.`
        ].join("\n")
      : [
          "Polished reference direction:",
          "The essay should open with a direct answer to the question, not a memorised introduction.",
          "Each body paragraph should follow claim -> reason -> specific example -> consequence.",
          "A stronger version would replace broad statements with precise causal links and use one concession before the conclusion.",
          `Possible thesis: While ${topic.keywords[0]} can create genuine concerns, its value depends on how clearly it is managed and whether the main risks are addressed in practice.`
        ].join("\n");

  return {
    overall,
    wordCount: allWords.length,
    sentenceCount: sent.length,
    paragraphCount: paras.length,
    criteria,
    argument: {
      title: topic.task === "task1" ? "Task 1 feature analysis" : "Argument mining",
      claims: topic.task === "task1" ? task1Features.slice(0, 4) : claims.slice(0, 4),
      evidence: topic.task === "task1" ? sent.filter((s) => /\d|%|percent|percentage|number|amount|figure|stage|step/i.test(s)).slice(0, 4) : examples.slice(0, 4),
      gaps: gaps.length ? gaps : ["The argument is generally traceable; improvement depends on precision and depth."],
      counterargument:
        topic.task === "task1"
          ? "Not applicable; Task 1 should summarise visual information without a personal argument."
          : /however|although|while|on the other hand|critics|opponents/i.test(clean)
            ? "A concession or opposing view is present."
            : "No explicit opposing view was detected."
    },
    risks,
    rewrite,
    promptBlueprint: productionPrompt(topic, clean),
    mode: "local"
  };
}
